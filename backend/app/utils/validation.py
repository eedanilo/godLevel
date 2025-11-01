"""
Data validation and sanitization utilities
"""
from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel, validator, ValidationError
import re
import logging

logger = logging.getLogger(__name__)


def sanitize_string(value: Optional[str], max_length: Optional[int] = None) -> Optional[str]:
    """Sanitize string input"""
    if not value:
        return None
    
    # Remove leading/trailing whitespace
    value = value.strip()
    
    # Remove control characters except newline and tab
    value = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', value)
    
    # Limit length
    if max_length and len(value) > max_length:
        value = value[:max_length]
        logger.warning(f"String truncated to {max_length} characters")
    
    return value


def sanitize_email(email: Optional[str]) -> Optional[str]:
    """Sanitize and validate email"""
    if not email:
        return None
    
    email = email.strip().lower()
    
    # Basic email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValueError(f"Invalid email format: {email}")
    
    return email


def sanitize_phone(phone: Optional[str]) -> Optional[str]:
    """Sanitize phone number"""
    if not phone:
        return None
    
    # Remove all non-digit characters except + at the beginning
    phone = phone.strip()
    if phone.startswith('+'):
        cleaned = '+' + re.sub(r'\D', '', phone[1:])
    else:
        cleaned = re.sub(r'\D', '', phone)
    
    return cleaned if cleaned else None


def validate_date_range(start_date: Optional[str], end_date: Optional[str], default_start: Optional[str] = None, default_end: Optional[str] = None) -> tuple:
    """Validate and parse date range"""
    # Use defaults if not provided
    if not start_date and default_start:
        start_date = default_start
    if not end_date and default_end:
        end_date = default_end
    
    if not start_date or not end_date:
        return None, None
    
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        if start > end:
            raise ValueError("start_date must be before or equal to end_date")
        
        # Limit range to prevent excessive queries
        max_range_days = 365
        if (end - start).days > max_range_days:
            raise ValueError(f"Date range cannot exceed {max_range_days} days")
        
        return start, end
    except ValueError as e:
        raise ValueError(f"Invalid date format or range: {e}")


def validate_limit(limit: Optional[int], max_limit: int = 100) -> int:
    """Validate and limit result count"""
    if limit is None:
        return 10  # Default
    
    if limit < 1:
        raise ValueError("limit must be greater than 0")
    
    if limit > max_limit:
        logger.warning(f"Limit {limit} exceeds maximum {max_limit}, using {max_limit}")
        return max_limit
    
    return limit


def validate_store_id(store_id: Optional[int]) -> Optional[int]:
    """Validate store ID"""
    if store_id is None:
        return None
    
    if store_id < 1:
        raise ValueError("store_id must be greater than 0")
    
    return store_id


def validate_channel_id(channel_id: Optional[int]) -> Optional[int]:
    """Validate channel ID"""
    if channel_id is None:
        return None
    
    if channel_id < 1:
        raise ValueError("channel_id must be greater than 0")
    
    return channel_id

