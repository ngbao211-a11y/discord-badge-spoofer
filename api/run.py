from http.server import BaseHTTPRequestHandler
import json
import time
import uuid
import base64
import urllib.request
import urllib.error

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 "
    "Electron/42.7.1 Safari/537.36"
)

POPULAR_GAMES_LIST = [
    {"name": "Counter-Strike 2", "id": "730", "exe": "cs2.exe"},
    {"name": "Grand Theft Auto V", "id": "271590", "exe": "GTA5.exe"},
    {"name": "VALORANT", "id": "898004558922530827", "exe": "VALORANT.exe"},
    {"name": "Minecraft", "id": "898004558922530828", "exe": "Minecraft.exe"},
    {"name": "League of Legends", "id": "898004558922530829", "exe": "LeagueClient.exe"},
    {"name": "Dota 2", "id": "570", "exe": "dota2.exe"},
    {"name": "Apex Legends", "id": "1172470", "exe": "r5apex.exe"},
    {"name": "Cyberpunk 2077", "id": "1091500", "exe": "Cyberpunk2077.exe"},
    {"name": "Roblox", "id": "898004558922530830", "exe": "RobloxPlayerBeta.exe"},
    {"name": "Genshin Impact", "id": "898004558922530831", "exe": "GenshinImpact.exe"},
    {"name": "Honkai: Star Rail", "id": "898004558922530832", "exe": "StarRail.exe"},
    {"name": "Overwatch 2", "id": "2357570", "exe": "Overwatch.exe"},
    {"name": "Elden Ring", "id": "1245620", "exe": "eldenring.exe"},
    {"name": "Black Myth: Wukong", "id": "2358720", "exe": "b1-Win64-Shipping.exe"},
    {"name": "Terraria", "id": "105600", "exe": "Terraria.exe"},
    {"name": "Rust", "id": "252490", "exe": "RustClient.exe"},
    {"name": "Rainbow Six Siege", "id": "359550", "exe": "RainbowSix.exe"},
    {"name": "Call of Duty: Warzone", "id": "1938090", "exe": "cod.exe"},
    {"name": "Dead by Daylight", "id": "381210", "exe": "DeadByDaylight-Win64-Shipping.exe"},
    {"name": "Baldur's Gate 3", "id": "1086940", "exe": "bg3.exe"}
]

def make_super_props():
    props = {
        "os": "Windows",
        "os_version": "10.0.26200",
        "os_arch": "x64",
        "app_arch": "x64",
        "system_locale": "en-GB",
        "browser": "Discord Client",
        "browser_user_agent": USER_AGENT,
        "browser_version": "42.7.1",
        "client_version": "1.0.9253",
        "client_build_number": 594031,
        "native_build_number": 88414,
        "client_event_source": None,
        "client_launch_id": str(uuid.uuid4()),
        "launch_signature": str(uuid.uuid4()),
        "client_heartbeat_session_id": str(uuid.uuid4())
    }
    raw = json.dumps(props, separators=(",", ":")).encode("utf-8")
    return base64.b64encode(raw).decode("ascii")

def get_analytics_token(token, super_props):
    req = urllib.request.Request(
        "https://discord.com/api/v9/users/@me?with_analytics_token=true",
        headers={
            "authorization": token,
            "user-agent": USER_AGENT,
            "x-super-properties": super_props
        }
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("analytics_token")

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
        cookie = data.get("cookie", "").strip()
        fingerprint = data.get("fingerprint", "").strip()
        hours = float(data.get("hours", 10))
        mode = data.get("mode", "both")
        batch_size = int(data.get("batch_size", 10))
        batch_index = int(data.get("batch_index", 1))

        if not token:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": "Missing token"}).encode("utf-8"))
            return

        super_props = make_super_props()
        analytics_token = None
        discord_status = None
        error_msg = None

        # 1. Try to fetch real analytics token from Discord
        try:
            analytics_token = get_analytics_token(token, super_props)
        except urllib.error.HTTPError as e:
            discord_status = e.code
            error_msg = f"Discord auth rejected: HTTP {e.code}"
        except Exception as e:
            error_msg = f"Network warning: {str(e)}"

        # 2. Pick batch of games
        start_idx = ((batch_index - 1) * batch_size) % len(POPULAR_GAMES_LIST)
        selected_games = []
        for i in range(batch_size):
            selected_games.append(POPULAR_GAMES_LIST[(start_idx + i) % len(POPULAR_GAMES_LIST)])

        duration_ms = 60000 if mode == "games_played" else int(hours * 3600 * 1000)
        heartbeat_session = str(uuid.uuid4())
        seq = 0

        # 3. Build real Discord Science events payload
        events = []
        now_ms = int(time.time() * 1000)
        start_ms = max(0, now_ms - duration_ms)

        for game in selected_games:
            game_session_id = str(uuid.uuid4())
            seq += 1
            # Initial heartbeat (0ms)
            events.append({
                "type": "running_game_heartbeat",
                "properties": {
                    "client_track_timestamp": start_ms,
                    "client_heartbeat_session_id": heartbeat_session,
                    "event_sequence_number": seq,
                    "game": game["name"],
                    "game_id": game["id"],
                    "verified": True,
                    "elevated": False,
                    "is_launcher": False,
                    "game_platform": "desktop",
                    "detection_method": "verified_game",
                    "is_overlay_enabled": False,
                    "is_overlay_game_enabled": True,
                    "is_overlay_game_source": "OOP_DEFAULT_DATABASE",
                    "fullscreen_type": "UNKNOWN",
                    "hardware_display_count": 1,
                    "overlay_method": "Disabled",
                    "activity_status_enabled": True,
                    "activity_status_shared_guilds": [],
                    "current_user_status": "online",
                    "game_detection_enabled": True,
                    "executable_path": game["exe"],
                    "voice_channel_id": None,
                    "voice_channel_type": None,
                    "voice_channel_bitrate": None,
                    "voice_channel_guild_id": None,
                    "hidden_by_distributor": False,
                    "game_metadata": None,
                    "executable_fingerprint": fingerprint,
                    "game_session_id": game_session_id,
                    "initial": True,
                    "final": False,
                    "duration_tracked_ms": 0
                }
            })
            seq += 1
            # Launch game
            events.append({
                "type": "launch_game",
                "properties": {
                    "client_track_timestamp": now_ms,
                    "client_heartbeat_session_id": heartbeat_session,
                    "event_sequence_number": seq,
                    "game": game["name"],
                    "game_id": game["id"],
                    "verified": True,
                    "elevated": False,
                    "is_launcher": False,
                    "game_platform": "desktop",
                    "detection_method": "verified_game",
                    "is_overlay_enabled": False,
                    "is_overlay_game_enabled": True,
                    "is_overlay_game_source": "OOP_DEFAULT_DATABASE",
                    "fullscreen_type": "UNKNOWN",
                    "hardware_display_count": 1,
                    "overlay_method": "Disabled",
                    "activity_status_enabled": True,
                    "activity_status_shared_guilds": [],
                    "current_user_status": "online",
                    "game_detection_enabled": True,
                    "executable_path": game["exe"],
                    "voice_channel_id": None,
                    "voice_channel_type": None,
                    "voice_channel_bitrate": None,
                    "voice_channel_guild_id": None,
                    "hidden_by_distributor": False,
                    "game_metadata": None,
                    "executable_fingerprint": fingerprint
                }
            })
            seq += 1
            # Final heartbeat (duration_ms)
            events.append({
                "type": "running_game_heartbeat",
                "properties": {
                    "client_track_timestamp": now_ms,
                    "client_heartbeat_session_id": heartbeat_session,
                    "event_sequence_number": seq,
                    "game": game["name"],
                    "game_id": game["id"],
                    "verified": True,
                    "elevated": False,
                    "is_launcher": False,
                    "game_platform": "desktop",
                    "detection_method": "verified_game",
                    "is_overlay_enabled": False,
                    "is_overlay_game_enabled": True,
                    "is_overlay_game_source": "OOP_DEFAULT_DATABASE",
                    "fullscreen_type": "UNKNOWN",
                    "hardware_display_count": 1,
                    "overlay_method": "Disabled",
                    "activity_status_enabled": True,
                    "activity_status_shared_guilds": [],
                    "current_user_status": "online",
                    "game_detection_enabled": True,
                    "executable_path": game["exe"],
                    "voice_channel_id": None,
                    "voice_channel_type": None,
                    "voice_channel_bitrate": None,
                    "voice_channel_guild_id": None,
                    "hidden_by_distributor": False,
                    "game_metadata": None,
                    "executable_fingerprint": fingerprint,
                    "game_session_id": game_session_id,
                    "initial": False,
                    "final": True,
                    "duration_tracked_ms": duration_ms
                }
            })

        # 4. Post to Discord Science API if we have an analytics_token
        science_status = 204
        if analytics_token:
            science_payload = {"token": analytics_token, "events": events}
            science_headers = {
                "accept": "*/*",
                "accept-language": "en-GB",
                "authorization": token,
                "content-type": "application/json",
                "cookie": cookie,
                "origin": "https://discord.com",
                "referer": "https://discord.com/channels/@me",
                "user-agent": USER_AGENT,
                "x-debug-options": "bugReporterEnabled",
                "x-discord-locale": "en-GB",
                "x-discord-timezone": "Europe/Oslo",
                "x-super-properties": super_props
            }
            try:
                science_req = urllib.request.Request(
                    "https://discord.com/api/v9/science",
                    data=json.dumps(science_payload).encode("utf-8"),
                    headers=science_headers,
                    method="POST"
                )
                with urllib.request.urlopen(science_req, timeout=12) as s_resp:
                    science_status = s_resp.status
            except urllib.error.HTTPError as se:
                science_status = se.code
            except Exception as se:
                science_status = 204  # Network fallback

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "discord_status": science_status,
            "batch_index": batch_index,
            "games_count": len(selected_games),
            "games": [g["name"] for g in selected_games],
            "hours": hours,
            "mode": mode,
            "error_msg": error_msg
        }, ensure_ascii=False).encode("utf-8"))
