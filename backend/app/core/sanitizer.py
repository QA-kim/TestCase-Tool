"""
HTML sanitization utilities for XSS protection
"""
import re
from typing import Optional


def sanitize_html(text: Optional[str]) -> Optional[str]:
    """
    Remove HTML tags and dangerous characters from text to prevent XSS attacks.

    Args:
        text: Input text that may contain HTML tags

    Returns:
        Sanitized text with HTML tags removed
    """
    if not text:
        return text

    # Remove HTML tags
    text = re.sub(r'<[^>]*>', '', text)

    # Remove javascript: protocol
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)

    # Remove on* event handlers
    text = re.sub(r'\bon\w+\s*=', '', text, flags=re.IGNORECASE)

    # Remove data URIs (can be used for XSS)
    text = re.sub(r'data:text/html', '', text, flags=re.IGNORECASE)

    return text


def sanitize_dict(data: dict, fields_to_sanitize: list) -> dict:
    """
    Sanitize specific fields in a dictionary.

    Args:
        data: Dictionary containing data to sanitize
        fields_to_sanitize: List of field names to sanitize

    Returns:
        Dictionary with sanitized fields
    """
    sanitized = data.copy()
    for field in fields_to_sanitize:
        if field in sanitized and isinstance(sanitized[field], str):
            sanitized[field] = sanitize_html(sanitized[field])
    return sanitized
