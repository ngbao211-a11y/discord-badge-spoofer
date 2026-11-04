from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
from pathlib import Path
import mimetypes
import os
import sys

BASE_DIR = Path(__file__).parent.parent
PUBLIC_DIR = BASE_DIR / "public"
if not PUBLIC_DIR.exists():
    PUBLIC_DIR = BASE_DIR / "web" / "static"

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

        # 1. API: status
        if parsed.path == "/api/status" or parsed.path.endswith("/status"):
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
            return

        # 2. API: games
        if parsed.path == "/api/games" or parsed.path.endswith("/games"):
            games_file = BASE_DIR / "data" / "games.json"
            if not games_file.exists():
                games_file = BASE_DIR / "games.json"
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
                "games": games_data
            }).encode("utf-8"))
            return

        # 3. Static Web Interface fallback: Serve index.html or requested static file
        rel_path = parsed.path.lstrip("/")
        if not rel_path or rel_path == "index.html":
            file_path = PUBLIC_DIR / "index.html"
        else:
            file_path = PUBLIC_DIR / rel_path
            if not file_path.exists() and rel_path.startswith("static/"):
                file_path = PUBLIC_DIR / rel_path[len("static/"):]

        if file_path.exists() and file_path.is_file():
            mime, _ = mimetypes.guess_type(str(file_path))
            if not mime:
                if str(file_path).endswith(".svg"):
                    mime = "image/svg+xml"
                elif str(file_path).endswith(".css"):
                    mime = "text/css"
                elif str(file_path).endswith(".js"):
                    mime = "application/javascript"
                else:
                    mime = "application/octet-stream"

            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.end_headers()
            self.wfile.write(file_path.read_bytes())
            return

        # If not found, serve index.html by default
        index_file = PUBLIC_DIR / "index.html"
        if index_file.exists():
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(index_file.read_bytes())
            return

        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Not found"}).encode("utf-8"))

    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "message": "Serverless request processed"}).encode("utf-8"))
