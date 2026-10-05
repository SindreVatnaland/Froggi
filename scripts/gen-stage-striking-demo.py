"""Generates demo-overlays/StageStriking.json — a stage-striking scene built only from elements +
visibility conditions (no custom logic), so users can restyle every part of it."""
import json, copy, random, string

random.seed(7)
def nid():
    return 'ss' + ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(7))

ANIM_NONE = {"options": {"delay": 0, "duration": 0, "easing": "", "start": 0, "x": 0, "y": 0}, "type": "none"}
FADE_IN = {"options": {"delay": 0, "duration": 150, "easing": "sineOut", "start": 0, "x": 0, "y": 0}, "type": "fade"}
FADE_OUT = {"options": {"delay": 0, "duration": 150, "easing": "sineIn", "start": 0, "x": 0, "y": 0}, "type": "fade"}

def item(element_id, x, y, w, h, *, string='', vis=None, background='#00000000', color='#ffffffff',
         border=None, rounded='rounded-md', fit='cover', align='justify-center', stroke=0):
    i = nid()
    bw = f"{border[0]}rem solid" if border else "0rem solid"
    return {
        "512": {"fixed": True, "resizable": True, "draggable": True, "customDragger": False, "customResizer": True,
                "min": {"w": 1, "h": 1}, "max": {"y": 511, "h": 513}, "w": w, "h": h, "x": x, "y": y, "id": i},
        "elementId": element_id, "id": i,
        "data": {
            "advancedStyling": False,
            "animationTrigger": {"in": ANIM_NONE, "out": ANIM_NONE, "selectedOptions": {}},
            "class": {"rounded": rounded, "alignment": align},
            "css": {"background": background, "borderLeft": bw, "borderRight": bw, "borderTop": bw, "borderBottom": bw,
                    "borderColor": border[1] if border else "#ffffffff", "color": color, "opacity": 1,
                    "fill": "#ff000000", "stroke": "#ff000000", "strokeWidth": 3, "fillOpacity": 1},
            "description": "", "percent": {"startColor": "#ffffff", "endColor": "#6f1622"}, "font": {},
            "image": {"objectFit": fit},
            "visibility": {"in": FADE_IN, "out": FADE_OUT, "selectedOptions": vis or []},
            "shadow": {"x": 0, "y": 0, "spread": 0, "color": "#000000ff"},
            "string": string,
            "textStroke": {"size": stroke, "color": "#000000ff"},
            "transform": {"rotate": 0, "scale": "1, 1", "translate": {"x": 0, "y": 0}},
        },
    }

def on(*options):            # one group: any of these true
    return [{o: 1 for o in options}]

CUSTOM_BOX, CUSTOM_STRING = 3000, 1000  # ids from CustomElement
STRIKE_CURRENT, P1_RPS, P2_RPS, P1_CHAR, P2_CHAR, P1_NAME, P2_NAME = 7030, 7000, 7010, 7200, 7210, 7220, 7230

# (plain image element, condition name, label)
STAGES = [(7600, 'Fountain of Dreams', 'Fountain of Dreams'), (7610, 'Battlefield', 'Battlefield'),
          (7620, 'Final Destination', 'Final Destination'), (7630, 'Dream Land', 'Dream Land'),
          (7640, 'Yoshis Story', "Yoshi's Story"), (7650, 'Pokemon Stadium', 'Pokémon Stadium')]
# 3 × 2 grid of 16:9-ish tiles, centred
W, H = 116, 62
POS = [(70 + c * 128, 84 + r * 86) for r in range(2) for c in range(3)]

layers = []
def layer(title, items):
    layers.append({"title": title, "items": items, "preview": True, "id": None})

STATE_BOXES = [
    ('Picked (green outline)', 'Picked', dict(background='#00000000', border=(0.55, '#22c55eff'))),
    ('Struck / banned (yellow)', 'Struck Or Banned', dict(background='#facc158c')),
    ('DSR blocked (red)', 'DSR Blocked', dict(background='#ef44448c')),
    ('Locked: counterpick in game 1 (grey)', 'Locked', dict(background='#111111b3')),
]
for title, state, style in STATE_BOXES:
    layer(title, [item(CUSTOM_BOX, x, y, W, H, vis=on(f'Strike: {cond} {state}'), **style)
                  for (eid, cond, _), (x, y) in zip(STAGES, POS)])
layer('Stage images', [item(eid, x, y, W, H, vis=[], fit='cover') for (eid, _, _), (x, y) in zip(STAGES, POS)])
for it in layers[-1]['items']:  # always visible (no conditions = shown? keep explicit: whole strike phase)
    it['data']['visibility']['selectedOptions'] = []
layer('Stage names', [item(CUSTOM_STRING, x, y + H + 1, W, 11, string=label, stroke=1)
                      for (_, _, label), (x, y) in zip(STAGES, POS)])
layer('Players', [
    item(P1_NAME, 0, 120, 66, 14, stroke=1),
    item(P1_CHAR, 13, 136, 40, 40, fit='contain', vis=on('Strike Player 1 Character Selected')),
    item(P1_RPS, 0, 180, 66, 12, stroke=1, vis=on('Strike Phase: RPS', 'Strike Phase: RPS Result')),
    item(P2_NAME, 446, 120, 66, 14, stroke=1),
    item(P2_CHAR, 459, 136, 40, 40, fit='contain', vis=on('Strike Player 2 Character Selected')),
    item(P2_RPS, 446, 180, 66, 12, stroke=1, vis=on('Strike Phase: RPS', 'Strike Phase: RPS Result')),
])
layer('Whose turn', [item(STRIKE_CURRENT, 176, 58, 160, 14, color='#facc15ff', stroke=1,
                          vis=on('Strike Player 1 Turn', 'Strike Player 2 Turn'))])
CAPTIONS = [
    ('Strike Phase: Char Select', 'PICK YOUR CHARACTERS'),
    ('Strike Phase: RPS', 'ROCK · PAPER · SCISSORS'),
    ('Strike Phase: RPS Result', 'RPS WINNER CHOOSES: STRIKE FIRST OR SECOND'),
    ('Strike Phase: Striking', 'STRIKE STAGES  1 · 2 · 1'),
    ('Strike Phase: Stage Ban', 'WINNER BANS A STAGE'),
    ('Strike Phase: Stage Pick', 'LOSER PICKS THE STAGE'),
    ('Strike Phase: Character Pick (game 2+)', 'WINNER PICKS CHARACTER FIRST'),
    ('Strike Phase: Playing', 'GOOD LUCK!'),
    ('Strike Phase: Complete', 'SET COMPLETE'),
]
for cond, text in CAPTIONS:
    layer(f'Caption: {text.title()}', [item(CUSTOM_STRING, 106, 36, 300, 20, string=text, stroke=2, vis=on(cond))])
layer('Agreement pending', [item(CUSTOM_STRING, 106, 262, 300, 12, string='WAITING FOR STAGE AGREEMENT (DSR)',
                                 color='#facc15ff', stroke=1, vis=on('Strike: Stage Agreement Pending'))])
layer('Title & legend text', [
    item(CUSTOM_STRING, 156, 8, 200, 24, string='STAGE STRIKING', stroke=2),
    item(CUSTOM_STRING, 100, 247, 312, 12,
         string='GREY = COUNTERPICK (GAME 1) · YELLOW = STRUCK · RED = DSR · GREEN = PICKED', stroke=1),
])
# Backdrops go on a LOWER layer (higher index) than the text drawn over them.
layer('Legend backdrop', [item(CUSTOM_BOX, 92, 245, 328, 16, background='#00000099', rounded='rounded-full')])

for i, l in enumerate(layers):
    l['index'] = i

scene = {
    "active": True, "fallback": "menu",
    "animation": {"duration": 250, "in": {"options": {"delay": 0, "duration": 250, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly automatic"},
                  "out": {"options": {"delay": 0, "duration": 150, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly"}, "layerRenderDelay": 250},
    "background": {"color": "#000000", "customImage": {}, "image": {"src": "MeleeMenuBlue.png", "objectFit": "cover"},
                   "opacity": 100, "type": "Image", "animation": {"in": ANIM_NONE, "out": ANIM_NONE}},
    "font": {"family": "Melee"},
    "layers": layers,
}
overlay = {
    "isDemo": True,
    "description": "Stage striking scene built only from elements + conditions: plain stage images with coloured state layers (grey locked, yellow struck, red DSR, green picked), phase captions and whose turn. Restyle anything.",
    "froggiVersion": "2.0.0-beta.88", "id": "stage-striking", "aspectRatio": {"width": 16, "height": 9},
    "title": "Stage Striking", "strikePhase": scene,
}
json.dump(overlay, open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'demo-overlays' / 'StageStriking.json', 'w'), indent=2, ensure_ascii=False)
print(len(layers), 'layers,', sum(len(l['items']) for l in layers), 'elements')
