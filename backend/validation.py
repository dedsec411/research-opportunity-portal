from datetime import datetime

TEXT_FIELDS = {
    "title": 200,
    "description": 2000,
    "research_area": 100,
    "faculty_name": 100,
    "department": 100,
    "required_skills": 255,
}

# Order must match the column order in the SQL statements in app.py.
ALL_FIELDS = list(TEXT_FIELDS) + ["available_positions", "application_deadline", "status"]


def is_valid_date(text):
    try:
        parsed = datetime.strptime(text, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return False
    return str(parsed) == text  # strptime accepts 2026-1-5; this rejects it


def validate_opportunity(data):
    errors = []

    for field, max_length in TEXT_FIELDS.items():
        value = data.get(field)
        if not isinstance(value, str) or value.strip() == "":
            errors.append(f"{field} is required")
        elif len(value.strip()) > max_length:
            errors.append(f"{field} must be {max_length} characters or less")

    positions = data.get("available_positions")
    if positions is None or positions == "":
        errors.append("available_positions is required")
    elif type(positions) is not int or positions < 1 or positions > 1000:
        errors.append("available_positions must be a whole number between 1 and 1000")

    deadline = data.get("application_deadline")
    if deadline is None or deadline == "":
        errors.append("application_deadline is required")
    elif not is_valid_date(deadline):
        errors.append("application_deadline must be a valid date in YYYY-MM-DD format")

    if data.get("status") not in ("Open", "Closed"):
        errors.append("status must be Open or Closed")

    return errors
