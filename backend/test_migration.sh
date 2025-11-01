#!/bin/bash
# Script to test the migrated application

echo "=== Testing Migration ==="
echo ""

echo "1. Testing Unit Tests..."
python3 -m pytest tests/unit/ -v --tb=short

echo ""
echo "2. Checking if server is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Server is running"
    echo ""
    echo "3. Testing Health Endpoints..."
    curl -s http://localhost:8000/health | python3 -m json.tool || echo "✗ Health endpoint failed"
    echo ""
    curl -s http://localhost:8000/health/ready | python3 -m json.tool || echo "✗ Ready endpoint failed"
    echo ""
    echo "4. Testing Metrics Endpoints..."
    curl -s "http://localhost:8000/api/metrics/revenue?start_date=2025-05-01&end_date=2025-05-31" | python3 -m json.tool | head -10 || echo "✗ Revenue endpoint failed"
else
    echo "✗ Server is not running. Start it with: uvicorn main_refactored:app --host 0.0.0.0 --port 8000"
fi

echo ""
echo "=== Migration Test Complete ==="

