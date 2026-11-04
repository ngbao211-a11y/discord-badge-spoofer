from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
from pathlib import Path
import os
import sys

# Add parent directory to path so core_engine can be imported
sys.path.insert(0, str(Path(__file__).parent.parent))

class handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)

        if parsed.path.endswith("/status"):
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
        elif parsed.path.endswith("/games"):
            games_file = Path(__file__).parent.parent / "games.json"
            games_data = []
            if games_file.exists():
                try:
                    with open(games_file, "r", encoding="utf-8") as f:
                        raw = json.load(f)
                        games_data = [{"id": g.get("id", ""), "name": g.get("name", ""), "exe": g.get("executables", [{}])[0].get("name", "") if g.get("executables") else ""} for g in raw]
                except Exception:
                    pass
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "total": len(games_data),
                "games": games_data[:1000] if len(games_data) > 1000 else games_data
            }).encode("utf-8"))
        else:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "online", "mode": "vercel-serverless"}).encode("utf-8"))

    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "message": "Serverless request processed"}).encode("utf-8"))
