import random
import string
import time

def generate_user_id() -> str:
    """
    Generate a custom user ID with format: wm + 9 digits
    Example: wm123456789
    """
    digits = "".join(random.choices(string.digits, k=9))
    return f"wm{digits}"

def generate_numeric_uuid16() -> str:
    """
    Generate a 16-digit numeric UUID-like ID
    Ensures the first digit is non-zero to keep 16 digits when cast to int
    """
    first = random.choice("123456789")
    rest = "".join(random.choices(string.digits, k=15))
    return first + rest

def generate_numeric_uuid18() -> str:
    first = random.choice("123456789")
    rest = "".join(random.choices(string.digits, k=17))
    return first + rest

def generate_numeric_uuid20() -> str:
    ts = str(int(time.time() * 1000))
    rand = "".join(random.choices(string.digits, k=7))
    return ts + rand
