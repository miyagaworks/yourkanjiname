#!/bin/bash

SID="1ae42668-6c64-4fd6-a54b-fdcc956b7e57"
API="http://localhost:3000/api"

echo "Testing with session: $SID"
echo ""

echo "=== Q1: Gender Male ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q1","answer_option":"male"}' | python3 -m json.tool
echo ""

echo "=== M-1 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-1","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== M-2 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-2","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== M-3 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-3","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== M-4 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"M-4","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== Q6 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q6","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== Q7 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q7","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== Q8 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q8","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== Q9 ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q9","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== Q10-knowledge-A ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q10-knowledge-A","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== Q11-knowledge-B ==="
curl -s -X POST "$API/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"question_id":"Q11-knowledge-B","answer_option":"A"}' | python3 -m json.tool
echo ""

echo "=== Generate Kanji Name ==="
curl -s -X POST "$API/sessions/$SID/generate" \
  -H "Content-Type: application/json" | python3 -m json.tool
echo ""