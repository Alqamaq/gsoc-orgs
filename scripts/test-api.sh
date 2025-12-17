#!/bin/bash

# API Testing Script for GSoC Organizations API v1
# Usage: bash scripts/test-api.sh

BASE_URL="http://localhost:3000/api/v1"

echo "🧪 Testing GSoC Organizations API v1"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
  local name=$1
  local endpoint=$2
  local expected_status=${3:-200}
  
  echo -n "Testing $name... "
  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $status_code)"
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (HTTP $status_code, expected $expected_status)"
    return 1
  fi
}

# Test 1: Root endpoint
test_endpoint "Root endpoint" ""

# Test 2: Health check
test_endpoint "Health check" "/health"

# Test 3: Meta/Documentation
test_endpoint "Meta/Documentation" "/meta"

# Test 4: Organizations list
test_endpoint "Organizations list" "/organizations?limit=5"

# Test 5: Organizations with filters
test_endpoint "Organizations by year" "/organizations?year=2024&limit=5"
test_endpoint "Organizations by tech" "/organizations?technology=python&limit=5"
test_endpoint "Organizations by category" "/organizations?category=Web&limit=5"
test_endpoint "Active organizations" "/organizations?active=true&limit=5"

# Test 6: Organization detail
test_endpoint "Organization detail" "/organizations/mozilla" 200

# Test 7: Organization not found
test_endpoint "Organization not found (404)" "/organizations/nonexistent-org" 404

# Test 8: Years list
test_endpoint "Years list" "/years"

# Test 9: Year organizations
test_endpoint "2024 organizations" "/years/2024/organizations?limit=5"

# Test 10: Year stats
test_endpoint "2024 stats" "/years/2024/stats"

# Test 11: Invalid year
test_endpoint "Invalid year (400)" "/years/1999/stats" 400

# Test 12: Projects list
test_endpoint "Projects list" "/projects?limit=5"

# Test 13: Projects with filters
test_endpoint "Projects by year" "/projects?year=2024&limit=5"
test_endpoint "Projects by org" "/projects?org=mozilla&limit=5"
test_endpoint "Projects search" "/projects?q=web&limit=5"

# Test 14: Tech stack list
test_endpoint "Tech stack list" "/tech-stack?limit=10"

# Test 15: Tech stack with filters
test_endpoint "Tech stack search" "/tech-stack?q=python&limit=5"
test_endpoint "Tech stack min usage" "/tech-stack?min_usage=10&limit=5"

# Test 16: Tech stack detail
test_endpoint "Tech stack detail" "/tech-stack/python?limit=5"

# Test 17: Overall stats
test_endpoint "Overall stats" "/stats"

echo ""
echo "===================================="
echo "✅ API Testing Complete"
echo ""

