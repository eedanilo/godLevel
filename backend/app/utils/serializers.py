"""
Serializers for converting database records to dictionaries
"""
from typing import List, Dict, Any
from decimal import Decimal
import asyncpg


def serialize_records(records: List[asyncpg.Record]) -> List[Dict[str, Any]]:
    """Convert asyncpg records to list of dictionaries"""
    return [serialize_record(record) for record in records]


def serialize_record(record: asyncpg.Record) -> Dict[str, Any]:
    """Convert single asyncpg record to dictionary"""
    result = {}
    for key in record.keys():
        value = record[key]
        if isinstance(value, Decimal):
            result[key] = float(value)
        elif isinstance(value, (int, float, str, bool)) or value is None:
            result[key] = value
        else:
            # Try to convert to string for other types
            result[key] = str(value)
    return result

