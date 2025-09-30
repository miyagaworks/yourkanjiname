#!/bin/bash

# YourKanjiName API Full Flow Test

API_URL="http://localhost:3000/api"

echo "=== YourKanjiName API Test ==="
echo ""

# 1. Create session
echo "1. Creating session..."
SESSION=$(curl -s -X POST "$API_URL/sessions" -H "Content-Type: application/json")
SESSION_ID=$(echo $SESSION | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
echo "✅ Session ID: $SESSION_ID"
echo ""

# 2. Get first question (Q0)
echo "2. Getting Q0..."
curl -s "$API_URL/sessions/$SESSION_ID/next-question?lang=ja" | python3 -m json.tool | head -20
echo ""

# 3. Answer Q1 - Gender: Male
echo "3. Answering Q1 (Gender: Male)..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q1","answer_option":"male"}' | python3 -m json.tool
echo ""

# 4. Answer M-1 (Male trait question)
echo "4. Answering M-1..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-1","answer_option":"A"}' | python3 -m json.tool
echo ""

# 5. Answer M-2
echo "5. Answering M-2..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-2","answer_option":"A"}' | python3 -m json.tool
echo ""

# 6. Answer M-3
echo "6. Answering M-3..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-3","answer_option":"A"}' | python3 -m json.tool
echo ""

# 7. Answer M-4
echo "7. Answering M-4..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-4","answer_option":"A"}' | python3 -m json.tool
echo ""

# 8. Answer Q6 (Childhood - Knowledge)
echo "8. Answering Q6 (Knowledge desire)..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q6","answer_option":"A"}' | python3 -m json.tool
echo ""

# 9. Answer Q7
echo "9. Answering Q7..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q7","answer_option":"A"}' | python3 -m json.tool
echo ""

# 10. Answer Q8
echo "10. Answering Q8..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q8","answer_option":"A"}' | python3 -m json.tool
echo ""

# 11. Answer Q9
echo "11. Answering Q9..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q9","answer_option":"A"}' | python3 -m json.tool
echo ""

# 12. Answer Q10-knowledge-A
echo "12. Answering Q10-knowledge-A..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q10-knowledge-A","answer_option":"A"}' | python3 -m json.tool
echo ""

# 13. Answer Q11-knowledge-B (Final question)
echo "13. Answering Q11-knowledge-B (Final)..."
curl -s -X POST "$API_URL/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q11-knowledge-B","answer_option":"A"}' | python3 -m json.tool
echo ""

# 14. Generate kanji name
echo "14. Generating kanji name..."
echo ""
curl -s -X POST "$API_URL/sessions/$SESSION_ID/generate" \
  -H "Content-Type: application/json" | python3 -m json.tool
echo ""

echo "=== Test Complete ==="