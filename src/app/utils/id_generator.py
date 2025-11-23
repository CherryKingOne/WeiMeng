import random
import string

def generate_user_id() -> str:
    """
    Generate a custom user ID with format: wm + 9 digits
    Example: wm123456789
    """
    digits = "".join(random.choices(string.digits, k=9))
    return f"wm{digits}"
