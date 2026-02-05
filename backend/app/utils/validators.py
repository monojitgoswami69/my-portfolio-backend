from fastapi import HTTPException


def validate_no_null_bytes(value: str, field_name: str) -> None:
    if '\x00' in value:
        raise HTTPException(status_code=400, detail=f"{field_name} contains invalid characters")
