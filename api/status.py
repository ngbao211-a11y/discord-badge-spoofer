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
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
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
            "user_name": "Discord Spoofer User",
            "user_id": None,
            "deployment": "vercel-cloud"
        }).encode("utf-8"))
