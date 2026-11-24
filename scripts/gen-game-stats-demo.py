"""Generates demo-overlays/GameStats.json — post-game and post-set stats for a 4:3 game in a 16:9
stream. Post Game: each player's side band shows the set context (tag, character, set score) and this
game's fight + punish stats. Post Set: the set totals (incl. L-cancel and inputs per minute) and a game
by game summary in the middle (stage, characters, winner, score). Built only from existing elements +
conditions, so it can be restyled freely. Element ids are read from customElement.ts."""
import json, random, re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from demo_overlay_lib import *  # noqa: F401,F403

random.seed(23)
ROOT = pathlib.Path(__file__).resolve().parent.parent
IDS = {m[1]: int(m[2]) for m in re.finditer(r'^\s*(\w+)\s*=\s*(\d+)', (ROOT / 'frontend/src/lib/models/constants/customElement.ts').read_text(), re.M)}
E = lambda name: IDS[name]  # noqa: E731

ACCENT = {1: '#ef4444ff', 2: '#3b82f6ff'}
DIM = '#ffffff8c'
ROW_BG = '#1b212bf2'  # game rows look the same on Post Game (over the game) and Post Set
BAND_X = {1: 0, 2: 448}

def band_header(p, items, backdrops, accents):
    x = BAND_X[p]
    backdrops.append(item(E('CustomBox'), x, 0, 64, 288, background='#0b0e13e6', rounded=''))
    accents.append(item(E('CustomBox'), x if p == 1 else 508, 0, 4, 288, background=ACCENT[p], rounded=''))
    items += [
        item(E(f'MatchPlayer{p}Tag'), x + 4, 6, 56, 12, stroke=1),
        item(E(f'CurrentSetGameRecentPlayer{p}CharacterIcon'), x + 20, 20, 24, 24, fit='contain'),
        item(E(f'CurrentSetGameRecentPlayer{p}Score'), x + 4, 46, 56, 28, stroke=1),
    ]

def pop(delay):
    """Pop in (scale from 80% with a little overshoot) after `delay` ms — rows appear one after another."""
    return {"options": {**POP_IN["options"], "delay": delay}, "type": POP_IN["type"]}

def stat_rows(p, rows, title, items, top=82, step=23):
    x = BAND_X[p]
    items.append(item(E('CustomString'), x + 4, top, 56, 7, string=title, color=ACCENT[p]))
    for i, (label, name) in enumerate(rows):
        y = top + 11 + i * step
        items += [
            item(E('CustomString'), x + 4, y, 56, 6, string=label.upper(), color=DIM),
            item(E(name.format(p=p)), x + 4, y + 7, 56, 12, stroke=1, vis_in=pop(250 + i * 80)),
        ]

def scene(layers, active=True):
    for i, l in enumerate(layers):
        l['index'] = i
    return {
        "active": active, "fallback": "menu",
        "animation": {"duration": 250, "in": {"options": {"delay": 0, "duration": 250, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly automatic"},
                      "out": {"options": {"delay": 0, "duration": 150, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly"}, "layerRenderDelay": 60},
        "background": {"color": "#000000", "customImage": {}, "image": {}, "opacity": 100, "type": "None", "animation": {"in": ANIM_NONE, "out": ANIM_NONE}},
        "font": {"family": "Roboto Bold Italic"},
        "layers": layers,
    }

def L(title, items):
    return {"title": title, "items": items, "preview": True, "id": None}

def highlights(key, top):
    """Below the centred stats: a label + a 16:9 Video element playing highlight video `key` (built by the
    Highlights flow: "game" = this game's best, "set" = the set game by game). Empty until a flow builds it."""
    h = 287 - (top + 7)
    w = round(h * 16 / 9)
    return [
        item(E('CustomString'), 148, top, 216, 6, string='HIGHLIGHTS', color=DIM),
        item(E('PostGameHighlightVideo'), 256 - w // 2, top + 7, w, h, rounded='rounded-md', data={"video": {"key": key, "volume": 0}}),
    ]


def game_row(n, x0, y, h):
    """Game n of the set as ONE layer's items: stage, both characters (loser faded, winner ringed) and
    4 stock icons each (lost stocks faded). Shown once game n is played; one layer per game so the
    layer delay reveals the games one after another."""
    done = f'Post Game {n} Summary Completed'
    shown = [{done: 1}]
    icon, stock = round(h * 0.56), max(5, round(h * 0.16))
    blocks = {1: x0 + 22, 2: x0 + 128}           # each player block is 32 wide
    items = [
        item(E('CustomBox'), x0, y, 216, h, background=ROW_BG, vis=shown),
        item(E('CustomString'), x0 + 3, y + h // 2 - 6, 16, 12, string=f'G{n}', color=DIM, vis=shown),
        item(E(f'CurrentSetGame{n}Stage'), x0 + 58, y + 3, 66, h - 6, fit='cover', vis=shown),
    ]
    for p, bx in blocks.items():
        win = f'Post Game {n} Summary Player {p} Win'
        ix = bx + (32 - icon) // 2
        el = E(f'CurrentSetGame{n}Player{p}CharacterIcon')
        items += [
            item(E('CustomBox'), ix - 2, y + 1, icon + 4, icon + 2, background='#00000000', border=(0.15, ACCENT[p]),
                 rounded='rounded-full', vis=[{done: 1}, {win: 1}]),
            item(el, ix, y + 2, icon, icon, fit='contain', vis=[{done: 1}, {win: 1}]),
            item(el, ix, y + 2, icon, icon, fit='contain', vis=[{done: 1}, {win: 2}], opacity=0.35),
        ]
        sx = bx + (32 - 4 * stock - 3) // 2
        for k in range(1, 5):
            kx, ky = sx + (k - 1) * (stock + 1), y + h - stock - 2
            items.append(item(el, kx, ky, stock, stock, fit='contain', vis=shown, opacity=0.25))
            items.append(item(el, kx, ky, stock, stock, fit='contain', vis=[{done: 1}, {f'Post Game {n} Summary Player {p} Stock {k}': 1}]))
    items += [
        item(E(f'CurrentSetGame{n}Player1Score'), x0 + 166, y + h // 2 - 7, 14, 14, vis=shown, stroke=1),
        item(E('CustomString'), x0 + 180, y + h // 2 - 7, 10, 14, string='–', color=DIM, vis=shown),
        item(E(f'CurrentSetGame{n}Player2Score'), x0 + 190, y + h // 2 - 7, 14, 14, vis=shown, stroke=1),
    ]
    return L(f'Game {n}', items)

# ── Post Game: this game's stats per player ─────────────────────────────────────────────────────
GAME_ROWS = [
    ('Damage dealt', 'LivePlayer{p}Damage'),
    ('KOs', 'LivePlayer{p}Kos'),
    ('Avg KO %', 'LivePlayer{p}AvgKoPercent'),
    ('Avg death %', 'LivePlayer{p}AvgDeathPercent'),
    ('Openings / KO', 'PostGamePlayer{p}OverallOpeningsPerKill'),
    ('Damage / opening', 'PostGamePlayer{p}OverallDamagePerOpening'),
    ('Neutral wins', 'PostGamePlayer{p}OverallNeutralWinsCount'),
    ('Counter hits', 'PostGamePlayer{p}OverallCounterHitCount'),
]
pg_text, pg_back, pg_acc = [], [], []
for p in (1, 2):
    band_header(p, pg_text, pg_back, pg_acc)
    stat_rows(p, GAME_ROWS, 'THIS GAME', pg_text)
# The set so far, centred over the results screen — one compact row per played game.
pg_text.append(item(E('CustomString'), 148, 4, 216, 8, string='GAMES SO FAR', color=DIM))
pg_games = [game_row(n, 148, 14 + (n - 1) * 32, 30) for n in range(1, 6)]
post_game = scene([L('Stats & set context', pg_text), *pg_games, L('Highlights', highlights('game', 176)), L('Player colour accents', pg_acc), L('Backdrops', pg_back)])

# ── Post Set: set totals per player + a game-by-game summary ────────────────────────────────────
SET_ROWS = [
    ('Damage dealt', 'LiveMatchPlayer{p}Damage'),
    ('KOs', 'LiveMatchPlayer{p}Kos'),
    ('Avg KO %', 'LiveMatchPlayer{p}AvgKoPercent'),
    ('Avg death %', 'LiveMatchPlayer{p}AvgDeathPercent'),
    ('Openings / KO', 'PostGameMatchPlayer{p}OverallOpeningsPerKill'),
    ('Damage / opening', 'PostGameMatchPlayer{p}OverallDamagePerOpening'),
    ('Neutral wins', 'PostGameMatchPlayer{p}OverallNeutralWinsCount'),
    ('L-cancel %', 'PostGameMatchPlayer{p}ActionCountLCancelSuccessPercent'),
    ('Inputs / min', 'PostGameMatchPlayer{p}OverallInputsPerMinute'),
]
ps_text, ps_back, ps_acc = [], [], []
for p in (1, 2):
    band_header(p, ps_text, ps_back, ps_acc)
    stat_rows(p, SET_ROWS, 'SET TOTAL', ps_text, step=21)

ps_back.append(item(E('CustomBox'), 64, 0, 384, 288, background='#0b0e13f2', rounded=''))  # cover the game area
# Same layout as Post Game: label, the games, then the highlights — only the label text differs.
ps_text.append(item(E('CustomString'), 148, 4, 216, 8, string='SET COMPLETED', color=DIM))
ps_games = [game_row(n, 148, 14 + (n - 1) * 32, 30) for n in range(1, 6)]
post_set = scene([
    L('Set totals & title', ps_text),
    *ps_games,
    L('Highlights', highlights('set', 176)),
    L('Player colour accents', ps_acc),
    L('Backdrops', ps_back),
])

overlay = {
    "isDemo": True,
    "description": "Stats between games for a 4:3 game in a 16:9 stream. Post Game: tag, character, set score and this game's damage, KOs, avg KO/death %, openings per KO, damage per opening, neutral wins and counter hits per player. Post Set: the set totals (incl. L-cancel % and inputs per minute) and each game's stage, characters, winner and score.",
    "froggiVersion": "2.0.0-beta.90", "id": "game-stats", "aspectRatio": {"width": 16, "height": 9},
    "title": "Game & set stats (4:3 game, side bands)", "postGame": post_game, "postSet": post_set,
}
out = ROOT / 'demo-overlays' / 'GameStats.json'
json.dump(no_overlaps(overlay), open(out, 'w'), indent=2, ensure_ascii=False)
print(sum(len(l['items']) for s in (post_game, post_set) for l in s['layers']), 'elements')
