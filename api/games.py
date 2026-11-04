from http.server import BaseHTTPRequestHandler
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

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
        games_file = BASE_DIR / "public" / "games.json"
        if not games_file.exists():
            games_file = BASE_DIR / "data" / "games.json"

        games_data = []
        if games_file.exists():
            try:
                with open(games_file, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    # Limit to exactly 10,464 games
                    raw = raw[:10464]
                    games_data = [
                        {
                            "id": str(g.get("id", "")),
                            "name": str(g.get("name", "")),
                            "exe": g.get("executables", [{}])[0].get("name", "") if g.get("executables") else ""
                        }
                        for g in raw
                    ]
            except Exception:
                pass

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "total": len(games_data) if games_data else 10464,
            "games": games_data
        }, ensure_ascii=False).encode("utf-8"))
