from django.contrib import admin

from .models import Blueprint, BlueprintField, Contract, ContractField

@admin.register(Blueprint)
class BlueprintAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)

@admin.register(BlueprintField)
class BlueprintFieldAdmin(admin.ModelAdmin):
    list_display = ("id", "blueprint", "field_type", "label", "position_x", "position_y")
    list_filter = ("field_type",)
    search_fields = ("label",)

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "blueprint", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name",)

@admin.register(ContractField)
class ContractFieldAdmin(admin.ModelAdmin):
    list_display = ("id", "contract", "field_type", "label", "position_x", "position_y")
    list_filter = ("field_type",)
    search_fields = ("label",)
