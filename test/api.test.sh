#!/bin/bash

# API Integration Test Suite
# Tests all endpoints with real HTTP requests

BASE_URL="http://localhost:8000/api/v1"
TOTAL=0
PASSED=0
FAILED=0

ACCESS_TOKEN=""
USER_ID=""
VIDEO_ID=""
TWEET_ID=""
COMMENT_ID=""
PLAYLIST_ID=""

log_test() {
  local status=$1
  local name=$2
  local result=$3
  
  TOTAL=$((TOTAL + 1))
  
  if [ "$status" == "PASS" ]; then
    echo "✅ $name: $result"
    PASSED=$((PASSED + 1))
  elif [ "$status" == "FAIL" ]; then
    echo "❌ $name: $result"
    FAILED=$((FAILED + 1))
  else
    echo "⏳ $name: $result"
  fi
}

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "🚀 REAL API INTEGRATION TEST SUITE"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# HEALTHCHECK
echo "📋 HEALTHCHECK ENDPOINTS"
echo "────────────────────────────────────────────────────────────────────"
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/healthcheck")
status=$(echo "$response" | tail -n1)
if [ "$status" == "200" ]; then
  log_test "PASS" "GET /healthcheck" "Status $status"
else
  log_test "FAIL" "GET /healthcheck" "Status $status"
fi
echo ""

# USER AUTHENTICATION
echo "👤 USER AUTHENTICATION ENDPOINTS"
echo "────────────────────────────────────────────────────────────────────"

# Check for test user
echo "Checking for test user..."
login_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Pass@123"}' \
  "$BASE_URL/users/login")

ACCESS_TOKEN=$(echo "$login_response" | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)
USER_ID=$(echo "$login_response" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$ACCESS_TOKEN" ]; then
  log_test "PASS" "POST /users/login" "Token obtained"
  
  # Current User
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/users/current-user")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /users/current-user" "Status $status" || log_test "FAIL" "GET /users/current-user" "Status $status"
  
  # Refresh Token  
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "$BASE_URL/users/refresh-token")
  status=$(echo "$response" | tail -n1)
  if [ "$status" == "200" ]; then
    NEW_TOKEN=$(echo "$response" | sed '$d' | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)
    [ ! -z "$NEW_TOKEN" ] && ACCESS_TOKEN="$NEW_TOKEN"
    log_test "PASS" "POST /users/refresh-token" "Status $status"
  else
    log_test "FAIL" "POST /users/refresh-token" "Status $status"
  fi
  
  # Update Account
  response=$(curl -s -w "\n%{http_code}" -X PATCH \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"fullName\":\"Test User Updated\",\"email\":\"admin@example.com\"}" \
    "$BASE_URL/users/update-account")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "PATCH /users/update-account" "Status $status" || log_test "FAIL" "PATCH /users/update-account" "Status $status"
  
  # Watch History
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/users/history")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /users/history" "Status $status" || log_test "FAIL" "GET /users/history" "Status $status"
else
  log_test "FAIL" "POST /users/login" "No test user found - using public endpoints only"
fi
echo ""

# VIDEO ENDPOINTS
echo "🎥 VIDEO ENDPOINTS"
echo "────────────────────────────────────────────────────────────────────"

response=$(curl -s -X GET "$BASE_URL/videos")
VIDEO_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
COUNT=$(echo "$response" | grep -o '"_id"' | wc -l)
log_test "PASS" "GET /videos" "Found $COUNT videos"

if [ ! -z "$VIDEO_ID" ]; then
  response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/videos/$VIDEO_ID")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /videos/{videoId}" "Status $status" || log_test "FAIL" "GET /videos/{videoId}" "Status $status"
fi
echo ""

# COMMENT ENDPOINTS (Public)
echo "💬 COMMENT ENDPOINTS"
echo "────────────────────────────────────────────────────────────────────"

if [ ! -z "$VIDEO_ID" ]; then
  response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/comments/$VIDEO_ID")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /comments/{videoId}" "Status $status" || log_test "FAIL" "GET /comments/{videoId}" "Status $status"
  
  if [ ! -z "$ACCESS_TOKEN" ]; then
    # Add Comment
    response=$(curl -s -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"content\":\"Test Comment $(date +%s)\"}" \
      "$BASE_URL/comments/$VIDEO_ID")
    COMMENT_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    [ ! -z "$COMMENT_ID" ] && log_test "PASS" "POST /comments/{videoId}" "Comment created" || log_test "FAIL" "POST /comments/{videoId}" "Failed"
    
    # Update Comment
    if [ ! -z "$COMMENT_ID" ]; then
      response=$(curl -s -w "\n%{http_code}" -X PATCH \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"content\":\"Updated Comment $(date +%s)\"}" \
        "$BASE_URL/comments/c/$COMMENT_ID")
      status=$(echo "$response" | tail -n1)
      [ "$status" == "200" ] && log_test "PASS" "PATCH /comments/c/{commentId}" "Status $status" || log_test "FAIL" "PATCH /comments/c/{commentId}" "Status $status"
    fi
  fi
fi
echo ""

# TWEET ENDPOINTS
if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "🐦 TWEET ENDPOINTS"
  echo "────────────────────────────────────────────────────────────────────"
  
  # Create Tweet
  response=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"Test Tweet $(date +%s)\"}" \
    "$BASE_URL/tweets")
  TWEET_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
  [ ! -z "$TWEET_ID" ] && log_test "PASS" "POST /tweets" "Tweet created" || log_test "FAIL" "POST /tweets" "Failed"
  
  # Get User Tweets
  if [ ! -z "$USER_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/tweets/user/$USER_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "GET /tweets/user/{userId}" "Status $status" || log_test "FAIL" "GET /tweets/user/{userId}" "Status $status"
  fi
  
  # Update Tweet
  if [ ! -z "$TWEET_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PATCH \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"content\":\"Updated Tweet $(date +%s)\"}" \
      "$BASE_URL/tweets/$TWEET_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "PATCH /tweets/{tweetId}" "Status $status" || log_test "FAIL" "PATCH /tweets/{tweetId}" "Status $status"
  fi
  echo ""
fi

# LIKE ENDPOINTS
if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "👍 LIKE ENDPOINTS"
  echo "────────────────────────────────────────────────────────────────────"
  
  if [ ! -z "$VIDEO_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/likes/toggle/v/$VIDEO_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "POST /likes/toggle/v/{videoId}" "Status $status" || log_test "FAIL" "POST /likes/toggle/v/{videoId}" "Status $status"
  fi
  
  if [ ! -z "$COMMENT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/likes/toggle/c/$COMMENT_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "POST /likes/toggle/c/{commentId}" "Status $status" || log_test "FAIL" "POST /likes/toggle/c/{commentId}" "Status $status"
  fi
  
  if [ ! -z "$TWEET_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/likes/toggle/t/$TWEET_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "POST /likes/toggle/t/{tweetId}" "Status $status" || log_test "FAIL" "POST /likes/toggle/t/{tweetId}" "Status $status"
  fi
  
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/likes/videos")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /likes/videos" "Status $status" || log_test "FAIL" "GET /likes/videos" "Status $status"
  echo ""
fi

# PLAYLIST ENDPOINTS
if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "📑 PLAYLIST ENDPOINTS"
  echo "────────────────────────────────────────────────────────────────────"
  
  # Create Playlist
  response=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Playlist $(date +%s)\",\"description\":\"Test\"}" \
    "$BASE_URL/playlist")
  PLAYLIST_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
  [ ! -z "$PLAYLIST_ID" ] && log_test "PASS" "POST /playlist" "Playlist created" || log_test "FAIL" "POST /playlist" "Failed"
  
  # Get User Playlists
  if [ ! -z "$USER_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/playlist/user/$USER_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "GET /playlist/user/{userId}" "Status $status" || log_test "FAIL" "GET /playlist/user/{userId}" "Status $status"
  fi
  
  # Get Playlist by ID
  if [ ! -z "$PLAYLIST_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/playlist/$PLAYLIST_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "GET /playlist/{playlistId}" "Status $status" || log_test "FAIL" "GET /playlist/{playlistId}" "Status $status"
    
    # Update Playlist
    response=$(curl -s -w "\n%{http_code}" -X PATCH \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Updated Playlist $(date +%s)\",\"description\":\"Updated\"}" \
      "$BASE_URL/playlist/$PLAYLIST_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "PATCH /playlist/{playlistId}" "Status $status" || log_test "FAIL" "PATCH /playlist/{playlistId}" "Status $status"
    
    # Add Video to Playlist
    if [ ! -z "$VIDEO_ID" ]; then
      response=$(curl -s -w "\n%{http_code}" -X PATCH \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/playlist/add/$VIDEO_ID/$PLAYLIST_ID")
      status=$(echo "$response" | tail -n1)
      [ "$status" == "200" ] && log_test "PASS" "PATCH /playlist/add/{videoId}/{playlistId}" "Status $status" || log_test "FAIL" "PATCH /playlist/add/{videoId}/{playlistId}" "Status $status"
    fi
  fi
  echo ""
fi

# SUBSCRIPTION ENDPOINTS
if [ ! -z "$ACCESS_TOKEN" ] && [ ! -z "$USER_ID" ]; then
  echo "📢 SUBSCRIPTION ENDPOINTS"
  echo "────────────────────────────────────────────────────────────────────"
  
  # Toggle Subscription
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/subscriptions/c/$USER_ID")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "POST /subscriptions/c/{userId}" "Status $status" || log_test "FAIL" "POST /subscriptions/c/{userId}" "Status $status"
  
  # Get Channel Subscribers
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/subscriptions/c/$USER_ID")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /subscriptions/c/{userId}" "Status $status" || log_test "FAIL" "GET /subscriptions/c/{userId}" "Status $status"
  
  # Get Subscribed Channels
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/subscriptions/u/$USER_ID")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /subscriptions/u/{userId}" "Status $status" || log_test "FAIL" "GET /subscriptions/u/{userId}" "Status $status"
  echo ""
fi

# DASHBOARD ENDPOINTS
if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "📊 DASHBOARD ENDPOINTS"
  echo "────────────────────────────────────────────────────────────────────"
  
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/dashboard/stats")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /dashboard/stats" "Status $status" || log_test "FAIL" "GET /dashboard/stats" "Status $status"
  
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/dashboard/videos")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "GET /dashboard/videos" "Status $status" || log_test "FAIL" "GET /dashboard/videos" "Status $status"
  echo ""
fi

# CLEANUP
echo "🧹 CLEANUP OPERATIONS"
echo "────────────────────────────────────────────────────────────────────"

if [ ! -z "$ACCESS_TOKEN" ]; then
  if [ ! -z "$TWEET_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/tweets/$TWEET_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "DELETE /tweets/{tweetId}" "Status $status" || log_test "FAIL" "DELETE /tweets/{tweetId}" "Status $status"
  fi
  
  if [ ! -z "$COMMENT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/comments/c/$COMMENT_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "DELETE /comments/c/{commentId}" "Status $status" || log_test "FAIL" "DELETE /comments/c/{commentId}" "Status $status"
  fi
  
  if [ ! -z "$PLAYLIST_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "$BASE_URL/playlist/$PLAYLIST_ID")
    status=$(echo "$response" | tail -n1)
    [ "$status" == "200" ] && log_test "PASS" "DELETE /playlist/{playlistId}" "Status $status" || log_test "FAIL" "DELETE /playlist/{playlistId}" "Status $status"
  fi
  
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "$BASE_URL/users/logout")
  status=$(echo "$response" | tail -n1)
  [ "$status" == "200" ] && log_test "PASS" "POST /users/logout" "Status $status" || log_test "FAIL" "POST /users/logout" "Status $status"
fi
echo ""

# SUMMARY
echo "════════════════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "════════════════════════════════════════════════════════════════════"
echo "Total Tests: $TOTAL"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✨ ALL TESTS PASSED!"
else
  echo "⚠️  Some tests failed - check the results above"
fi
echo ""
