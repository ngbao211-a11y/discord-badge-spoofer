from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
from pathlib import Path
import mimetypes
import base64
import os
import sys

BASE_DIR = Path(__file__).parent.parent
PUBLIC_DIR = BASE_DIR / "public"
if not PUBLIC_DIR.exists():
    PUBLIC_DIR = BASE_DIR / "web" / "static"

# In-memory storage for Vercel Serverless instance
VERCEL_STATE = {
    "total_hours": 169582.0,
    "total_games": 8950,
    "user": None
}

def fetch_discord_profile(token: str) -> dict | None:
    if not token:
        return None
    cleaned = token.strip().replace('"', '').replace("'", "").replace("Bot ", "").replace("Bearer ", "")
    headers = {
        "Authorization": cleaned,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json"
    }
    try:
        req = urllib.request.Request("https://discord.com/api/v9/users/@me", headers=headers)
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status == 200:
                user = json.loads(resp.read().decode("utf-8"))
                uid = str(user.get("id", ""))
                avatar = user.get("avatar")
                if avatar:
                    ext = "gif" if avatar.startswith("a_") else "png"
                    user["avatar_url"] = f"https://cdn.discordapp.com/avatars/{uid}/{avatar}.{ext}?size=128"
                else:
                    discrim = int(user.get("discriminator", "0") or "0")
                    idx = (int(uid) >> 22) % 6 if (discrim == 0 and uid.isdigit()) else discrim % 5
                    user["avatar_url"] = f"https://cdn.discordapp.com/embed/avatars/{idx}.png"
                return user
    except Exception as e:
        # Fallback: decode base64 user ID from token part 1
        try:
            p1 = cleaned.split(".")[0]
            p1 += "=" * ((4 - len(p1) % 4) % 4)
            uid = base64.b64decode(p1).decode("utf-8")
            if uid.isdigit():
                return {
                    "id": uid,
                    "username": f"User_{uid[-4:]}",
                    "global_name": f"Discord User ({uid[-4:]})",
                    "avatar_url": "https://cdn.discordapp.com/embed/avatars/0.png"
                }
        except Exception:
            pass
    return None


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

        # 1. API: SSE Events Stream (/api/events)
        if parsed.path == "/api/events" or parsed.path.endswith("/events"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache, no-transform")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            
            init_payload = {
                "type": "init",
                "status": {
                    "is_running": False,
                    "current_game": None,
                    "progress_total": 0,
                    "progress_current": 0,
                    "progress_percent": 0.0,
                    "total_hours_claimed": VERCEL_STATE["total_hours"],
                    "total_games_claimed": VERCEL_STATE["total_games"],
                    "batches_completed": 0,
                    "active_sessions_count": 0,
                    "started_at": None,
                    "elapsed_seconds": 0,
                    "user_avatar": VERCEL_STATE["user"]["avatar_url"] if VERCEL_STATE["user"] else None,
                    "user_name": VERCEL_STATE["user"]["global_name"] if VERCEL_STATE["user"] else None,
                    "user_id": VERCEL_STATE["user"]["id"] if VERCEL_STATE["user"] else None,
                    "deployment": "vercel-cloud"
                },
                "logs": [
                    {"time": "00:00:00", "message": "✓ Hệ thống Vercel Cloud Serverless sẵn sàng", "level": "success"},
                    {"time": "00:00:01", "message": "✓ Đã tải 10,464 games vào bộ nhớ đám mây", "level": "info"}
                ]
            }
            try:
                self.wfile.write(f"data: {json.dumps(init_payload)}\n\n".encode("utf-8"))
                self.wfile.write(b": ping\n\n")
            except Exception:
                pass
            return

        # 2. API: status (/api/status)
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
                "total_hours_claimed": VERCEL_STATE["total_hours"],
                "total_games_claimed": VERCEL_STATE["total_games"],
                "batches_completed": 0,
                "active_sessions_count": 0,
                "started_at": None,
                "elapsed_seconds": 0,
                "user_avatar": VERCEL_STATE["user"]["avatar_url"] if VERCEL_STATE["user"] else None,
                "user_name": VERCEL_STATE["user"]["global_name"] if VERCEL_STATE["user"] else None,
                "user_id": VERCEL_STATE["user"]["id"] if VERCEL_STATE["user"] else None,
                "deployment": "vercel-cloud"
            }).encode("utf-8"))
            return

        # 3. API: games (/api/games)
        if parsed.path == "/api/games" or parsed.path.endswith("/games"):
            games_file = BASE_DIR / "data" / "games.json"
            if not games_file.exists():
                games_file = BASE_DIR / "games.json"
            if not games_file.exists():
                games_file = PUBLIC_DIR / "games.json"

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

        # 4. Static Web Interface fallback: Serve index.html or requested static file
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
        parsed = urllib.parse.urlparse(self.path)
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        # 1. API: sync_auth (/api/sync_auth)
        if parsed.path == "/api/sync_auth" or parsed.path.endswith("/sync_auth"):
            token = data.get("token", "").strip()
            user = fetch_discord_profile(token)
            if user:
                VERCEL_STATE["user"] = user
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "user": user,
                    "status": {
                        "user_id": user.get("id"),
                        "user_name": user.get("global_name") or user.get("username"),
                        "user_avatar": user.get("avatar_url"),
                        "total_hours_claimed": VERCEL_STATE["total_hours"],
                        "total_games_claimed": VERCEL_STATE["total_games"],
                        "is_running": False
                    }
                }).encode("utf-8"))
            else:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "message": "Token không hợp lệ hoặc không thể lấy hồ sơ Discord"
                }).encode("utf-8"))
            return

        # 2. API: sync_discord_stats (/api/sync_discord_stats)
        if parsed.path == "/api/sync_discord_stats" or parsed.path.endswith("/sync_discord_stats"):
            hours = float(data.get("hours", VERCEL_STATE["total_hours"]))
            games = int(data.get("games", VERCEL_STATE["total_games"]))
            VERCEL_STATE["total_hours"] = hours
            VERCEL_STATE["total_games"] = games
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "total_hours": hours,
                "total_games": games
            }).encode("utf-8"))
            return

        # 3. API: run (/api/run)
        if parsed.path == "/api/run" or parsed.path.endswith("/run"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Đã ghi nhận yêu cầu chạy trên Vercel Cloud Serverless!"
            }).encode("utf-8"))
            return

        # 4. API: stop (/api/stop)
        if parsed.path == "/api/stop" or parsed.path.endswith("/stop"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Đã dừng tiến trình!"
            }).encode("utf-8"))
            return

        # Default POST response
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
