#!/bin/bash
# データベースの接続文字列を入力してください（改行なし、1行で）
read -p "DATABASE_URL: " db_url
export DATABASE_URL="$db_url"
node test-db.js
