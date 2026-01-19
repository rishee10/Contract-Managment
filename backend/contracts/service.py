VALID_TRANSITIONS = {
    'CREATED': ['APPROVED', 'REVOKED'],
    'APPROVED': ['SENT'],
    'SENT': ['SIGNED', 'REVOKED'],
    'SIGNED': ['LOCKED'],
    'LOCKED': [],
    'REVOKED': [],
}

def can_transition(current, new):
    return new in VALID_TRANSITIONS[current]

def allowed_transitions(current):
    return list(VALID_TRANSITIONS.get(current, []))

EDITABLE_STATUSES = {"CREATED", "APPROVED", "SENT"}

def can_edit_fields(status):
    return status in EDITABLE_STATUSES