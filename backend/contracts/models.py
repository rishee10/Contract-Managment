from django.db import models

# Create your models here.

from django.db import models

class Blueprint(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

class BlueprintField(models.Model):
    FIELD_TYPES = [
        ('text', 'Text'),
        ('date', 'Date'),
        ('signature', 'Signature'),
        ('checkbox', 'Checkbox'),
    ]

    blueprint = models.ForeignKey(Blueprint, related_name='fields', on_delete=models.CASCADE)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES)
    label = models.CharField(max_length=100)
    position_x = models.IntegerField()
    position_y = models.IntegerField()

class Contract(models.Model):
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('APPROVED', 'Approved'),
        ('SENT', 'Sent'),
        ('SIGNED', 'Signed'),
        ('LOCKED', 'Locked'),
        ('REVOKED', 'Revoked'),
    ]

    name = models.CharField(max_length=100)
    blueprint = models.ForeignKey(Blueprint, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')
    created_at = models.DateTimeField(auto_now_add=True)

class ContractField(models.Model):
    contract = models.ForeignKey(Contract, related_name='fields', on_delete=models.CASCADE)
    field_type = models.CharField(max_length=20)
    label = models.CharField(max_length=100)
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    value = models.TextField(blank=True, null=True)
