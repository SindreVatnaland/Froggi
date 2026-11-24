"""Shared helpers for the demo-overlay generators (gen-*-demo.py): build overlay items in the same
JSON shape the editor saves, with visibility conditions and payload fields."""
import json, copy, random, string

def nid(prefix='ss'):
    return prefix + ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(7))

ANIM_NONE = {"options": {"delay": 0, "duration": 0, "easing": "", "start": 0, "x": 0, "y": 0}, "type": "none"}
FADE_IN = {"options": {"delay": 0, "duration": 150, "easing": "sineOut", "start": 0, "x": 0, "y": 0}, "type": "fade"}
FADE_OUT = {"options": {"delay": 0, "duration": 150, "easing": "sineIn", "start": 0, "x": 0, "y": 0}, "type": "fade"}
# State colour boxes "jump" in: scale from 80% with a slight overshoot (backOut) while fading in.
POP_IN = {"options": {"delay": 0, "duration": 260, "easing": "backOut", "start": 0.8, "x": 0, "y": 0}, "type": "scale"}

def item(element_id, x, y, w, h, *, string='', vis=None, background='#00000000', color='#ffffffff',
         border=None, rounded='rounded-md', fit='cover', align='justify-center', stroke=0, vis_in=None, data=None, opacity=1):
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
                    "borderColor": border[1] if border else "#ffffffff", "color": color, "opacity": opacity,
                    "fill": "#ff000000", "stroke": "#ff000000", "strokeWidth": 3, "fillOpacity": 1},
            "description": "", "percent": {"startColor": "#ffffff", "endColor": "#6f1622"}, "font": {"family": "default"},
            "image": {"objectFit": fit},
            "visibility": {"in": vis_in or FADE_IN, "out": FADE_OUT, "selectedOptions": vis or []},
            "shadow": {"x": 0, "y": 0, "spread": 0, "color": "#000000ff"},
            "string": string,
            "textStroke": {"size": stroke, "color": "#000000ff"},
            "transform": {"rotate": 0, "scale": "1, 1", "translate": {"x": 0, "y": 0}},
            **(data or {}),
        },
    }

def on(*options):            # one group: any of these true
    return [{o: 1 for o in options}]


def _overlap(a, b):
    a, b = a['512'], b['512']
    return a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w'] and a['y'] < b['y'] + b['h'] and b['y'] < a['y'] + a['h']

def split_overlaps(layers):
    """Elements that overlap never share a layer (Froggi refuses it): each layer is split into stacked layers,
    keeping the draw order (an item drawn later in a layer sits above the ones it covers; layer 0 = on top)."""
    out = []
    for layer in layers:
        level = []
        for i, it in enumerate(layer['items']):
            level.append(1 + max((level[j] for j in range(i) if _overlap(layer['items'][j], it)), default=-1))
        top = max(level, default=0)
        for lv in range(top, -1, -1):
            title = layer.get('title', '')
            if lv < top:
                title = f"{title} · back" if top == 1 else f"{title} · {top - lv + 1}"
            out.append({**layer, 'title': title, 'items': [it for it, l in zip(layer['items'], level) if l == lv]})
    for i, l in enumerate(out):
        l['index'] = i
    return out

def no_overlaps(overlay):
    """split_overlaps on every scene of an overlay (call right before writing the JSON)."""
    for scene in overlay.values():
        if isinstance(scene, dict) and 'layers' in scene:
            scene['layers'] = split_overlaps(scene['layers'])
    return overlay
