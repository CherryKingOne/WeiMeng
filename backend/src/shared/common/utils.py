import random
import string
from datetime import datetime

def generate_random_code(length: int = 6) -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(length)])

def generate_random_string(length: int = 16) -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))

def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    return dt.strftime(format_str)

def mask_email(email: str) -> str:
    if "@" not in email:
        return email
    local, domain = email.split("@")
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"
