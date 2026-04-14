import re

RECRUITER_KEYWORDS = [
    "recruiter", "recruiting", "talent", "acquisition", "sourcer", "sourcing",
    "staffing", "hr", "human resources", "people operations", "talent partner",
    "talent advisor", "technical recruiter", "corporate recruiter",
]

HIRING_MANAGER_KEYWORDS = [
    "manager", "director", "lead", "head", "vp", "vice president",
    "engineer", "scientist", "architect", "principal", "staff", "senior",
    "cto", "ceo", "founder", "co-founder", "president", "officer",
    "developer", "analyst", "researcher", "specialist",
]


def detect_recipient_type(role: str) -> str:
    """
    Returns 'RECRUITER' or 'HIRING_MANAGER' based on the recipient's title.
    """
    role_lower = role.lower()

    for kw in RECRUITER_KEYWORDS:
        if kw in role_lower:
            return "RECRUITER"

    for kw in HIRING_MANAGER_KEYWORDS:
        if kw in role_lower:
            return "HIRING_MANAGER"

    # Default to hiring manager if unclear
    return "HIRING_MANAGER"
