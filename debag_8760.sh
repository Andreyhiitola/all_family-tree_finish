#!/bin/bash

PORT=8760
IP=$(hostname -I | awk '{print $1}')
PROJECT_PATH="all_family-tree_finish"

# Проверяем и убиваем процесс на порту
echo "🔍 Checking port $PORT..."
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ ! -z "$PID" ]; then
  echo "⚠️  Port $PORT is already in use (PID: $PID)"
  echo "🔪 Killing process..."
  kill -9 $PID 2>/dev/null
  sleep 1
  echo "✅ Port $PORT is now free"
else
  echo "✅ Port $PORT is available"
fi

# Переходим в родительскую папку (Desktop)
cd ~/Desktop || exit 1

echo ""
echo "======================================"
echo "🚀 Starting Family Tree Web Server"
echo "======================================"
echo ""
echo "📂 Serving from: ~/Desktop/"
echo "🌐 Project path: $PROJECT_PATH/"
echo ""
echo "📱 Access URLs:"
echo "   Local:"
echo "      http://localhost:$PORT/$PROJECT_PATH/"
echo "      http://127.0.0.1:$PORT/$PROJECT_PATH/"
echo "      http://0.0.0.0:$PORT/$PROJECT_PATH/"
echo ""
echo "   Mobile (same Wi-Fi):"
echo "      http://$IP:$PORT/$PROJECT_PATH/"
echo ""
echo "⚠️  IMPORTANT: Always include trailing slash!"
echo "✅ Make sure mobile device is on same Wi-Fi network"
echo "🛑 Press Ctrl+C to stop server"
echo ""
echo "======================================"
echo ""

python3 -m http.server $PORT --bind 0.0.0.0
