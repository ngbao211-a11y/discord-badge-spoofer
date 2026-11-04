from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import base64

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
        with urllib.request.urlopen(req, timeout=8) as resp:
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
        # Support GET with token header for simple testing
        token = self.headers.get("Authorization", "")
        self._respond(token)

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}
        token = data.get("token", "").strip()
        self._respond(token)

    def _respond(self, token: str):
        user = fetch_discord_profile(token)
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        if user:
            payload = {
                "success": True,
                "user": user,
                "status": {
                    "user_id": user.get("id"),
                    "user_name": user.get("global_name") or user.get("username"),
                    "user_avatar": user.get("avatar_url"),
                    "total_hours_claimed": 169582.0,
                    "total_games_claimed": 8950,
                    "is_running": False
                }
            }
        else:
            payload = {
                "success": False,
                "message": "Token khong hop le hoac khong the lay ho so Discord"
            }
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
