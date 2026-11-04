from http.server import BaseHTTPRequestHandler
import json
import time

class handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        token = data.get("token", "").strip()
        hours = data.get("hours", 10)
        count = data.get("count", 10464)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "message": "Đã kích hoạt tiến trình Discord Badge Spoofer thành công!",
            "status": {
                "is_running": True,
                "status_text": "Đang chạy...",
                "progress_total": 10464 if count == "all" else count,
                "progress_current": 1,
                "progress_percent": 0.1,
                "total_hours_claimed": 169582.0,
                "total_games_claimed": 8950
            }
        }, ensure_ascii=False).encode("utf-8"))
