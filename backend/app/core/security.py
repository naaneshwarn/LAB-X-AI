"""Security helpers for password hashing and safe input sanitization."""

import hashlib
import hmac
import secrets


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000
    )
    return f"pbkdf2_sha256$200000${salt}${derived.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against a stored PBKDF2-HMAC-SHA256 hash."""
    try:
        algorithm, iterations_str, salt, expected_hex = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations_str),
        )
        return hmac.compare_digest(derived.hex(), expected_hex)
    except (ValueError, TypeError):
        return False


def sanitize_text(value: str, max_length: int = 2000) -> str:
    """Trim whitespace, remove null bytes, and enforce maximum length."""
    cleaned = value.replace("\x00", "").strip()
    if len(cleaned) > max_length:
        return cleaned[:max_length]
    return cleaned
