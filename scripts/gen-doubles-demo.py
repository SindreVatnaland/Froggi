"""Generates demo-overlays/Doubles.json — 16:9 doubles overlay with the 4:3 game on the RIGHT and a column
on the left: per team a webcam frame (put the camera source under it in OBS), the team name + set score and
one row per player (port, character, stocks). Percents sit along the bottom of the game with each player's
name under it, teams kept together. Built only from elements + conditions (playerSlot + doubles
conditions), so it can be restyled freely."""
import json, random, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from demo_overlay_lib import *  # noqa: F401,F403

random.seed(11)

CUSTOM_BOX, CUSTOM_STRING = 3000, 1000
CHARACTER, PERCENT, TAG, SET_SCORE, PORT = 6225, 1011, 4420, 4200, 1900
TEAM_NAME = {1: 1910, 2: 1911}
ACCENT = {1: '#ef4444ff', 2: '#3b82f6ff'}
TINT = {1: '#ef444426', 2: '#3b82f626'}
# Stock-condition name per slot (Player 1/2 conditions = Team 1/2 · Player 1)
STOCK_COND = {'t1p1': 'Player 1 Stock {}', 't2p1': 'Player 2 Stock {}', 't1p2': 'Team 1 Player 2 Stock {}', 't2p2': 'Team 2 Player 2 Stock {}'}
RUNNING = [{'Game Running': 1}]
GAME_X = 128  # the 4:3 game fills x 128–512 (384 × 288)

def slot(s, **extra):
    return {'playerSlot': s, **extra}

layers = []
def layer(title, items):
    layers.append({"title": title, "items": items, "preview": True, "id": None})

cams, headers, rows, percents, backdrops = [], [], [], [], []
for team, top in ((1, 0), (2, 144)):
    # column backdrop below the webcam only — the webcam frame stays see-through for the OBS camera
    backdrops.append(item(CUSTOM_BOX, 0, top + 72, GAME_X, 72, background='#0b0e13f2', rounded=''))
    # webcam frame: transparent inside, team-coloured border — the OBS camera source goes underneath
    cams.append(item(CUSTOM_BOX, 4, top + 4, 120, 68, background='#00000000', border=(0.2, ACCENT[team]), rounded='rounded-md'))
    cams.append(item(CUSTOM_STRING, 4, top + 32, 120, 10, string='WEBCAM', color='#ffffff40'))
    headers += [
        item(TEAM_NAME[team], 6, top + 75, 92, 13, stroke=1, align='justify-start'),
        item(SET_SCORE, 100, top + 74, 24, 15, stroke=1, color=ACCENT[team], data=slot(f't{team}p1')),
    ]
    backdrops.append(item(CUSTOM_BOX, 2, top + 90, 124, 52, background=TINT[team], rounded='rounded-md'))
    for i, s in enumerate((f't{team}p1', f't{team}p2')):
        y = top + 92 + i * 25
        rows += [
            item(PORT, 6, y + 4, 14, 14, stroke=1, data=slot(s)),
            item(CHARACTER, 24, y, 22, 22, fit='contain', data=slot(s, assetPack='builtin-stock')),
        ]
        for k in range(1, 5):
            rows.append(item(CHARACTER, 52 + (k - 1) * 17, y + 4, 14, 14, fit='contain',
                             vis=[{STOCK_COND[s].format(k): 1}], data=slot(s, assetPack='builtin-stock')))

# Bottom of the game: percent with the player's name under it; Team 1 left half, Team 2 right half.
for team, x in ((1, GAME_X + 4), (2, GAME_X + 194)):
    backdrops.append(item(CUSTOM_BOX, x, 238, 186, 46, background='#00000099', border=(0.15, ACCENT[team]), vis=RUNNING))
for i, s in enumerate(('t1p1', 't1p2', 't2p1', 't2p2')):
    x = GAME_X + 8 + i * 95 + (4 if i >= 2 else 0)
    percents += [
        item(PERCENT, x, 240, 86, 28, vis=RUNNING, data=slot(s)),
        item(TAG, x, 268, 86, 12, stroke=1, vis=RUNNING, data=slot(s)),
    ]

layer('Webcam frames', cams)
layer('Team headers (name, set score)', headers)
layer('Player rows (port, character, stocks)', rows)
layer('Percents + names', percents)
layer('Backdrops', backdrops)
for i, l in enumerate(layers):
    l['index'] = i

scene = {
    "active": True, "fallback": "menu",
    "animation": {"duration": 250, "in": {"options": {"delay": 0, "duration": 250, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly automatic"},
                  "out": {"options": {"delay": 0, "duration": 150, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly"}, "layerRenderDelay": 60},
    "background": {"color": "#000000", "customImage": {}, "image": {}, "opacity": 100, "type": "None", "animation": {"in": ANIM_NONE, "out": ANIM_NONE}},
    "font": {"family": "Roboto Bold Italic"},
    "layers": layers,
}
overlay = {
    "isDemo": True,
    "description": "Doubles for a 4:3 game on the right of a 16:9 stream: on the left per team a webcam frame (put your camera source under it in OBS), team name + set score and a row per player (port, character, stocks); percents with names under them along the bottom of the game. Uses Styling → Player slots and the Doubles conditions.",
    "froggiVersion": "2.0.0-beta.91", "id": "doubles", "aspectRatio": {"width": 16, "height": 9},
    "title": "Doubles (game right, webcams left)", "inGame": scene,
}
out = pathlib.Path(__file__).resolve().parent.parent / 'demo-overlays' / 'Doubles.json'
json.dump(no_overlaps(overlay), open(out, 'w'), indent=2, ensure_ascii=False)
print(len(layers), 'layers,', sum(len(l['items']) for l in layers), 'elements')
