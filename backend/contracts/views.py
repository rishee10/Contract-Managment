from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Blueprint, Contract, ContractField
from .serializers import (
    BlueprintSerializer,
    ContractCreateSerializer,
    ContractFieldValueUpdateSerializer,
    ContractSerializer,
    ContractTransitionSerializer,
)
from .service import can_edit_fields, can_transition


class BlueprintViewSet(viewsets.ModelViewSet):
    queryset = Blueprint.objects.prefetch_related("fields").all().order_by("-created_at")
    serializer_class = BlueprintSerializer


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related("blueprint").prefetch_related("fields").all().order_by("-created_at")
    serializer_class = ContractSerializer

    def create(self, request, *args, **kwargs):
        serializer = ContractCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        name = serializer.validated_data["name"]
        blueprint_id = serializer.validated_data["blueprint_id"]

        blueprint = Blueprint.objects.prefetch_related("fields").get(id=blueprint_id)
        with transaction.atomic():
            contract = Contract.objects.create(name=name, blueprint=blueprint, status="CREATED")
            ContractField.objects.bulk_create(
                [
                    ContractField(
                        contract=contract,
                        field_type=f.field_type,
                        label=f.label,
                        position_x=f.position_x,
                        position_y=f.position_y,
                        value=None,
                    )
                    for f in blueprint.fields.all()
                ]
            )

        return Response(ContractSerializer(contract).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        # Disallow mutating Contract rows via the generic update; use dedicated actions.
        return Response(
            {"detail": "Use /transition or /update_fields endpoints."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        contract = self.get_object()
        serializer = ContractTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["new_status"]

        if not can_transition(contract.status, new_status):
            return Response(
                {
                    "detail": "Invalid lifecycle transition.",
                    "current_status": contract.status,
                    "attempted_status": new_status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        contract.status = new_status
        contract.save(update_fields=["status"])
        return Response(ContractSerializer(contract).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def update_fields(self, request, pk=None):
        contract = self.get_object()
        if not can_edit_fields(contract.status):
            return Response(
                {"detail": f"Contract fields are immutable in status '{contract.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ContractFieldValueUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data["fields"]

        # Validate + apply
        id_to_value = {}
        for item in updates:
            if "id" not in item:
                return Response({"detail": "Each field update must include 'id'."}, status=status.HTTP_400_BAD_REQUEST)
            id_to_value[int(item["id"])] = item.get("value", None)

        fields = list(contract.fields.filter(id__in=list(id_to_value.keys())))
        if len(fields) != len(id_to_value):
            return Response(
                {"detail": "One or more field IDs do not belong to this contract."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for f in fields:
            f.value = id_to_value[f.id]

        ContractField.objects.bulk_update(fields, ["value"])
        contract.refresh_from_db()
        return Response(ContractSerializer(contract).data, status=status.HTTP_200_OK)
