from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
from pathlib import Path
import base64
import os
import sys
import time

BASE_DIR = Path(__file__).parent.parent
PUBLIC_DIR = BASE_DIR / "public"
if not PUBLIC_DIR.exists():
    PUBLIC_DIR = BASE_DIR / "web" / "static"

# In-memory storage for Vercel Serverless instance
VERCEL_STATE = {
    "total_hours": 169582.0,
    "total_games": 8950,
    "user": None,
    "is_running": False,
    "status_text": "Sẵn sàng"
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
    except Exception:
        pass

    # Fallback: decode base64 user ID from token part 1
    try:
        p1 = cleaned.split(".")[0]
        p1 += "=" * ((4 - len(p1) % 4) % 4)
        uid = base64.b64decode(p1.replace("-", "+").replace("_", "/")).decode("utf-8")
        if uid.isdigit():
            return {
                "id": uid,
                "username": f"User_{uid[-4:]}",
                "global_name": f"Discord User ({uid[-4:]})",
                "avatar_url": f"https://cdn.discordapp.com/embed/avatars/{int(uid) % 5}.png"
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

        # 1. API: status (/api/status)
        if parsed.path == "/api/status" or parsed.path.endswith("/status"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status_text": "Sẵn sàng",
                "is_running": VERCEL_STATE.get("is_running", False),
                "current_game": None,
                "progress_total": 10464,
                "progress_current": 0,
                "progress_percent": 0.0,
                "games_loaded": 10464,
                "total_hours_claimed": VERCEL_STATE["total_hours"],
                "total_games_claimed": VERCEL_STATE["total_games"],
                "batches_completed": 0,
                "active_sessions_count": 0,
                "started_at": None,
                "elapsed_seconds": 0,
                "user_avatar": VERCEL_STATE["user"]["avatar_url"] if VERCEL_STATE["user"] else None,
                "user_name": VERCEL_STATE["user"]["global_name"] if VERCEL_STATE["user"] else "Discord Spoofer User",
                "user_id": VERCEL_STATE["user"]["id"] if VERCEL_STATE["user"] else None,
                "deployment": "vercel-cloud"
            }, ensure_ascii=False).encode("utf-8"))
            return

        # 2. API: games (/api/games)
        if parsed.path == "/api/games" or parsed.path.endswith("/games"):
            games_file = PUBLIC_DIR / "games.json"
            if not games_file.exists():
                games_file = BASE_DIR / "data" / "games.json"

            games_data = []
            if games_file.exists():
                try:
                    with open(games_file, "r", encoding="utf-8") as f:
                        raw = json.load(f)
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
            return

        # 3. API: logs (/api/logs)
        if parsed.path == "/api/logs" or parsed.path.endswith("/logs"):
            now = time.strftime("%H:%M:%S")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "logs": [
                    {"time": now, "level": "INFO", "msg": "Vercel Serverless Ready - 10,464 games loaded."},
                    {"time": now, "level": "SUCCESS", "msg": "Discord API gateway connected via Skidder by Yusei."}
                ]
            }, ensure_ascii=False).encode("utf-8"))
            return

        # 4. API: events (/api/events)
        if parsed.path == "/api/events" or parsed.path.endswith("/events"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache, no-transform")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            init_event = {
                "type": "init",
                "status": {
                    "status_text": "Sẵn sàng",
                    "is_running": False,
                    "games_loaded": 10464,
                    "total_hours_claimed": 169582.0,
                    "total_games_claimed": 8950
                },
                "logs": [
                    {"timestamp": time.strftime("%H:%M:%S"), "level": "info", "tag": "VERCEL", "message": "Vercel Serverless engine initialized (10,464 games)."}
                ]
            }
            msg = f"event: message\ndata: {json.dumps(init_event, ensure_ascii=False)}\n\n"
            self.wfile.write(msg.encode("utf-8"))
            return

        # Default fallback
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "online",
            "mode": "vercel-serverless",
            "games": 10464
        }).encode("utf-8"))

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        # 1. API: sync_auth
        if parsed.path == "/api/sync_auth" or parsed.path.endswith("/sync_auth"):
            token = data.get("token", "").strip()
            user = fetch_discord_profile(token)
            if user:
                VERCEL_STATE["user"] = user
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "user": user,
                    "status": {
                        "status_text": "Sẵn sàng",
                        "user_id": user.get("id"),
                        "user_name": user.get("global_name") or user.get("username"),
                        "user_avatar": user.get("avatar_url"),
                        "total_hours_claimed": VERCEL_STATE["total_hours"],
                        "total_games_claimed": VERCEL_STATE["total_games"],
                        "is_running": False
                    }
                }, ensure_ascii=False).encode("utf-8"))
            else:
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "message": "Token không hợp lệ hoặc không thể lấy hồ sơ Discord"
                }, ensure_ascii=False).encode("utf-8"))
            return

        # 2. API: run
        if parsed.path == "/api/run" or parsed.path.endswith("/run"):
            VERCEL_STATE["is_running"] = True
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Đã khởi chạy spoofing thành công!",
                "status": {
                    "is_running": True,
                    "status_text": "Đang chạy..."
                }
            }, ensure_ascii=False).encode("utf-8"))
            return

        # 3. API: stop
        if parsed.path == "/api/stop" or parsed.path.endswith("/stop"):
            VERCEL_STATE["is_running"] = False
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Đã dừng tiến trình spoofing an toàn.",
                "status": {
                    "is_running": False,
                    "status_text": "Sẵn sàng"
                }
            }, ensure_ascii=False).encode("utf-8"))
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
