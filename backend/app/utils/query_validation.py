"""
Query validation and sanitization utilities

Prevents SQL injection and validates query parameters
"""

import re
from typing import Any, Tuple, List, Dict
import logging

logger = logging.getLogger(__name__)

# Whitelist of allowed tables and their fields
ALLOWED_TABLES = {
    'sales': {
        'fields': [
            'id', 'store_id', 'customer_id', 'channel_id', 'sub_brand_id',
            'created_at', 'total_amount', 'total_discount', 'total_increase',
            'total_amount_items', 'delivery_fee', 'service_tax_fee',
            'sale_status_desc', 'production_seconds', 'delivery_seconds',
            'people_quantity', 'value_paid', 'cod_sale1', 'cod_sale2',
            'customer_name', 'discount_reason', 'increase_reason', 'origin'
        ],
        'alias': 's'
    },
    'stores': {
        'fields': [
            'id', 'name', 'city', 'state', 'district', 'address_street',
            'address_number', 'zipcode', 'latitude', 'longitude',
            'is_active', 'is_own', 'is_holding', 'creation_date', 'brand_id', 'sub_brand_id'
        ],
        'alias': 'st'
    },
    'customers': {
        'fields': [
            'id', 'customer_name', 'email', 'phone_number', 'cpf',
            'birth_date', 'gender', 'store_id', 'sub_brand_id',
            'registration_origin', 'agree_terms', 'receive_promotions_email',
            'receive_promotions_sms', 'created_at'
        ],
        'alias': 'c'
    },
    'channels': {
        'fields': [
            'id', 'name', 'description', 'type', 'brand_id', 'created_at'
        ],
        'alias': 'ch'
    },
    'products': {
        'fields': [
            'id', 'name', 'brand_id', 'sub_brand_id', 'category_id',
            'pos_uuid', 'deleted_at'
        ],
        'alias': 'p'
    },
    'categories': {
        'fields': [
            'id', 'name', 'type', 'brand_id', 'sub_brand_id',
            'pos_uuid', 'deleted_at'
        ],
        'alias': 'cat'
    },
    'product_sales': {
        'fields': [
            'id', 'sale_id', 'product_id', 'quantity',
            'base_price', 'total_price', 'observations'
        ],
        'alias': 'ps'
    },
    'brands': {
        'fields': ['id', 'name', 'created_at'],
        'alias': 'b'
    },
    'sub_brands': {
        'fields': ['id', 'brand_id', 'name', 'created_at'],
        'alias': 'sb'
    }
}

# SQL keywords that should never appear in field names
DANGEROUS_KEYWORDS = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'TRUNCATE', 'ALTER',
    'CREATE', 'EXEC', 'EXECUTE', 'SCRIPT', 'DECLARE', 'GRANT',
    'REVOKE', 'UNION', 'INFORMATION_SCHEMA', 'PG_', 'CURRENT_USER'
]

# Valid operators
VALID_OPERATORS = {
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 
    'in', 'not_in', 'like', 'between'
}

# Valid aggregations
VALID_AGGREGATIONS = {
    'sum', 'avg', 'count', 'min', 'max', 'count_distinct'
}


def sanitize_field_name(field: str) -> str:
    """
    Sanitize and validate a field name
    
    Args:
        field: Field name to sanitize (can include table alias, e.g., 's.created_at')
    
    Returns:
        Sanitized field name
    
    Raises:
        ValueError: If field name is invalid or dangerous
    """
    if not field or not isinstance(field, str):
        raise ValueError("Field name must be a non-empty string")
    
    # Remove whitespace
    field = field.strip()
    
    # Check basic format (allow alphanumeric, underscore, and dot)
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_.]*$', field):
        raise ValueError(f"Invalid field name format: {field}")
    
    # Check for dangerous keywords
    field_upper = field.upper()
    for keyword in DANGEROUS_KEYWORDS:
        if keyword in field_upper:
            raise ValueError(f"Dangerous keyword detected in field: {keyword}")
    
    # Validate against whitelist
    if '.' in field:
        # Has table alias
        parts = field.split('.')
        if len(parts) != 2:
            raise ValueError(f"Invalid field format: {field}")
        
        table_alias, column = parts
        
        # Find table by alias
        table_name = None
        for tname, tinfo in ALLOWED_TABLES.items():
            if tinfo['alias'] == table_alias:
                table_name = tname
                break
        
        if not table_name:
            raise ValueError(f"Unknown table alias: {table_alias}")
        
        if column not in ALLOWED_TABLES[table_name]['fields']:
            raise ValueError(f"Column '{column}' not allowed in table '{table_name}'")
    else:
        # No alias - check if it's a valid sales field
        if field not in ALLOWED_TABLES['sales']['fields']:
            # Also check for special SQL functions
            if field not in ['*', 'COUNT(*)', 'count(*)']:
                raise ValueError(f"Field '{field}' not allowed")
    
    return field


def sanitize_sql_value(value: Any) -> Any:
    """
    Sanitize a SQL value
    
    Args:
        value: Value to sanitize
    
    Returns:
        Sanitized value
    
    Raises:
        ValueError: If value contains dangerous content
    """
    if value is None:
        return None
    
    # If it's a list, sanitize each element
    if isinstance(value, list):
        return [sanitize_sql_value(v) for v in value]
    
    # If it's a string, check for SQL injection attempts
    if isinstance(value, str):
        # Check for dangerous patterns
        value_upper = value.upper()
        for keyword in DANGEROUS_KEYWORDS:
            if keyword in value_upper:
                raise ValueError(f"Dangerous keyword in value: {keyword}")
        
        # Check for common SQL injection patterns
        dangerous_patterns = [
            r"';",           # Statement terminator
            r"--",           # Comment
            r"/\*",          # Comment start
            r"\*/",          # Comment end
            r"xp_",          # Extended stored procedures
            r"sp_",          # System stored procedures
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError(f"Dangerous pattern detected in value")
    
    return value


def validate_query_request(query_dict: Dict) -> Tuple[bool, str]:
    """
    Validate a complete query request
    
    Args:
        query_dict: Dictionary representation of QueryRequest
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Validate dimensions
        dimensions = query_dict.get('dimensions', [])
        for dim in dimensions:
            field = dim.get('field')
            if not field:
                return False, "Dimension must have a field"
            
            try:
                sanitize_field_name(field)
            except ValueError as e:
                return False, f"Invalid dimension field: {str(e)}"
            
            # Validate alias if provided
            alias = dim.get('alias')
            if alias:
                if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', alias):
                    return False, f"Invalid dimension alias: {alias}"
        
        # Validate metrics
        metrics = query_dict.get('metrics', [])
        for metric in metrics:
            field = metric.get('field')
            if not field:
                return False, "Metric must have a field"
            
            try:
                sanitize_field_name(field)
            except ValueError as e:
                return False, f"Invalid metric field: {str(e)}"
            
            # Validate aggregation
            aggregation = metric.get('aggregation', '').lower()
            if aggregation not in VALID_AGGREGATIONS:
                return False, f"Invalid aggregation: {aggregation}. Must be one of {VALID_AGGREGATIONS}"
            
            # Validate alias if provided
            alias = metric.get('alias')
            if alias:
                if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', alias):
                    return False, f"Invalid metric alias: {alias}"
        
        # Validate filters
        filters = query_dict.get('filters', [])
        for filter_obj in filters:
            field = filter_obj.get('field')
            if not field:
                return False, "Filter must have a field"
            
            try:
                sanitize_field_name(field)
            except ValueError as e:
                return False, f"Invalid filter field: {str(e)}"
            
            # Validate operator
            operator = filter_obj.get('operator', '').lower()
            if operator not in VALID_OPERATORS:
                return False, f"Invalid operator: {operator}. Must be one of {VALID_OPERATORS}"
            
            # Validate value
            value = filter_obj.get('value')
            try:
                sanitize_sql_value(value)
            except ValueError as e:
                return False, f"Invalid filter value: {str(e)}"
        
        # Validate group_by
        group_by = query_dict.get('group_by', [])
        for field in group_by:
            try:
                sanitize_field_name(field)
            except ValueError as e:
                return False, f"Invalid group_by field: {str(e)}"
        
        # Validate order_by
        order_by = query_dict.get('order_by', [])
        for order in order_by:
            field = order.get('field')
            if not field:
                return False, "Order by must have a field"
            
            try:
                sanitize_field_name(field)
            except ValueError as e:
                return False, f"Invalid order_by field: {str(e)}"
            
            # Validate direction
            direction = order.get('direction', 'ASC').upper()
            if direction not in ['ASC', 'DESC']:
                return False, f"Invalid order direction: {direction}"
        
        # Validate limit
        limit = query_dict.get('limit')
        if limit is not None:
            if not isinstance(limit, int) or limit < 1 or limit > 10000:
                return False, "Limit must be between 1 and 10000"
        
        # Validate time_range
        time_range = query_dict.get('time_range')
        if time_range:
            start_date = time_range.get('start')
            end_date = time_range.get('end')
            
            if start_date:
                if not re.match(r'^\d{4}-\d{2}-\d{2}$', start_date):
                    return False, "Invalid start_date format. Use YYYY-MM-DD"
            
            if end_date:
                if not re.match(r'^\d{4}-\d{2}-\d{2}$', end_date):
                    return False, "Invalid end_date format. Use YYYY-MM-DD"
        
        return True, ""
        
    except Exception as e:
        logger.error(f"Query validation error: {e}", exc_info=True)
        return False, f"Validation error: {str(e)}"


def get_allowed_fields() -> Dict[str, List[str]]:
    """
    Get list of allowed fields for each table
    Useful for API documentation or frontend
    
    Returns:
        Dictionary mapping table names to list of allowed fields
    """
    return {
        table_name: table_info['fields']
        for table_name, table_info in ALLOWED_TABLES.items()
    }


def get_table_by_alias(alias: str) -> str:
    """
    Get table name from alias
    
    Args:
        alias: Table alias (e.g., 's', 'st', 'c')
    
    Returns:
        Table name or None if not found
    """
    for table_name, table_info in ALLOWED_TABLES.items():
        if table_info['alias'] == alias:
            return table_name
    return None
