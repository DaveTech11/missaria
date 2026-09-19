# Miss Aria AI fix / upgrade

Important: run only ONE Telegram polling instance. If Render shows `Conflict: terminated by other getUpdates request`, stop the old Render/service/process before starting the new one.

Upgrades in this package:
- safe tiny-caps placeholders (no TC0/TC1 leakage)
- safe rich-text placeholders
- command guard so /start and other slash commands never enter the controller
- casual DM guard for owner controller
- removed generic controller fallback
- /clear, /profile and /ai mode controls
- chat mode selection
- Linux musicService import fix
