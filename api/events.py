from http.server import BaseHTTPRequestHandler
import json

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
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.send_header("Connection", "close")
        self.end_headers()
        init_payload = {
            "type": "init",
            "status": {
                "is_running": False,
                "current_game": None,
                "progress_total": 0,
                "progress_current": 0,
                "progress_percent": 0.0,
                "total_hours_claimed": 169582.0,
                "total_games_claimed": 8950,
                "batches_completed": 0,
                "active_sessions_count": 0,
                "started_at": None,
                "elapsed_seconds": 0,
                "user_avatar": None,
                "user_name": None,
                "user_id": None,
                "deployment": "vercel-cloud"
            },
            "logs": [
                {"time": "00:00:00", "message": "✓ Vercel Cloud Serverless sẵn sàng", "level": "success"},
                {"time": "00:00:01", "message": "✓ Thư viện 10,464 games đã tải", "level": "info"}
            ]
        }
        try:
            self.wfile.write(f"data: {json.dumps(init_payload)}\n\n".encode("utf-8"))
            self.wfile.write(b": ping\n\n")
            self.wfile.flush()
        except Exception:
            pass
