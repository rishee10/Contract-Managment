from rest_framework import serializers
from .models import Blueprint, BlueprintField, Contract, ContractField
from .service import allowed_transitions

class BlueprintFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlueprintField
        fields = ["id", "field_type", "label", "position_x", "position_y"]

class BlueprintSerializer(serializers.ModelSerializer):
    fields = BlueprintFieldSerializer(many=True)

    class Meta:
        model = Blueprint
        fields = ["id", "name", "created_at", "fields"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        fields_data = validated_data.pop('fields')
        blueprint = Blueprint.objects.create(**validated_data)
        for field in fields_data:
            BlueprintField.objects.create(blueprint=blueprint, **field)
        return blueprint

    def update(self, instance, validated_data):
        # Replace blueprint fields (simple and predictable for the UI).
        fields_data = validated_data.pop("fields", None)
        instance.name = validated_data.get("name", instance.name)
        instance.save()

        if fields_data is not None:
            instance.fields.all().delete()
            for field in fields_data:
                BlueprintField.objects.create(blueprint=instance, **field)
        return instance


class ContractFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractField
        fields = ["id", "field_type", "label", "position_x", "position_y", "value"]
        read_only_fields = ["id", "field_type", "label", "position_x", "position_y"]

class ContractSerializer(serializers.ModelSerializer):
    blueprint_name = serializers.CharField(source="blueprint.name", read_only=True)
    fields = ContractFieldSerializer(many=True, read_only=True)
    allowed_transitions = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = ["id", "name", "blueprint", "blueprint_name", "status", "created_at", "fields", "allowed_transitions"]
        read_only_fields = ["id", "status", "created_at"]

    def get_allowed_transitions(self, obj):
        return allowed_transitions(obj.status)


class ContractCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    blueprint_id = serializers.IntegerField()


class ContractTransitionSerializer(serializers.Serializer):
    new_status = serializers.ChoiceField(choices=[c[0] for c in Contract.STATUS_CHOICES])


class ContractFieldValueUpdateSerializer(serializers.Serializer):
    # list of {id, value}
    fields = serializers.ListField(child=serializers.DictField(), allow_empty=False)
