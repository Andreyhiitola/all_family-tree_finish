#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import threading
import os
import json
from datetime import datetime
PORT = 8760

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/debug/data':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "people": 7}).encode())
            return
        super().do_GET()

def open_browser():
    import time
    time.sleep(2)
    webbrowser.open('http://localhost:8760')

print("🚀 Сервер на порту 8760...")
threading.Thread(target=open_browser, daemon=True).start()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
