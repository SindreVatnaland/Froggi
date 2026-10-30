"""Generates demo-overlays/Highlights.json — what the "Highlights" flow shows: Post Game = the game's best 5,
Post Set = the set's best 15, Menu = today's best. Each scene has a Media element (the OBS replay-buffer clips,
key "game" / "set" / "daily") beside a Highlight Replay element (the same picks redrawn from the replays, key
"replay-game" / "replay-set" / "replay-daily"). Plain elements by key — restyle freely."""
import json, random, re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from demo_overlay_lib import *  # noqa: F401,F403

random.seed(41)
ROOT = pathlib.Path(__file__).resolve().parent.parent
IDS = {m[1]: int(m[2]) for m in re.finditer(r'^\s*(\w+)\s*=\s*(\d+)', (ROOT / 'frontend/src/lib/models/constants/customElement.ts').read_text(), re.M)}
E = lambda name: IDS[name]  # noqa: E731
DIM = '#ffffff80'

def scene(title, key):
    w, h = 236, 133
    y = 60
    items = [
        item(E('CustomBox'), 0, 0, 512, 288, background='#0b0e13f2', rounded=''),
        item(E('CustomString'), 32, 14, 448, 16, string=title, stroke=1),
        item(E('CustomString'), 14, y - 12, w, 8, string='VIDEO · OBS REPLAY BUFFER', color=DIM),
        item(E('PostGameHighlightVideo'), 14, y, w, h, rounded='rounded-md', data={"video": {"key": key, "volume": 0}}),
        item(E('CustomString'), 262, y - 12, w, 8, string='REPLAY · NO OBS NEEDED', color=DIM),
        item(E('HighlightReplay'), 262, y, w, h, rounded='rounded-md', data={"video": {"key": f"replay-{key}", "volume": 0}}),
    ]
    return {
        "active": True, "fallback": "menu",
        "animation": {"duration": 250, "in": {"options": {"delay": 0, "duration": 250, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly automatic"},
                      "out": {"options": {"delay": 0, "duration": 150, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly"}, "layerRenderDelay": 60},
        "background": {"color": "#000000", "customImage": {}, "image": {}, "opacity": 100, "type": "None", "animation": {"in": ANIM_NONE, "out": ANIM_NONE}},
        "font": {"family": "Roboto Bold Italic"},
        "layers": [{"title": f'Highlights "{key}"', "items": items, "preview": True, "id": None, "index": 0}],
    }

overlay = {
    "isDemo": True,
    "description": "What the \"Highlights\" flow shows: Post Game = the game's best 5, Post Set = the set's best 15, Menu = today's best. Left: the OBS replay-buffer clips (Media, keys game / set / daily); right: the same highlights redrawn from the replays (Highlight Replay, keys replay-game / replay-set / replay-daily — no OBS needed). Turn the flow on in Automation → Flows.",
    "froggiVersion": "2.0.0-beta.90", "id": "highlights", "aspectRatio": {"width": 16, "height": 9},
    "title": "Highlights (game, set, daily)",
    "postGame": scene("THIS GAME'S HIGHLIGHTS", 'game'),
    "postSet": scene('SET HIGHLIGHTS', 'set'),
    "menu": scene("TODAY'S HIGHLIGHTS", 'daily'),
}
json.dump(overlay, open(ROOT / 'demo-overlays' / 'Highlights.json', 'w'), indent=2, ensure_ascii=False)
print('Highlights.json written')
