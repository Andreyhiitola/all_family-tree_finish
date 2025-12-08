#!/bin/bash

PORT=8760
IP=$(hostname -I | awk '{print $1}')

echo "Starting local web server..."
echo "Local access: http://localhost:$PORT"
echo "Mobile access: http://$IP:$PORT"
echo ""
echo "Make sure your phone is on the same Wi-Fi network!"
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server $PORT --bind 0.0.0.0
