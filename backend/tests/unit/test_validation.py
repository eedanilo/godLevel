"""
Unit tests for validation utilities
"""
import pytest
from app.utils.validation import (
    sanitize_string,
    sanitize_email,
    sanitize_phone,
    validate_date_range,
    validate_limit,
    validate_store_id,
    validate_channel_id
)


class TestSanitizeString:
    """Tests for string sanitization"""
    
    def test_sanitize_normal_string(self):
        result = sanitize_string("  test string  ")
        assert result == "test string"
    
    def test_sanitize_with_control_chars(self):
        result = sanitize_string("test\x00string")
        assert result == "teststring"
    
    def test_sanitize_with_max_length(self):
        result = sanitize_string("test string", max_length=4)
        assert result == "test"
    
    def test_sanitize_none(self):
        result = sanitize_string(None)
        assert result is None
    
    def test_sanitize_empty(self):
        result = sanitize_string("")
        assert result is None


class TestSanitizeEmail:
    """Tests for email validation"""
    
    def test_valid_email(self):
        result = sanitize_email("test@example.com")
        assert result == "test@example.com"
    
    def test_email_lowercase(self):
        result = sanitize_email("TEST@EXAMPLE.COM")
        assert result == "test@example.com"
    
    def test_invalid_email(self):
        with pytest.raises(ValueError):
            sanitize_email("invalid-email")
    
    def test_none_email(self):
        result = sanitize_email(None)
        assert result is None


class TestSanitizePhone:
    """Tests for phone sanitization"""
    
    def test_sanitize_phone_with_spaces(self):
        result = sanitize_phone("+55 11 99999-9999")
        assert result == "+5511999999999"
    
    def test_sanitize_phone_without_plus(self):
        result = sanitize_phone("(11) 99999-9999")
        assert result == "11999999999"
    
    def test_none_phone(self):
        result = sanitize_phone(None)
        assert result is None


class TestValidateDateRange:
    """Tests for date range validation"""
    
    def test_valid_date_range(self):
        start, end = validate_date_range("2025-01-01", "2025-01-31")
        assert start is not None
        assert end is not None
    
    def test_invalid_date_format(self):
        with pytest.raises(ValueError):
            validate_date_range("invalid", "2025-01-31")
    
    def test_start_after_end(self):
        with pytest.raises(ValueError):
            validate_date_range("2025-01-31", "2025-01-01")
    
    def test_range_too_large(self):
        with pytest.raises(ValueError):
            validate_date_range("2024-01-01", "2025-01-01")


class TestValidateLimit:
    """Tests for limit validation"""
    
    def test_valid_limit(self):
        result = validate_limit(10, max_limit=100)
        assert result == 10
    
    def test_limit_exceeds_max(self):
        result = validate_limit(200, max_limit=100)
        assert result == 100
    
    def test_zero_limit(self):
        with pytest.raises(ValueError):
            validate_limit(0)
    
    def test_none_limit(self):
        result = validate_limit(None)
        assert result == 10  # Default


class TestValidateStoreId:
    """Tests for store ID validation"""
    
    def test_valid_store_id(self):
        result = validate_store_id(1)
        assert result == 1
    
    def test_invalid_store_id(self):
        with pytest.raises(ValueError):
            validate_store_id(0)
    
    def test_none_store_id(self):
        result = validate_store_id(None)
        assert result is None


class TestValidateChannelId:
    """Tests for channel ID validation"""
    
    def test_valid_channel_id(self):
        result = validate_channel_id(1)
        assert result == 1
    
    def test_invalid_channel_id(self):
        with pytest.raises(ValueError):
            validate_channel_id(-1)
    
    def test_none_channel_id(self):
        result = validate_channel_id(None)
        assert result is None

