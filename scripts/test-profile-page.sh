#!/bin/bash

# Test Profile Page with Follower/Following Counts
# Tests the /@username page with real follower/following data

echo "🧪 Testing Public Profile Page - Follower/Following Counts"
echo "=========================================================="
echo ""

BASE_URL="http://localhost:3000"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Helper function to run tests
run_test() {
    local test_name=$1
    local url=$2
    local expected_status=$3
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -e "${YELLOW}Test $TESTS_RUN: $test_name${NC}"
    
    response=$(curl -s -w "\n%{http_code}" "$url")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Status: $status_code (Expected: $expected_status)${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Check for specific content if 200
        if [ "$status_code" = "200" ]; then
            # Check for follower/following counts in the HTML
            if echo "$body" | grep -q "Followers"; then
                echo -e "${GREEN}✓ Found 'Followers' text in response${NC}"
            else
                echo -e "${RED}✗ Missing 'Followers' text${NC}"
            fi
            
            if echo "$body" | grep -q "Following"; then
                echo -e "${GREEN}✓ Found 'Following' text in response${NC}"
            else
                echo -e "${RED}✗ Missing 'Following' text${NC}"
            fi
        fi
    else
        echo -e "${RED}✗ Status: $status_code (Expected: $expected_status)${NC}"
    fi
    echo ""
}

echo "=== Test Suite 1: Public Profiles ==="
echo ""

# Test 1: View user profile (should work)
run_test "View public user profile (@rgriola)" \
    "$BASE_URL/@rgriola" \
    "200"

# Test 2: View another user profile (case-insensitive)
run_test "View public user profile (case-insensitive @RGRIOLA)" \
    "$BASE_URL/@RGRIOLA" \
    "200"

# Test 3: Non-existent user (should 404)
run_test "View non-existent user profile" \
    "$BASE_URL/@nonexistentuser12345" \
    "404"

echo ""
echo "=== Test Suite 2: API Endpoints for Follower Data ==="
echo ""

# Test 4: Get user followers
run_test "Get user followers" \
    "$BASE_URL/api/v1/users/rgriola/followers?limit=5" \
    "200"

# Test 5: Get user following
run_test "Get user following" \
    "$BASE_URL/api/v1/users/rgriola/following?limit=5" \
    "200"

# Test 6: Get user profile data
run_test "Get user profile via API" \
    "$BASE_URL/api/v1/users/rgriola" \
    "200"

echo ""
echo "=== Test Suite 3: Privacy Settings ==="
echo ""

# Test 7: View followers page
run_test "View followers page" \
    "$BASE_URL/@rgriola/followers" \
    "200"

# Test 8: View following page
run_test "View following page" \
    "$BASE_URL/@rgriola/following" \
    "200"

# Test 9: View locations page
run_test "View public locations page" \
    "$BASE_URL/@rgriola/locations" \
    "200"

echo ""
echo "=== Test Suite 4: Follow Status Check ==="
echo ""

# These require authentication, will return 401 if not logged in
run_test "Check follow status (requires auth)" \
    "$BASE_URL/api/v1/users/me/follow-status/rgriola" \
    "401"

echo ""
echo "=========================================================="
echo "📊 Test Results Summary"
echo "=========================================================="
echo -e "Tests Run: $TESTS_RUN"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $((TESTS_RUN - TESTS_PASSED))${NC}"
echo ""

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
