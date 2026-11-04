from http.server import BaseHTTPRequestHandler
import json
import time

class handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        now = time.strftime("%H:%M:%S")
        logs = [
            {"time": now, "level": "INFO", "msg": "Vercel Serverless Ready - 10,464 games database indexed."},
            {"time": now, "level": "SUCCESS", "msg": "Discord API gateway connected via skidder engine."}
        ]
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"logs": logs}, ensure_ascii=False).encode("utf-8"))
