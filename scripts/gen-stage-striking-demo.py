"""Generates demo-overlays/StageStriking.json — a stage-striking scene built only from elements +
visibility conditions (no custom logic), so users can restyle every part of it."""
import json, random, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from demo_overlay_lib import *  # noqa: F401,F403 — item(), on(), animations

random.seed(7)

CUSTOM_BOX, CUSTOM_STRING = 3000, 1000  # ids from CustomElement
STRIKE_CURRENT, RPS_WINNER, FINAL_NAME, FINAL_IMAGE = 7030, 7020, 7040, 7050
P1_ICON, P2_ICON = 7001, 7011
P1_CHAR, P2_CHAR, P1_PARTNER, P2_PARTNER, P1_NAME, P2_NAME = 7200, 7210, 7201, 7211, 7220, 7230
P1_SCORE, P2_SCORE = 7240, 7250  # striking set score

# Phases (visibility condition names)
CHAR_SELECT, CHAR_PICK = 'Strike Phase: Char Select', 'Strike Phase: Character Pick (game 2+)'
RPS, RPS_RESULT = 'Strike Phase: RPS', 'Strike Phase: RPS Result'
STRIKING, BAN, PICK = 'Strike Phase: Striking', 'Strike Phase: Stage Ban', 'Strike Phase: Stage Pick'
PLAYING, COMPLETE = 'Strike Phase: Playing', 'Strike Phase: Complete'
CHARS = on(CHAR_SELECT, CHAR_PICK)
RPS_ANY = on(RPS, RPS_RESULT)
STAGES_PHASE = on(STRIKING, BAN, PICK)

# Character renders facing the middle: Player 1 = the left render, Player 2 = the right render.
RENDER = {1: {"assetPack": "builtin-render-left"}, 2: {"assetPack": "builtin-render-right"}}
# One split for every phase: the two player cards (character select, RPS, summary, result) — x per side.
CARD_X = {1: 52, 2: 294}
CARD_W, CARD_Y, CARD_H = 166, 60, 160
VS = (236, 136, 40, 24)
FRAME_DX, FRAME_Y, FRAME_W, FRAME_H = 20, 94, 126, 120   # the framed content box inside every card
TINT = {1: '#3b82f640', 2: '#ef444440'}

def frame_rect(side):
    return CARD_X[side] + FRAME_DX, FRAME_Y, FRAME_W, FRAME_H

def cards(vis):
    """The two tinted player cards (lowest layer of a phase)."""
    return [item(CUSTOM_BOX, CARD_X[s], CARD_Y, CARD_W, CARD_H, background=TINT[s], rounded='rounded-lg', vis=vis) for s in (1, 2)]
# Characters sit in a framed box (same look in every phase); contain = the whole render, never cut off.
BOX = dict(fit='contain', border=(0.2, '#ffffffff'), background='#00000066')

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

# ── Captions (every phase) ───────────────────────────────────────────────────────────────────────
CAPTIONS = [
    (CHAR_SELECT, 'PICKING CHARACTERS'),
    (RPS, 'ROCK · PAPER · SCISSORS'),
    (RPS_RESULT, 'WINNER CHOOSES: STRIKE FIRST OR SECOND'),
    (STRIKING, 'STRIKE STAGES  1 · 2 · 1'),
    (BAN, 'WINNER BANS A STAGE'),
    (PICK, 'LOSER PICKS THE STAGE'),
    (CHAR_PICK, 'WINNER PICKS CHARACTER FIRST'),
    (PLAYING, 'GOOD LUCK!'),
    (COMPLETE, 'SET COMPLETE'),
]
for cond, text in CAPTIONS:
    layer(f'Caption: {text.title()}', [item(CUSTOM_STRING, 76, 28, 360, 24, string=text, stroke=2, vis=on(cond))])
layer('Title', [item(CUSTOM_STRING, 176, 6, 160, 18, string='STAGE STRIKING', stroke=2, opacity=0.85)])

# ── Rock-paper-scissors: centred split screen (no stages) ────────────────────────────────────────
layer('RPS: winner', [
    item(CUSTOM_STRING, 206, 226, 100, 11, string='RPS WINNER', stroke=1, opacity=0.85, vis=on(RPS_RESULT)),
    item(RPS_WINNER, 106, 238, 300, 24, color='#facc15ff', stroke=2, vis=on(RPS_RESULT)),
])
layer('RPS: hands + names', [
    *[it for side, (name_id, icon_id) in ((1, (P1_NAME, P1_ICON)), (2, (P2_NAME, P2_ICON))) for it in (
        item(name_id, CARD_X[side] + 8, 66, 150, 24, stroke=2, vis=RPS_ANY),
        item(icon_id, *frame_rect(side), vis=RPS_ANY, data={"rpsIconStyle": "color"}, **BOX),
    )],
    item(CUSTOM_STRING, *VS, string='VS', stroke=2, vis=RPS_ANY),
])
layer('RPS: cards', cards(RPS_ANY))

# ── Character select / character pick (game 2+): centred cards ──────────────────────────────────
def card(x, side, name_id, char_id, partner_id, selected_cond):
    return [
        item(name_id, x, 66, 150, 24, stroke=2, vis=CHARS),
        # the render fills the card below the name (contain: the whole character, as big as fits)
        item(char_id, *frame_rect(side), vis=CHARS + on(selected_cond), data=RENDER[side], **BOX),
        item(CUSTOM_BOX, *frame_rect(side), background=BOX['background'], border=BOX['border'], vis=CHARS + [{selected_cond: 2}]),
        item(partner_id, x + 106, 178, 40, 40, vis=CHARS + on(selected_cond), data=RENDER[side], **BOX),
        item(CUSTOM_STRING, CARD_X[side] + FRAME_DX, 146, FRAME_W, 16, string='PICKING…', stroke=1, opacity=0.8,
             vis=CHARS + [{selected_cond: 2}]),
    ]
layer('Characters: cards', card(CARD_X[1] + 8, 1, P1_NAME, P1_CHAR, P1_PARTNER, 'Strike Player 1 Character Selected')
      + card(CARD_X[2] + 8, 2, P2_NAME, P2_CHAR, P2_PARTNER, 'Strike Player 2 Character Selected')
      + [item(CUSTOM_STRING, *VS, string='VS', stroke=2, vis=CHARS),
         item(CUSTOM_STRING, 156, 226, 200, 11, string='STAGE', stroke=1, opacity=0.85, vis=on(CHAR_PICK)),
         item(FINAL_NAME, 156, 238, 200, 20, color='#22c55eff', stroke=2, vis=on(CHAR_PICK))])
layer('Characters: backdrops', cards(CHARS))

# ── Striking / ban / pick: the stage grid ────────────────────────────────────────────────────────
STATE_BOXES = [
    ('Picked (green outline)', 'Picked', dict(background='#00000000', border=(0.55, '#22c55eff'))),
    ('Struck / banned (yellow)', 'Struck Or Banned', dict(background='#facc158c')),
    ('DSR blocked (red)', 'DSR Blocked', dict(background='#ef44448c')),
    ('Locked: counterpick in game 1 (grey)', 'Locked', dict(background='#111111b3')),
]
for title, state, style in STATE_BOXES:
    layer(f'Stages: {title}', [item(CUSTOM_BOX, x, y, W, H, vis=STAGES_PHASE + on(f'Strike: {cond} {state}'), vis_in=POP_IN, **style)
                               for (eid, cond, _), (x, y) in zip(STAGES, POS)])
layer('Stages: images', [item(eid, x, y, W, H, vis=STAGES_PHASE, fit='cover') for (eid, _, _), (x, y) in zip(STAGES, POS)])
layer('Stages: names', [item(CUSTOM_STRING, x, y + H + 1, W, 11, string=label, stroke=1, vis=STAGES_PHASE)
                        for (_, _, label), (x, y) in zip(STAGES, POS)])
# Same card look as the other phases, narrower: the stage grid needs the middle.
SIDE_X = {1: 2, 2: 446}
layer('Stages: players', [
    *[it for side, (name_id, char_id, cond) in ((1, (P1_NAME, P1_CHAR, 'Strike Player 1 Character Selected')), (2, (P2_NAME, P2_CHAR, 'Strike Player 2 Character Selected'))) for it in (
        item(name_id, SIDE_X[side] + 3, 92, 58, 16, stroke=2, vis=STAGES_PHASE),
        item(char_id, SIDE_X[side] + 4, 112, 56, 56, data=RENDER[side], vis=STAGES_PHASE + on(cond), **BOX),
    )],
])
layer('Stages: player cards', [item(CUSTOM_BOX, SIDE_X[s], 84, 64, 92, background=TINT[s], rounded='rounded-lg', vis=STAGES_PHASE) for s in (1, 2)])
layer('Stages: whose turn', [item(STRIKE_CURRENT, 176, 58, 160, 18, color='#facc15ff', stroke=2,
                                  vis=STAGES_PHASE + on('Strike Player 1 Turn', 'Strike Player 2 Turn'))])
layer('Stages: legend', [item(CUSTOM_STRING, 72, 247, 368, 12,
                              string='GREY = COUNTERPICK (GAME 1) · YELLOW = STRUCK · RED = DSR · GREEN = PICKED', stroke=1, vis=STAGES_PHASE)])
layer('Stages: legend backdrop', [item(CUSTOM_BOX, 64, 245, 384, 16, background='#00000099', rounded='rounded-full', vis=STAGES_PHASE)])
layer('Agreement pending', [item(CUSTOM_STRING, 106, 264, 300, 14, string='WAITING FOR STAGE AGREEMENT (DSR)',
                                 color='#facc15ff', stroke=1, vis=on('Strike: Stage Agreement Pending'))])

# ── Playing: summary (stage + matchup) / Complete: the result ────────────────────────────────────
SUMMARY = on(PLAYING, COMPLETE)
layer('Summary: players + result', [
    # Playing + Complete: the same cards — name, character in its frame
    *[it for side, (name_id, char_id) in ((1, (P1_NAME, P1_CHAR)), (2, (P2_NAME, P2_CHAR))) for it in (
        item(name_id, CARD_X[side] + 8, 66, 150, 24, stroke=2, vis=SUMMARY),
        item(char_id, *frame_rect(side), data=RENDER[side], vis=SUMMARY, **BOX),
    )],
    # Playing: VS + the stage name below
    item(CUSTOM_STRING, *VS, string='VS', stroke=2, vis=on(PLAYING)),
    item(CUSTOM_STRING, 156, 226, 200, 11, string='STAGE', stroke=1, opacity=0.85, vis=on(PLAYING)),
    item(FINAL_NAME, 116, 238, 280, 26, stroke=2, vis=on(PLAYING)),
    # Complete: the set score where VS is
    item(P1_SCORE, 220, 130, 22, 36, stroke=2, vis=on(COMPLETE)),
    item(CUSTOM_STRING, 242, 130, 28, 36, string='-', stroke=2, vis=on(COMPLETE)),
    item(P2_SCORE, 270, 130, 22, 36, stroke=2, vis=on(COMPLETE)),
])
layer('Summary: cards', cards(SUMMARY))
# Playing: the picked stage fills the whole 16:9 frame, dimmed so the text stays readable (lowest layers).
layer('Summary: stage dim', [item(CUSTOM_BOX, 0, 0, 512, 288, background='#00000059', rounded='', vis=on(PLAYING))])
layer('Summary: stage (full frame)', [item(FINAL_IMAGE, 0, 0, 512, 288, fit='cover', rounded='', vis=on(PLAYING))])

for i, l in enumerate(layers):
    l['index'] = i

scene = {
    "active": True, "fallback": "menu",
    "animation": {"duration": 250, "in": {"options": {"delay": 0, "duration": 250, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly automatic"},
                  "out": {"options": {"delay": 0, "duration": 150, "easing": "expoIn", "start": 0, "x": 0, "y": 0}, "type": "fly"}, "layerRenderDelay": 60},
    "background": {"color": "#000000", "customImage": {}, "image": {"src": "MeleeMenuBlue.png", "objectFit": "cover"},
                   "opacity": 100, "type": "Image", "animation": {"in": ANIM_NONE, "out": ANIM_NONE}},
    "font": {"family": "Roboto Bold Italic"},
    "layers": layers,
}
overlay = {
    "isDemo": True,
    "description": "Stage striking scene built only from elements + conditions, one look per phase: centred character cards, a rock-paper-scissors split screen (the hands shuffle on the reveal), the stage grid with coloured state layers (grey locked, yellow struck, red DSR, green picked), a summary with the picked stage, and the set result. Restyle anything.",
    "froggiVersion": "2.0.0-beta.91", "id": "stage-striking", "aspectRatio": {"width": 16, "height": 9},
    "title": "Stage Striking", "strikePhase": scene,
}
json.dump(no_overlaps(overlay), open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'demo-overlays' / 'StageStriking.json', 'w'), indent=2, ensure_ascii=False)
print(len(layers), 'layers,', sum(len(l['items']) for l in layers), 'elements')
