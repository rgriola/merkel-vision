#!/bin/bash

# Test script for Search APIs
# Tests both search and autocomplete endpoints

echo "==================================="
echo "Testing Search API Endpoints"
echo "==================================="
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Helper function to test endpoint
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  echo -e "${YELLOW}Test $TESTS_RUN: $name${NC}"
  echo "GET $url"
  
  # Get response body and status separately
  response=$(curl -s "$url")
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ Status: $status_code${NC}"
    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ Expected status $expected_status, got $status_code${NC}"
    echo "Response: $response"
  fi
  
  echo ""
}

echo "----------------------------------------"
echo "1. Testing Search Users Endpoint"
echo "----------------------------------------"
echo ""

# Test 1: Search by username
test_endpoint \
  "Search by username 'rod'" \
  "${BASE_URL}/api/v1/search/users?q=rod&type=username" \
  "200"

# Test 2: Search all types
test_endpoint \
  "Search all types for 'rod'" \
  "${BASE_URL}/api/v1/search/users?q=rod&type=all" \
  "200"

# Test 3: Search with pagination
test_endpoint \
  "Search with limit and offset" \
  "${BASE_URL}/api/v1/search/users?q=ro&limit=5&offset=0" \
  "200"

# Test 4: Invalid query (too short)
test_endpoint \
  "Invalid query (too short)" \
  "${BASE_URL}/api/v1/search/users?q=a" \
  "400"

# Test 5: Invalid type
test_endpoint \
  "Invalid search type" \
  "${BASE_URL}/api/v1/search/users?q=test&type=invalid" \
  "400"

# Test 6: Geographic search
test_endpoint \
  "Geographic search by country" \
  "${BASE_URL}/api/v1/search/users?q=test&country=USA" \
  "200"

echo "----------------------------------------"
echo "2. Testing Username Suggestions Endpoint"
echo "----------------------------------------"
echo ""

# Test 7: Get suggestions
test_endpoint \
  "Get username suggestions for 'rod'" \
  "${BASE_URL}/api/v1/search/suggestions?q=rod" \
  "200"

# Test 8: Suggestions with limit
test_endpoint \
  "Suggestions with custom limit" \
  "${BASE_URL}/api/v1/search/suggestions?q=ro&limit=5" \
  "200"

# Test 9: Invalid query (too short)
test_endpoint \
  "Invalid suggestions query" \
  "${BASE_URL}/api/v1/search/suggestions?q=a" \
  "400"

echo "==================================="
echo "Test Summary"
echo "==================================="
echo -e "Tests run: $TESTS_RUN"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $((TESTS_RUN - TESTS_PASSED))${NC}"
echo ""

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
