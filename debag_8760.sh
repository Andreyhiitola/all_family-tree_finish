#!/bin/bash

PORT=8760
IP=$(hostname -I | awk '{print $1}')
PROJECT_PATH="all_family-tree_finish"

# Переходим в родительскую папку (Desktop)
cd ~/Desktop || exit 1

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
