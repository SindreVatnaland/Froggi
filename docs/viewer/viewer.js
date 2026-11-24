function Xe() {
}
function xc(n) {
  return n();
}
function Yu() {
  return /* @__PURE__ */ Object.create(null);
}
function Mr(n) {
  n.forEach(xc);
}
function Yc(n) {
  return typeof n == "function";
}
function Dr(n, r) {
  return n != n ? r == r : n !== r || n && typeof n == "object" || typeof n == "function";
}
let Ci;
function zu(n, r) {
  return Ci || (Ci = document.createElement("a")), Ci.href = r, n === Ci.href;
}
function Ig(n) {
  return Object.keys(n).length === 0;
}
function Kg(n, ...r) {
  if (n == null)
    return Xe;
  const i = n.subscribe(...r);
  return i.unsubscribe ? () => i.unsubscribe() : i;
}
function Mg(n, r, i) {
  n.$$.on_destroy.push(Kg(r, i));
}
function Z(n, r) {
  n.appendChild(r);
}
function so(n, r, i) {
  const l = Pg(n);
  if (!l.getElementById(r)) {
    const u = Ke("style");
    u.id = r, u.textContent = i, Og(l, u);
  }
}
function Pg(n) {
  if (!n)
    return document;
  const r = n.getRootNode ? n.getRootNode() : n.ownerDocument;
  return r && r.host ? r : n.ownerDocument;
}
function Og(n, r) {
  return Z(n.head || n, r), r.sheet;
}
function U(n, r, i) {
  n.insertBefore(r, i || null);
}
function G(n) {
  n.parentNode && n.parentNode.removeChild(n);
}
function ia(n, r) {
  for (let i = 0; i < n.length; i += 1)
    n[i] && n[i].d(r);
}
function Ke(n) {
  return document.createElement(n);
}
function X(n) {
  return document.createElementNS("http://www.w3.org/2000/svg", n);
}
function Yt(n) {
  return document.createTextNode(n);
}
function qe() {
  return Yt(" ");
}
function Ue() {
  return Yt("");
}
function Bi(n, r, i, l) {
  return n.addEventListener(r, i, l), () => n.removeEventListener(r, i, l);
}
function p(n, r, i) {
  i == null ? n.removeAttribute(r) : n.getAttribute(r) !== i && n.setAttribute(r, i);
}
function Gg(n) {
  return n === "" ? null : +n;
}
function Ug(n) {
  return Array.from(n.childNodes);
}
function kr(n, r) {
  r = "" + r, n.data !== r && (n.data = r);
}
function Ju(n, r) {
  n.value = r ?? "";
}
function vi(n, r, i, l) {
  i == null ? n.style.removeProperty(r) : n.style.setProperty(r, i, l ? "important" : "");
}
function na(n, r, i) {
  n.classList[i ? "add" : "remove"](r);
}
let Ca;
function ka(n) {
  Ca = n;
}
function zc() {
  if (!Ca)
    throw new Error("Function called outside component initialization");
  return Ca;
}
function Jc(n) {
  zc().$$.on_mount.push(n);
}
function qc(n) {
  zc().$$.on_destroy.push(n);
}
const ta = [], ao = [];
let aa = [];
const qu = [], Ng = /* @__PURE__ */ Promise.resolve();
let io = !1;
function xg() {
  io || (io = !0, Ng.then(Xc));
}
function no(n) {
  aa.push(n);
}
const $n = /* @__PURE__ */ new Set();
let $r = 0;
function Xc() {
  if ($r !== 0)
    return;
  const n = Ca;
  do {
    try {
      for (; $r < ta.length; ) {
        const r = ta[$r];
        $r++, ka(r), Yg(r.$$);
      }
    } catch (r) {
      throw ta.length = 0, $r = 0, r;
    }
    for (ka(null), ta.length = 0, $r = 0; ao.length; )
      ao.pop()();
    for (let r = 0; r < aa.length; r += 1) {
      const i = aa[r];
      $n.has(i) || ($n.add(i), i());
    }
    aa.length = 0;
  } while (ta.length);
  for (; qu.length; )
    qu.pop()();
  io = !1, $n.clear(), ka(n);
}
function Yg(n) {
  if (n.fragment !== null) {
    n.update(), Mr(n.before_update);
    const r = n.dirty;
    n.dirty = [-1], n.fragment && n.fragment.p(n.ctx, r), n.after_update.forEach(no);
  }
}
function zg(n) {
  const r = [], i = [];
  aa.forEach((l) => n.indexOf(l) === -1 ? r.push(l) : i.push(l)), i.forEach((l) => l()), aa = r;
}
const Hi = /* @__PURE__ */ new Set();
let Kr;
function Ba() {
  Kr = {
    r: 0,
    c: [],
    p: Kr
    // parent group
  };
}
function va() {
  Kr.r || Mr(Kr.c), Kr = Kr.p;
}
function xe(n, r) {
  n && n.i && (Hi.delete(n), n.i(r));
}
function ct(n, r, i, l) {
  if (n && n.o) {
    if (Hi.has(n))
      return;
    Hi.add(n), Kr.c.push(() => {
      Hi.delete(n), l && (i && n.d(1), l());
    }), n.o(r);
  } else
    l && l();
}
function Ei(n, r) {
  n.d(1), r.delete(n.key);
}
function Jg(n, r) {
  ct(n, 1, 1, () => {
    r.delete(n.key);
  });
}
function ya(n, r, i, l, u, h, S, A, T, g, d, w) {
  let L = n.length, D = h.length, C = L;
  const B = {};
  for (; C--; )
    B[n[C].key] = C;
  const v = [], I = /* @__PURE__ */ new Map(), fe = /* @__PURE__ */ new Map(), N = [];
  for (C = D; C--; ) {
    const V = w(u, h, C), x = i(V);
    let ue = S.get(x);
    ue ? l && N.push(() => ue.p(V, r)) : (ue = g(x, V), ue.c()), I.set(x, v[C] = ue), x in B && fe.set(x, Math.abs(C - B[x]));
  }
  const M = /* @__PURE__ */ new Set(), oe = /* @__PURE__ */ new Set();
  function te(V) {
    xe(V, 1), V.m(A, d), S.set(V.key, V), d = V.first, D--;
  }
  for (; L && D; ) {
    const V = v[D - 1], x = n[L - 1], ue = V.key, R = x.key;
    V === x ? (d = V.first, L--, D--) : I.has(R) ? !S.has(ue) || M.has(ue) ? te(V) : oe.has(R) ? L-- : fe.get(ue) > fe.get(R) ? (oe.add(ue), te(V)) : (M.add(R), L--) : (T(x, S), L--);
  }
  for (; L--; ) {
    const V = n[L];
    I.has(V.key) || T(V, S);
  }
  for (; D; )
    te(v[D - 1]);
  return Mr(N), v;
}
function Ki(n) {
  n && n.c();
}
function ba(n, r, i, l) {
  const { fragment: u, after_update: h } = n.$$;
  u && u.m(r, i), l || no(() => {
    const S = n.$$.on_mount.map(xc).filter(Yc);
    n.$$.on_destroy ? n.$$.on_destroy.push(...S) : Mr(S), n.$$.on_mount = [];
  }), h.forEach(no);
}
function Wa(n, r) {
  const i = n.$$;
  i.fragment !== null && (zg(i.after_update), Mr(i.on_destroy), i.fragment && i.fragment.d(r), i.on_destroy = i.fragment = null, i.ctx = []);
}
function qg(n, r) {
  n.$$.dirty[0] === -1 && (ta.push(n), xg(), n.$$.dirty.fill(0)), n.$$.dirty[r / 31 | 0] |= 1 << r % 31;
}
function Ha(n, r, i, l, u, h, S, A = [-1]) {
  const T = Ca;
  ka(n);
  const g = n.$$ = {
    fragment: null,
    ctx: [],
    // state
    props: h,
    update: Xe,
    not_equal: u,
    bound: Yu(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(r.context || (T ? T.$$.context : [])),
    // everything else
    callbacks: Yu(),
    dirty: A,
    skip_bound: !1,
    root: r.target || T.$$.root
  };
  S && S(g.root);
  let d = !1;
  if (g.ctx = i ? i(n, r.props || {}, (w, L, ...D) => {
    const C = D.length ? D[0] : L;
    return g.ctx && u(g.ctx[w], g.ctx[w] = C) && (!g.skip_bound && g.bound[w] && g.bound[w](C), d && qg(n, w)), L;
  }) : [], g.update(), d = !0, Mr(g.before_update), g.fragment = l ? l(g.ctx) : !1, r.target) {
    if (r.hydrate) {
      const w = Ug(r.target);
      g.fragment && g.fragment.l(w), w.forEach(G);
    } else
      g.fragment && g.fragment.c();
    r.intro && xe(n.$$.fragment), ba(n, r.target, r.anchor, r.customElement), Xc();
  }
  ka(T);
}
class Ea {
  $destroy() {
    Wa(this, 1), this.$destroy = Xe;
  }
  $on(r, i) {
    if (!Yc(i))
      return Xe;
    const l = this.$$.callbacks[r] || (this.$$.callbacks[r] = []);
    return l.push(i), () => {
      const u = l.indexOf(i);
      u !== -1 && l.splice(u, 1);
    };
  }
  $set(r) {
    this.$$set && !Ig(r) && (this.$$.skip_bound = !0, this.$$set(r), this.$$.skip_bound = !1);
  }
}
const po = {
  2: {
    name: "Fountain of Dreams",
    leftXBoundary: -198.75,
    rightXBoundary: 198.75,
    upperYBoundary: 202.5,
    lowerYBoundary: -146.25,
    mainPlatformHeight: 0,
    // grassy sides are raised at 0.6214
    sidePlatformHeight: 27.375,
    // moves up and down
    topPlatformHeight: 42.75,
    leftLedgeX: -63.35,
    rightLedgeX: 63.35,
    viewbox: "-250 -250 500 435",
    platforms: [
      ["-49.5, 16.125", "-21, 16.125"],
      ["21, 22.125", "49.5, 22.125"],
      ["-14.25, 42.75", "14.25, 42.75"]
    ],
    mainStage: [
      "-63.33, 0.62",
      "-53.5, 0.62",
      "-51, 0",
      "51, 0",
      "53.5, 0.62",
      "63.33, 0.62",
      "63.35, 0.62",
      "63.35, -4.5",
      "59.33, -15",
      "56.9, -19.5",
      "55, -27",
      "52, -32",
      "48, -38",
      "41, -42",
      "19, -49.5",
      "13, -54.5",
      "10, -62",
      "8.8, -72",
      "8.8, -150",
      "-8.8, -150",
      "-8.8, -72",
      "-10, -62",
      "-13, -54.5",
      "-19, -49.5",
      "-41, -42",
      "-48, -38",
      "-52, -32",
      "-55, -27",
      "-56.9, -19.5",
      "-59.33, -15",
      "-63.35, -4.5",
      "-63.35, 0.62",
      "-63.35, -4.5",
      "-63.33, 0.62"
    ],
    blastZones: [
      [-198.75, -146.25],
      [198.75, 202.5]
    ],
    getRandallPosition: void 0
  },
  3: {
    name: "Pokemon Stadium",
    // transforms, no top
    leftXBoundary: -230,
    rightXBoundary: 230,
    upperYBoundary: 180,
    lowerYBoundary: -111,
    mainPlatformHeight: 0,
    // just a good guess
    sidePlatformHeight: 25,
    leftLedgeX: -87.75,
    rightLedgeX: 87.75,
    viewbox: "-280 -220 560 360",
    mainStage: [
      "87.75, 0",
      "87.75, -4",
      "73.75, -15",
      "73.75, -17.75",
      "60, -17.75",
      "60, -38",
      "15, -60",
      "15, -112",
      "-15, -112",
      "-15, -60",
      "-60, -38",
      "-60, -17.75",
      "-73.75, -17.75",
      "-73.75, -15",
      "-87.75, -4",
      "-87.75, 0",
      "87.75, 0"
    ],
    platforms: [
      ["-55, 25", "-25, 25"],
      ["25, 25", "55, 25"]
    ],
    blastZones: [
      [-230, -111],
      [230, 180]
    ],
    getRandallPosition: void 0
  },
  8: {
    name: "Yoshi's Story",
    leftXBoundary: -175.7,
    rightXBoundary: 173.6,
    upperYBoundary: 168,
    lowerYBoundary: -91,
    mainPlatformHeight: 0,
    // has slopes
    sidePlatformHeight: 23.45,
    topPlatformHeight: 42,
    leftLedgeX: -56,
    rightLedgeX: 56,
    viewbox: "-220 -210 435 330",
    mainStage: [
      "-54, -91",
      "-54, -47",
      "-53, -46",
      "-53, -31",
      "-54, -30",
      "-54, -28",
      "-53, -27",
      "-53, -12",
      "-53, -12",
      "-54, -11",
      "-55, -8",
      "-56, -7",
      "-56, -3.5",
      "-39, 0",
      "39, 0",
      "56, -3.5",
      "56, -7",
      "55, -8",
      "54, -11",
      "53, -12",
      "53, -27",
      "54, -28",
      "54, -30",
      "53, -31",
      "53, -46",
      "54, -47",
      "54, -91",
      "-54, -91"
    ],
    platforms: [
      ["-59.5, 23.45", "-28, 23.45"],
      ["28, 23.45", "59.5, 23.45"],
      ["-15.75, 42", "15.75, 42"]
    ],
    blastZones: [
      [-175.7, -91],
      [173.6, 169]
    ],
    getRandallPosition: (n) => {
      const r = (n + 1200) % 1200, i = 11.9;
      if (r > 476 && r < 1016) {
        const A = 101.235443115234, T = -0.35484, g = r - 477, d = -13.64989, w = [A - i + T * g, d], L = [A + T * g, d];
        return [w, L];
      }
      if (r > 1022 && r < 1069) {
        const A = -15.2778692245483, T = -0.354839325, g = r - 1023, d = A + T * g;
        return [[-103.6, d], [-91.7, d]];
      }
      if (r > 1075 || r < 416) {
        const A = -101.850006103516, T = 0.35484, g = r + (r < 416 ? 125 : -1076), d = -33.2489, w = [A + T * g, d], L = [A + i + T * g, d];
        return [w, L];
      }
      if (r > 423 && r < 469) {
        const A = -31.16023254394531, T = 0.354839325, g = r - 424, d = A + T * g;
        return [[91.35, d], [103.25, d]];
      }
      const l = {
        416: [-33.184478759765625, 89.75263977050781],
        417: [-33.04470443725586, 90.07878112792969],
        418: [-32.904930114746094, 90.40492248535156],
        419: [-32.76515197753906, 90.73107147216797],
        420: [-32.49260711669922, 90.92455291748047],
        421: [-32.16635513305664, 91.06437683105469],
        422: [-31.84010314941406, 91.20419311523438],
        423: [-31.513851165771484, 91.3440170288086],
        469: [-15.1948881149292, 91.3371353149414],
        470: [-14.868742942810059, 91.1973648071289],
        471: [-14.542601585388184, 91.05758666992188],
        472: [-14.216456413269043, 90.91781616210938],
        473: [-13.967143058776855, 90.71036529541016],
        474: [-13.869664192199707, 90.36917877197266],
        475: [-13.772183418273926, 90.02799224853516],
        476: [-13.674698829650879, 89.68680572509766],
        1069: [-31.59004211425781, -103.554931640625],
        1070: [-31.907413482666016, -103.39625549316406],
        1071: [-32.22478485107422, -103.23756408691406],
        1072: [-32.54215621948242, -103.07887268066406],
        1073: [-32.7216796875, -102.77439880371094],
        1074: [-32.89775085449219, -102.46626281738281],
        1075: [-33.07382583618164, -102.15814208984375],
        1016: [-13.679760932922363, -101.919677734375],
        1017: [-13.819535255432129, -102.24581909179688],
        1018: [-13.959305763244629, -102.57196044921875],
        1019: [-14.099089622497559, -102.8981018066406],
        1020: [-14.320136070251465, -103.1476135253906],
        1021: [-14.6375150680542, -103.3063049316406],
        1022: [-14.954894065856934, -103.4649963378906]
      }[r];
      if (!l)
        return;
      const u = l[0], h = [l[1], u], S = [l[1] + i, u];
      return [h, S];
    }
  },
  28: {
    name: "Dream Land N64",
    leftXBoundary: -255,
    rightXBoundary: 255,
    upperYBoundary: 250,
    lowerYBoundary: -123,
    mainPlatformHeight: 0.01,
    sidePlatformHeight: 30.2425,
    topPlatformHeight: 51.4264,
    leftLedgeX: -77.27,
    rightLedgeX: 77.27,
    viewbox: "-310 -310 620 470",
    platforms: [
      ["-61.393, 30.142", "-31.725, 30.142"],
      ["31.704, 30.243", "63.075, 30.243"],
      ["-19.018, 51.425", "19.017, 51.425"]
    ],
    mainStage: [
      "-76.5, -11",
      "-77.25, 0",
      "77.25, 0",
      "76.5, -11",
      "76.5, -11",
      "65.75, -36",
      "-65.75, -36",
      "-76.5, -11"
    ],
    blastZones: [
      [-255, -123],
      [255, 250]
    ],
    getRandallPosition: void 0
  },
  31: {
    name: "Battlefield",
    leftXBoundary: -224,
    rightXBoundary: 224,
    upperYBoundary: 200,
    lowerYBoundary: -108.8,
    mainPlatformHeight: 0,
    sidePlatformHeight: 27.2,
    topPlatformHeight: 54.4,
    leftLedgeX: -68.4,
    rightLedgeX: 68.4,
    viewbox: "-280 -245 560 385",
    mainStage: [
      "-68.4, 0",
      " 68.4, 0",
      "65, -6",
      "36, -19",
      "39, -21",
      "33, -25",
      "30, -29",
      "29, -35",
      "10, -40",
      "10, -30",
      "-10, -30",
      "-10, -40",
      "-29, -35",
      "-30, -29",
      "-33, -25",
      "-39, -21",
      "-36, -19",
      "-65, -6",
      "-68.4, 0"
    ],
    platforms: [
      ["-57.6, 27.2", "-20, 27.2"],
      ["20, 27.2", "57.6, 27.2"],
      ["-18.8, 54.4", "18.8, 54.4"]
    ],
    blastZones: [
      [-224, -108.8],
      [224, 200]
    ],
    getRandallPosition: void 0
  },
  32: {
    name: "Final Destination",
    // no side/top
    leftXBoundary: -246,
    rightXBoundary: 246,
    upperYBoundary: 188,
    lowerYBoundary: -140,
    mainPlatformHeight: 0,
    leftLedgeX: -85.5606,
    rightLedgeX: 85.5606,
    viewbox: "-300 -230 600 405",
    platforms: [],
    mainStage: [
      "-85.6, 0",
      "85.6, 0",
      "85.6, -10",
      "65, -20",
      "65, -30",
      "60, -47",
      "50, -55",
      "45, -56",
      "-45, -56",
      "-50, -55",
      "-60, -47",
      "-65, -30",
      "-65, -20",
      "-85.6, -10",
      "-85.6, 0"
    ],
    blastZones: [
      [-246, -140],
      [246, 188]
    ],
    getRandallPosition: void 0
  }
};
var _a = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, Ii = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
Ii.exports;
(function(n, r) {
  (function() {
    var i, l = "4.17.21", u = 200, h = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", S = "Expected a function", A = "Invalid `variable` option passed into `_.template`", T = "__lodash_hash_undefined__", g = 500, d = "__lodash_placeholder__", w = 1, L = 2, D = 4, C = 1, B = 2, v = 1, I = 2, fe = 4, N = 8, M = 16, oe = 32, te = 64, V = 128, x = 256, ue = 512, R = 30, K = "...", Y = 800, _e = 16, Be = 1, Ye = 2, Se = 3, Ze = 1 / 0, ht = 9007199254740991, _t = 17976931348623157e292, sr = 0 / 0, Qe = 4294967295, zt = Qe - 1, yt = Qe >>> 1, It = [
      ["ary", V],
      ["bind", v],
      ["bindKey", I],
      ["curry", N],
      ["curryRight", M],
      ["flip", ue],
      ["partial", oe],
      ["partialRight", te],
      ["rearg", x]
    ], $e = "[object Arguments]", kt = "[object Array]", Jt = "[object AsyncFunction]", Kt = "[object Boolean]", qt = "[object Date]", Xt = "[object DOMException]", Zt = "[object Error]", Dt = "[object Function]", tr = "[object GeneratorFunction]", ft = "[object Map]", Mt = "[object Number]", Pi = "[object Null]", Pt = "[object Object]", Ia = "[object Promise]", Oi = "[object Proxy]", Q = "[object RegExp]", z = "[object Set]", re = "[object String]", me = "[object Symbol]", J = "[object Undefined]", ae = "[object WeakMap]", Le = "[object WeakSet]", de = "[object ArrayBuffer]", Ee = "[object DataView]", We = "[object Float32Array]", De = "[object Float64Array]", Pe = "[object Int8Array]", et = "[object Int16Array]", st = "[object Int32Array]", it = "[object Uint8Array]", Me = "[object Uint8ClampedArray]", pr = "[object Uint16Array]", pt = "[object Uint32Array]", oa = /\b__p \+= '';/g, Pr = /\b(__p \+=) '' \+/g, rr = /(__e\(.*?\)|\b__t\)) \+\n'';/g, Qt = /&(?:amp|lt|gt|quot|#39);/g, Fr = /[&<>"']/g, Ka = RegExp(Qt.source), Ma = RegExp(Fr.source), Pa = /<%-([\s\S]+?)%>/g, lh = /<%([\s\S]+?)%>/g, go = /<%=([\s\S]+?)%>/g, uh = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, ch = /^\w*$/, hh = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, Gi = /[\\^$.*+?()[\]{}|]/g, fh = RegExp(Gi.source), Ui = /^\s+/, sh = /\s/, ph = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, Sh = /\{\n\/\* \[wrapped with (.+)\] \*/, wh = /,? & /, dh = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, gh = /[()=,{}\[\]\/\s]/, Ah = /\\(\\)?/g, mh = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, Ao = /\w*$/, Lh = /^[-+]0x[0-9a-f]+$/i, Th = /^0b[01]+$/i, _h = /^\[object .+?Constructor\]$/, yh = /^0o[0-7]+$/i, kh = /^(?:0|[1-9]\d*)$/, Dh = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Oa = /($^)/, Fh = /['\n\r\u2028\u2029\\]/g, Ga = "\\ud800-\\udfff", Ch = "\\u0300-\\u036f", Bh = "\\ufe20-\\ufe2f", vh = "\\u20d0-\\u20ff", mo = Ch + Bh + vh, Lo = "\\u2700-\\u27bf", To = "a-z\\xdf-\\xf6\\xf8-\\xff", bh = "\\xac\\xb1\\xd7\\xf7", Wh = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", Hh = "\\u2000-\\u206f", Eh = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", _o = "A-Z\\xc0-\\xd6\\xd8-\\xde", yo = "\\ufe0e\\ufe0f", ko = bh + Wh + Hh + Eh, Ni = "['’]", Rh = "[" + Ga + "]", Do = "[" + ko + "]", Ua = "[" + mo + "]", Fo = "\\d+", Ih = "[" + Lo + "]", Co = "[" + To + "]", Bo = "[^" + Ga + ko + Fo + Lo + To + _o + "]", xi = "\\ud83c[\\udffb-\\udfff]", Kh = "(?:" + Ua + "|" + xi + ")", vo = "[^" + Ga + "]", Yi = "(?:\\ud83c[\\udde6-\\uddff]){2}", zi = "[\\ud800-\\udbff][\\udc00-\\udfff]", Or = "[" + _o + "]", bo = "\\u200d", Wo = "(?:" + Co + "|" + Bo + ")", Mh = "(?:" + Or + "|" + Bo + ")", Ho = "(?:" + Ni + "(?:d|ll|m|re|s|t|ve))?", Eo = "(?:" + Ni + "(?:D|LL|M|RE|S|T|VE))?", Ro = Kh + "?", Io = "[" + yo + "]?", Ph = "(?:" + bo + "(?:" + [vo, Yi, zi].join("|") + ")" + Io + Ro + ")*", Oh = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", Gh = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", Ko = Io + Ro + Ph, Uh = "(?:" + [Ih, Yi, zi].join("|") + ")" + Ko, Nh = "(?:" + [vo + Ua + "?", Ua, Yi, zi, Rh].join("|") + ")", xh = RegExp(Ni, "g"), Yh = RegExp(Ua, "g"), Ji = RegExp(xi + "(?=" + xi + ")|" + Nh + Ko, "g"), zh = RegExp([
      Or + "?" + Co + "+" + Ho + "(?=" + [Do, Or, "$"].join("|") + ")",
      Mh + "+" + Eo + "(?=" + [Do, Or + Wo, "$"].join("|") + ")",
      Or + "?" + Wo + "+" + Ho,
      Or + "+" + Eo,
      Gh,
      Oh,
      Fo,
      Uh
    ].join("|"), "g"), Jh = RegExp("[" + bo + Ga + mo + yo + "]"), qh = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, Xh = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ], Zh = -1, Fe = {};
    Fe[We] = Fe[De] = Fe[Pe] = Fe[et] = Fe[st] = Fe[it] = Fe[Me] = Fe[pr] = Fe[pt] = !0, Fe[$e] = Fe[kt] = Fe[de] = Fe[Kt] = Fe[Ee] = Fe[qt] = Fe[Zt] = Fe[Dt] = Fe[ft] = Fe[Mt] = Fe[Pt] = Fe[Q] = Fe[z] = Fe[re] = Fe[ae] = !1;
    var ke = {};
    ke[$e] = ke[kt] = ke[de] = ke[Ee] = ke[Kt] = ke[qt] = ke[We] = ke[De] = ke[Pe] = ke[et] = ke[st] = ke[ft] = ke[Mt] = ke[Pt] = ke[Q] = ke[z] = ke[re] = ke[me] = ke[it] = ke[Me] = ke[pr] = ke[pt] = !0, ke[Zt] = ke[Dt] = ke[ae] = !1;
    var Qh = {
      // Latin-1 Supplement block.
      À: "A",
      Á: "A",
      Â: "A",
      Ã: "A",
      Ä: "A",
      Å: "A",
      à: "a",
      á: "a",
      â: "a",
      ã: "a",
      ä: "a",
      å: "a",
      Ç: "C",
      ç: "c",
      Ð: "D",
      ð: "d",
      È: "E",
      É: "E",
      Ê: "E",
      Ë: "E",
      è: "e",
      é: "e",
      ê: "e",
      ë: "e",
      Ì: "I",
      Í: "I",
      Î: "I",
      Ï: "I",
      ì: "i",
      í: "i",
      î: "i",
      ï: "i",
      Ñ: "N",
      ñ: "n",
      Ò: "O",
      Ó: "O",
      Ô: "O",
      Õ: "O",
      Ö: "O",
      Ø: "O",
      ò: "o",
      ó: "o",
      ô: "o",
      õ: "o",
      ö: "o",
      ø: "o",
      Ù: "U",
      Ú: "U",
      Û: "U",
      Ü: "U",
      ù: "u",
      ú: "u",
      û: "u",
      ü: "u",
      Ý: "Y",
      ý: "y",
      ÿ: "y",
      Æ: "Ae",
      æ: "ae",
      Þ: "Th",
      þ: "th",
      ß: "ss",
      // Latin Extended-A block.
      Ā: "A",
      Ă: "A",
      Ą: "A",
      ā: "a",
      ă: "a",
      ą: "a",
      Ć: "C",
      Ĉ: "C",
      Ċ: "C",
      Č: "C",
      ć: "c",
      ĉ: "c",
      ċ: "c",
      č: "c",
      Ď: "D",
      Đ: "D",
      ď: "d",
      đ: "d",
      Ē: "E",
      Ĕ: "E",
      Ė: "E",
      Ę: "E",
      Ě: "E",
      ē: "e",
      ĕ: "e",
      ė: "e",
      ę: "e",
      ě: "e",
      Ĝ: "G",
      Ğ: "G",
      Ġ: "G",
      Ģ: "G",
      ĝ: "g",
      ğ: "g",
      ġ: "g",
      ģ: "g",
      Ĥ: "H",
      Ħ: "H",
      ĥ: "h",
      ħ: "h",
      Ĩ: "I",
      Ī: "I",
      Ĭ: "I",
      Į: "I",
      İ: "I",
      ĩ: "i",
      ī: "i",
      ĭ: "i",
      į: "i",
      ı: "i",
      Ĵ: "J",
      ĵ: "j",
      Ķ: "K",
      ķ: "k",
      ĸ: "k",
      Ĺ: "L",
      Ļ: "L",
      Ľ: "L",
      Ŀ: "L",
      Ł: "L",
      ĺ: "l",
      ļ: "l",
      ľ: "l",
      ŀ: "l",
      ł: "l",
      Ń: "N",
      Ņ: "N",
      Ň: "N",
      Ŋ: "N",
      ń: "n",
      ņ: "n",
      ň: "n",
      ŋ: "n",
      Ō: "O",
      Ŏ: "O",
      Ő: "O",
      ō: "o",
      ŏ: "o",
      ő: "o",
      Ŕ: "R",
      Ŗ: "R",
      Ř: "R",
      ŕ: "r",
      ŗ: "r",
      ř: "r",
      Ś: "S",
      Ŝ: "S",
      Ş: "S",
      Š: "S",
      ś: "s",
      ŝ: "s",
      ş: "s",
      š: "s",
      Ţ: "T",
      Ť: "T",
      Ŧ: "T",
      ţ: "t",
      ť: "t",
      ŧ: "t",
      Ũ: "U",
      Ū: "U",
      Ŭ: "U",
      Ů: "U",
      Ű: "U",
      Ų: "U",
      ũ: "u",
      ū: "u",
      ŭ: "u",
      ů: "u",
      ű: "u",
      ų: "u",
      Ŵ: "W",
      ŵ: "w",
      Ŷ: "Y",
      ŷ: "y",
      Ÿ: "Y",
      Ź: "Z",
      Ż: "Z",
      Ž: "Z",
      ź: "z",
      ż: "z",
      ž: "z",
      Ĳ: "IJ",
      ĳ: "ij",
      Œ: "Oe",
      œ: "oe",
      ŉ: "'n",
      ſ: "s"
    }, Vh = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }, jh = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    }, $h = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    }, ef = parseFloat, tf = parseInt, Mo = typeof _a == "object" && _a && _a.Object === Object && _a, rf = typeof self == "object" && self && self.Object === Object && self, ze = Mo || rf || Function("return this")(), qi = r && !r.nodeType && r, Cr = qi && !0 && n && !n.nodeType && n, Po = Cr && Cr.exports === qi, Xi = Po && Mo.process, Ft = function() {
      try {
        var y = Cr && Cr.require && Cr.require("util").types;
        return y || Xi && Xi.binding && Xi.binding("util");
      } catch {
      }
    }(), Oo = Ft && Ft.isArrayBuffer, Go = Ft && Ft.isDate, Uo = Ft && Ft.isMap, No = Ft && Ft.isRegExp, xo = Ft && Ft.isSet, Yo = Ft && Ft.isTypedArray;
    function St(y, b, F) {
      switch (F.length) {
        case 0:
          return y.call(b);
        case 1:
          return y.call(b, F[0]);
        case 2:
          return y.call(b, F[0], F[1]);
        case 3:
          return y.call(b, F[0], F[1], F[2]);
      }
      return y.apply(b, F);
    }
    function af(y, b, F, O) {
      for (var ie = -1, ge = y == null ? 0 : y.length; ++ie < ge; ) {
        var Oe = y[ie];
        b(O, Oe, F(Oe), y);
      }
      return O;
    }
    function Ct(y, b) {
      for (var F = -1, O = y == null ? 0 : y.length; ++F < O && b(y[F], F, y) !== !1; )
        ;
      return y;
    }
    function nf(y, b) {
      for (var F = y == null ? 0 : y.length; F-- && b(y[F], F, y) !== !1; )
        ;
      return y;
    }
    function zo(y, b) {
      for (var F = -1, O = y == null ? 0 : y.length; ++F < O; )
        if (!b(y[F], F, y))
          return !1;
      return !0;
    }
    function Sr(y, b) {
      for (var F = -1, O = y == null ? 0 : y.length, ie = 0, ge = []; ++F < O; ) {
        var Oe = y[F];
        b(Oe, F, y) && (ge[ie++] = Oe);
      }
      return ge;
    }
    function Na(y, b) {
      var F = y == null ? 0 : y.length;
      return !!F && Gr(y, b, 0) > -1;
    }
    function Zi(y, b, F) {
      for (var O = -1, ie = y == null ? 0 : y.length; ++O < ie; )
        if (F(b, y[O]))
          return !0;
      return !1;
    }
    function ve(y, b) {
      for (var F = -1, O = y == null ? 0 : y.length, ie = Array(O); ++F < O; )
        ie[F] = b(y[F], F, y);
      return ie;
    }
    function wr(y, b) {
      for (var F = -1, O = b.length, ie = y.length; ++F < O; )
        y[ie + F] = b[F];
      return y;
    }
    function Qi(y, b, F, O) {
      var ie = -1, ge = y == null ? 0 : y.length;
      for (O && ge && (F = y[++ie]); ++ie < ge; )
        F = b(F, y[ie], ie, y);
      return F;
    }
    function of(y, b, F, O) {
      var ie = y == null ? 0 : y.length;
      for (O && ie && (F = y[--ie]); ie--; )
        F = b(F, y[ie], ie, y);
      return F;
    }
    function Vi(y, b) {
      for (var F = -1, O = y == null ? 0 : y.length; ++F < O; )
        if (b(y[F], F, y))
          return !0;
      return !1;
    }
    var lf = ji("length");
    function uf(y) {
      return y.split("");
    }
    function cf(y) {
      return y.match(dh) || [];
    }
    function Jo(y, b, F) {
      var O;
      return F(y, function(ie, ge, Oe) {
        if (b(ie, ge, Oe))
          return O = ge, !1;
      }), O;
    }
    function xa(y, b, F, O) {
      for (var ie = y.length, ge = F + (O ? 1 : -1); O ? ge-- : ++ge < ie; )
        if (b(y[ge], ge, y))
          return ge;
      return -1;
    }
    function Gr(y, b, F) {
      return b === b ? Tf(y, b, F) : xa(y, qo, F);
    }
    function hf(y, b, F, O) {
      for (var ie = F - 1, ge = y.length; ++ie < ge; )
        if (O(y[ie], b))
          return ie;
      return -1;
    }
    function qo(y) {
      return y !== y;
    }
    function Xo(y, b) {
      var F = y == null ? 0 : y.length;
      return F ? en(y, b) / F : sr;
    }
    function ji(y) {
      return function(b) {
        return b == null ? i : b[y];
      };
    }
    function $i(y) {
      return function(b) {
        return y == null ? i : y[b];
      };
    }
    function Zo(y, b, F, O, ie) {
      return ie(y, function(ge, Oe, ye) {
        F = O ? (O = !1, ge) : b(F, ge, Oe, ye);
      }), F;
    }
    function ff(y, b) {
      var F = y.length;
      for (y.sort(b); F--; )
        y[F] = y[F].value;
      return y;
    }
    function en(y, b) {
      for (var F, O = -1, ie = y.length; ++O < ie; ) {
        var ge = b(y[O]);
        ge !== i && (F = F === i ? ge : F + ge);
      }
      return F;
    }
    function tn(y, b) {
      for (var F = -1, O = Array(y); ++F < y; )
        O[F] = b(F);
      return O;
    }
    function sf(y, b) {
      return ve(b, function(F) {
        return [F, y[F]];
      });
    }
    function Qo(y) {
      return y && y.slice(0, el(y) + 1).replace(Ui, "");
    }
    function wt(y) {
      return function(b) {
        return y(b);
      };
    }
    function rn(y, b) {
      return ve(b, function(F) {
        return y[F];
      });
    }
    function la(y, b) {
      return y.has(b);
    }
    function Vo(y, b) {
      for (var F = -1, O = y.length; ++F < O && Gr(b, y[F], 0) > -1; )
        ;
      return F;
    }
    function jo(y, b) {
      for (var F = y.length; F-- && Gr(b, y[F], 0) > -1; )
        ;
      return F;
    }
    function pf(y, b) {
      for (var F = y.length, O = 0; F--; )
        y[F] === b && ++O;
      return O;
    }
    var Sf = $i(Qh), wf = $i(Vh);
    function df(y) {
      return "\\" + $h[y];
    }
    function gf(y, b) {
      return y == null ? i : y[b];
    }
    function Ur(y) {
      return Jh.test(y);
    }
    function Af(y) {
      return qh.test(y);
    }
    function mf(y) {
      for (var b, F = []; !(b = y.next()).done; )
        F.push(b.value);
      return F;
    }
    function an(y) {
      var b = -1, F = Array(y.size);
      return y.forEach(function(O, ie) {
        F[++b] = [ie, O];
      }), F;
    }
    function $o(y, b) {
      return function(F) {
        return y(b(F));
      };
    }
    function dr(y, b) {
      for (var F = -1, O = y.length, ie = 0, ge = []; ++F < O; ) {
        var Oe = y[F];
        (Oe === b || Oe === d) && (y[F] = d, ge[ie++] = F);
      }
      return ge;
    }
    function Ya(y) {
      var b = -1, F = Array(y.size);
      return y.forEach(function(O) {
        F[++b] = O;
      }), F;
    }
    function Lf(y) {
      var b = -1, F = Array(y.size);
      return y.forEach(function(O) {
        F[++b] = [O, O];
      }), F;
    }
    function Tf(y, b, F) {
      for (var O = F - 1, ie = y.length; ++O < ie; )
        if (y[O] === b)
          return O;
      return -1;
    }
    function _f(y, b, F) {
      for (var O = F + 1; O--; )
        if (y[O] === b)
          return O;
      return O;
    }
    function Nr(y) {
      return Ur(y) ? kf(y) : lf(y);
    }
    function Ot(y) {
      return Ur(y) ? Df(y) : uf(y);
    }
    function el(y) {
      for (var b = y.length; b-- && sh.test(y.charAt(b)); )
        ;
      return b;
    }
    var yf = $i(jh);
    function kf(y) {
      for (var b = Ji.lastIndex = 0; Ji.test(y); )
        ++b;
      return b;
    }
    function Df(y) {
      return y.match(Ji) || [];
    }
    function Ff(y) {
      return y.match(zh) || [];
    }
    var Cf = function y(b) {
      b = b == null ? ze : xr.defaults(ze.Object(), b, xr.pick(ze, Xh));
      var F = b.Array, O = b.Date, ie = b.Error, ge = b.Function, Oe = b.Math, ye = b.Object, nn = b.RegExp, Bf = b.String, Bt = b.TypeError, za = F.prototype, vf = ge.prototype, Yr = ye.prototype, Ja = b["__core-js_shared__"], qa = vf.toString, Te = Yr.hasOwnProperty, bf = 0, tl = function() {
        var e = /[^.]+$/.exec(Ja && Ja.keys && Ja.keys.IE_PROTO || "");
        return e ? "Symbol(src)_1." + e : "";
      }(), Xa = Yr.toString, Wf = qa.call(ye), Hf = ze._, Ef = nn(
        "^" + qa.call(Te).replace(Gi, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      ), Za = Po ? b.Buffer : i, gr = b.Symbol, Qa = b.Uint8Array, rl = Za ? Za.allocUnsafe : i, Va = $o(ye.getPrototypeOf, ye), al = ye.create, il = Yr.propertyIsEnumerable, ja = za.splice, nl = gr ? gr.isConcatSpreadable : i, ua = gr ? gr.iterator : i, Br = gr ? gr.toStringTag : i, $a = function() {
        try {
          var e = Er(ye, "defineProperty");
          return e({}, "", {}), e;
        } catch {
        }
      }(), Rf = b.clearTimeout !== ze.clearTimeout && b.clearTimeout, If = O && O.now !== ze.Date.now && O.now, Kf = b.setTimeout !== ze.setTimeout && b.setTimeout, ei = Oe.ceil, ti = Oe.floor, on = ye.getOwnPropertySymbols, Mf = Za ? Za.isBuffer : i, ol = b.isFinite, Pf = za.join, Of = $o(ye.keys, ye), Ge = Oe.max, Ve = Oe.min, Gf = O.now, Uf = b.parseInt, ll = Oe.random, Nf = za.reverse, ln = Er(b, "DataView"), ca = Er(b, "Map"), un = Er(b, "Promise"), zr = Er(b, "Set"), ha = Er(b, "WeakMap"), fa = Er(ye, "create"), ri = ha && new ha(), Jr = {}, xf = Rr(ln), Yf = Rr(ca), zf = Rr(un), Jf = Rr(zr), qf = Rr(ha), ai = gr ? gr.prototype : i, sa = ai ? ai.valueOf : i, ul = ai ? ai.toString : i;
      function f(e) {
        if (He(e) && !ne(e) && !(e instanceof pe)) {
          if (e instanceof vt)
            return e;
          if (Te.call(e, "__wrapped__"))
            return cu(e);
        }
        return new vt(e);
      }
      var qr = function() {
        function e() {
        }
        return function(t) {
          if (!be(t))
            return {};
          if (al)
            return al(t);
          e.prototype = t;
          var a = new e();
          return e.prototype = i, a;
        };
      }();
      function ii() {
      }
      function vt(e, t) {
        this.__wrapped__ = e, this.__actions__ = [], this.__chain__ = !!t, this.__index__ = 0, this.__values__ = i;
      }
      f.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        escape: Pa,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        evaluate: lh,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        interpolate: go,
        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type {string}
         */
        variable: "",
        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type {Object}
         */
        imports: {
          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type {Function}
           */
          _: f
        }
      }, f.prototype = ii.prototype, f.prototype.constructor = f, vt.prototype = qr(ii.prototype), vt.prototype.constructor = vt;
      function pe(e) {
        this.__wrapped__ = e, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = Qe, this.__views__ = [];
      }
      function Xf() {
        var e = new pe(this.__wrapped__);
        return e.__actions__ = nt(this.__actions__), e.__dir__ = this.__dir__, e.__filtered__ = this.__filtered__, e.__iteratees__ = nt(this.__iteratees__), e.__takeCount__ = this.__takeCount__, e.__views__ = nt(this.__views__), e;
      }
      function Zf() {
        if (this.__filtered__) {
          var e = new pe(this);
          e.__dir__ = -1, e.__filtered__ = !0;
        } else
          e = this.clone(), e.__dir__ *= -1;
        return e;
      }
      function Qf() {
        var e = this.__wrapped__.value(), t = this.__dir__, a = ne(e), o = t < 0, c = a ? e.length : 0, s = up(0, c, this.__views__), m = s.start, _ = s.end, k = _ - m, W = o ? _ : m - 1, H = this.__iteratees__, E = H.length, P = 0, q = Ve(k, this.__takeCount__);
        if (!a || !o && c == k && q == k)
          return Hl(e, this.__actions__);
        var $ = [];
        e:
          for (; k-- && P < q; ) {
            W += t;
            for (var ce = -1, ee = e[W]; ++ce < E; ) {
              var se = H[ce], we = se.iteratee, At = se.type, at = we(ee);
              if (At == Ye)
                ee = at;
              else if (!at) {
                if (At == Be)
                  continue e;
                break e;
              }
            }
            $[P++] = ee;
          }
        return $;
      }
      pe.prototype = qr(ii.prototype), pe.prototype.constructor = pe;
      function vr(e) {
        var t = -1, a = e == null ? 0 : e.length;
        for (this.clear(); ++t < a; ) {
          var o = e[t];
          this.set(o[0], o[1]);
        }
      }
      function Vf() {
        this.__data__ = fa ? fa(null) : {}, this.size = 0;
      }
      function jf(e) {
        var t = this.has(e) && delete this.__data__[e];
        return this.size -= t ? 1 : 0, t;
      }
      function $f(e) {
        var t = this.__data__;
        if (fa) {
          var a = t[e];
          return a === T ? i : a;
        }
        return Te.call(t, e) ? t[e] : i;
      }
      function es(e) {
        var t = this.__data__;
        return fa ? t[e] !== i : Te.call(t, e);
      }
      function ts(e, t) {
        var a = this.__data__;
        return this.size += this.has(e) ? 0 : 1, a[e] = fa && t === i ? T : t, this;
      }
      vr.prototype.clear = Vf, vr.prototype.delete = jf, vr.prototype.get = $f, vr.prototype.has = es, vr.prototype.set = ts;
      function ar(e) {
        var t = -1, a = e == null ? 0 : e.length;
        for (this.clear(); ++t < a; ) {
          var o = e[t];
          this.set(o[0], o[1]);
        }
      }
      function rs() {
        this.__data__ = [], this.size = 0;
      }
      function as(e) {
        var t = this.__data__, a = ni(t, e);
        if (a < 0)
          return !1;
        var o = t.length - 1;
        return a == o ? t.pop() : ja.call(t, a, 1), --this.size, !0;
      }
      function is(e) {
        var t = this.__data__, a = ni(t, e);
        return a < 0 ? i : t[a][1];
      }
      function ns(e) {
        return ni(this.__data__, e) > -1;
      }
      function os(e, t) {
        var a = this.__data__, o = ni(a, e);
        return o < 0 ? (++this.size, a.push([e, t])) : a[o][1] = t, this;
      }
      ar.prototype.clear = rs, ar.prototype.delete = as, ar.prototype.get = is, ar.prototype.has = ns, ar.prototype.set = os;
      function ir(e) {
        var t = -1, a = e == null ? 0 : e.length;
        for (this.clear(); ++t < a; ) {
          var o = e[t];
          this.set(o[0], o[1]);
        }
      }
      function ls() {
        this.size = 0, this.__data__ = {
          hash: new vr(),
          map: new (ca || ar)(),
          string: new vr()
        };
      }
      function us(e) {
        var t = gi(this, e).delete(e);
        return this.size -= t ? 1 : 0, t;
      }
      function cs(e) {
        return gi(this, e).get(e);
      }
      function hs(e) {
        return gi(this, e).has(e);
      }
      function fs(e, t) {
        var a = gi(this, e), o = a.size;
        return a.set(e, t), this.size += a.size == o ? 0 : 1, this;
      }
      ir.prototype.clear = ls, ir.prototype.delete = us, ir.prototype.get = cs, ir.prototype.has = hs, ir.prototype.set = fs;
      function br(e) {
        var t = -1, a = e == null ? 0 : e.length;
        for (this.__data__ = new ir(); ++t < a; )
          this.add(e[t]);
      }
      function ss(e) {
        return this.__data__.set(e, T), this;
      }
      function ps(e) {
        return this.__data__.has(e);
      }
      br.prototype.add = br.prototype.push = ss, br.prototype.has = ps;
      function Gt(e) {
        var t = this.__data__ = new ar(e);
        this.size = t.size;
      }
      function Ss() {
        this.__data__ = new ar(), this.size = 0;
      }
      function ws(e) {
        var t = this.__data__, a = t.delete(e);
        return this.size = t.size, a;
      }
      function ds(e) {
        return this.__data__.get(e);
      }
      function gs(e) {
        return this.__data__.has(e);
      }
      function As(e, t) {
        var a = this.__data__;
        if (a instanceof ar) {
          var o = a.__data__;
          if (!ca || o.length < u - 1)
            return o.push([e, t]), this.size = ++a.size, this;
          a = this.__data__ = new ir(o);
        }
        return a.set(e, t), this.size = a.size, this;
      }
      Gt.prototype.clear = Ss, Gt.prototype.delete = ws, Gt.prototype.get = ds, Gt.prototype.has = gs, Gt.prototype.set = As;
      function cl(e, t) {
        var a = ne(e), o = !a && Ir(e), c = !a && !o && _r(e), s = !a && !o && !c && Vr(e), m = a || o || c || s, _ = m ? tn(e.length, Bf) : [], k = _.length;
        for (var W in e)
          (t || Te.call(e, W)) && !(m && // Safari 9 has enumerable `arguments.length` in strict mode.
          (W == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          c && (W == "offset" || W == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          s && (W == "buffer" || W == "byteLength" || W == "byteOffset") || // Skip index properties.
          ur(W, k))) && _.push(W);
        return _;
      }
      function hl(e) {
        var t = e.length;
        return t ? e[mn(0, t - 1)] : i;
      }
      function ms(e, t) {
        return Ai(nt(e), Wr(t, 0, e.length));
      }
      function Ls(e) {
        return Ai(nt(e));
      }
      function cn(e, t, a) {
        (a !== i && !Ut(e[t], a) || a === i && !(t in e)) && nr(e, t, a);
      }
      function pa(e, t, a) {
        var o = e[t];
        (!(Te.call(e, t) && Ut(o, a)) || a === i && !(t in e)) && nr(e, t, a);
      }
      function ni(e, t) {
        for (var a = e.length; a--; )
          if (Ut(e[a][0], t))
            return a;
        return -1;
      }
      function Ts(e, t, a, o) {
        return Ar(e, function(c, s, m) {
          t(o, c, a(c), m);
        }), o;
      }
      function fl(e, t) {
        return e && jt(t, Ne(t), e);
      }
      function _s(e, t) {
        return e && jt(t, lt(t), e);
      }
      function nr(e, t, a) {
        t == "__proto__" && $a ? $a(e, t, {
          configurable: !0,
          enumerable: !0,
          value: a,
          writable: !0
        }) : e[t] = a;
      }
      function hn(e, t) {
        for (var a = -1, o = t.length, c = F(o), s = e == null; ++a < o; )
          c[a] = s ? i : Yn(e, t[a]);
        return c;
      }
      function Wr(e, t, a) {
        return e === e && (a !== i && (e = e <= a ? e : a), t !== i && (e = e >= t ? e : t)), e;
      }
      function bt(e, t, a, o, c, s) {
        var m, _ = t & w, k = t & L, W = t & D;
        if (a && (m = c ? a(e, o, c, s) : a(e)), m !== i)
          return m;
        if (!be(e))
          return e;
        var H = ne(e);
        if (H) {
          if (m = hp(e), !_)
            return nt(e, m);
        } else {
          var E = je(e), P = E == Dt || E == tr;
          if (_r(e))
            return Il(e, _);
          if (E == Pt || E == $e || P && !c) {
            if (m = k || P ? {} : eu(e), !_)
              return k ? $s(e, _s(m, e)) : js(e, fl(m, e));
          } else {
            if (!ke[E])
              return c ? e : {};
            m = fp(e, E, _);
          }
        }
        s || (s = new Gt());
        var q = s.get(e);
        if (q)
          return q;
        s.set(e, m), vu(e) ? e.forEach(function(ee) {
          m.add(bt(ee, t, a, ee, e, s));
        }) : Cu(e) && e.forEach(function(ee, se) {
          m.set(se, bt(ee, t, a, se, e, s));
        });
        var $ = W ? k ? bn : vn : k ? lt : Ne, ce = H ? i : $(e);
        return Ct(ce || e, function(ee, se) {
          ce && (se = ee, ee = e[se]), pa(m, se, bt(ee, t, a, se, e, s));
        }), m;
      }
      function ys(e) {
        var t = Ne(e);
        return function(a) {
          return sl(a, e, t);
        };
      }
      function sl(e, t, a) {
        var o = a.length;
        if (e == null)
          return !o;
        for (e = ye(e); o--; ) {
          var c = a[o], s = t[c], m = e[c];
          if (m === i && !(c in e) || !s(m))
            return !1;
        }
        return !0;
      }
      function pl(e, t, a) {
        if (typeof e != "function")
          throw new Bt(S);
        return La(function() {
          e.apply(i, a);
        }, t);
      }
      function Sa(e, t, a, o) {
        var c = -1, s = Na, m = !0, _ = e.length, k = [], W = t.length;
        if (!_)
          return k;
        a && (t = ve(t, wt(a))), o ? (s = Zi, m = !1) : t.length >= u && (s = la, m = !1, t = new br(t));
        e:
          for (; ++c < _; ) {
            var H = e[c], E = a == null ? H : a(H);
            if (H = o || H !== 0 ? H : 0, m && E === E) {
              for (var P = W; P--; )
                if (t[P] === E)
                  continue e;
              k.push(H);
            } else
              s(t, E, o) || k.push(H);
          }
        return k;
      }
      var Ar = Gl(Vt), Sl = Gl(sn, !0);
      function ks(e, t) {
        var a = !0;
        return Ar(e, function(o, c, s) {
          return a = !!t(o, c, s), a;
        }), a;
      }
      function oi(e, t, a) {
        for (var o = -1, c = e.length; ++o < c; ) {
          var s = e[o], m = t(s);
          if (m != null && (_ === i ? m === m && !gt(m) : a(m, _)))
            var _ = m, k = s;
        }
        return k;
      }
      function Ds(e, t, a, o) {
        var c = e.length;
        for (a = le(a), a < 0 && (a = -a > c ? 0 : c + a), o = o === i || o > c ? c : le(o), o < 0 && (o += c), o = a > o ? 0 : Wu(o); a < o; )
          e[a++] = t;
        return e;
      }
      function wl(e, t) {
        var a = [];
        return Ar(e, function(o, c, s) {
          t(o, c, s) && a.push(o);
        }), a;
      }
      function Je(e, t, a, o, c) {
        var s = -1, m = e.length;
        for (a || (a = pp), c || (c = []); ++s < m; ) {
          var _ = e[s];
          t > 0 && a(_) ? t > 1 ? Je(_, t - 1, a, o, c) : wr(c, _) : o || (c[c.length] = _);
        }
        return c;
      }
      var fn = Ul(), dl = Ul(!0);
      function Vt(e, t) {
        return e && fn(e, t, Ne);
      }
      function sn(e, t) {
        return e && dl(e, t, Ne);
      }
      function li(e, t) {
        return Sr(t, function(a) {
          return cr(e[a]);
        });
      }
      function Hr(e, t) {
        t = Lr(t, e);
        for (var a = 0, o = t.length; e != null && a < o; )
          e = e[$t(t[a++])];
        return a && a == o ? e : i;
      }
      function gl(e, t, a) {
        var o = t(e);
        return ne(e) ? o : wr(o, a(e));
      }
      function tt(e) {
        return e == null ? e === i ? J : Pi : Br && Br in ye(e) ? lp(e) : Lp(e);
      }
      function pn(e, t) {
        return e > t;
      }
      function Fs(e, t) {
        return e != null && Te.call(e, t);
      }
      function Cs(e, t) {
        return e != null && t in ye(e);
      }
      function Bs(e, t, a) {
        return e >= Ve(t, a) && e < Ge(t, a);
      }
      function Sn(e, t, a) {
        for (var o = a ? Zi : Na, c = e[0].length, s = e.length, m = s, _ = F(s), k = 1 / 0, W = []; m--; ) {
          var H = e[m];
          m && t && (H = ve(H, wt(t))), k = Ve(H.length, k), _[m] = !a && (t || c >= 120 && H.length >= 120) ? new br(m && H) : i;
        }
        H = e[0];
        var E = -1, P = _[0];
        e:
          for (; ++E < c && W.length < k; ) {
            var q = H[E], $ = t ? t(q) : q;
            if (q = a || q !== 0 ? q : 0, !(P ? la(P, $) : o(W, $, a))) {
              for (m = s; --m; ) {
                var ce = _[m];
                if (!(ce ? la(ce, $) : o(e[m], $, a)))
                  continue e;
              }
              P && P.push($), W.push(q);
            }
          }
        return W;
      }
      function vs(e, t, a, o) {
        return Vt(e, function(c, s, m) {
          t(o, a(c), s, m);
        }), o;
      }
      function wa(e, t, a) {
        t = Lr(t, e), e = iu(e, t);
        var o = e == null ? e : e[$t(Ht(t))];
        return o == null ? i : St(o, e, a);
      }
      function Al(e) {
        return He(e) && tt(e) == $e;
      }
      function bs(e) {
        return He(e) && tt(e) == de;
      }
      function Ws(e) {
        return He(e) && tt(e) == qt;
      }
      function da(e, t, a, o, c) {
        return e === t ? !0 : e == null || t == null || !He(e) && !He(t) ? e !== e && t !== t : Hs(e, t, a, o, da, c);
      }
      function Hs(e, t, a, o, c, s) {
        var m = ne(e), _ = ne(t), k = m ? kt : je(e), W = _ ? kt : je(t);
        k = k == $e ? Pt : k, W = W == $e ? Pt : W;
        var H = k == Pt, E = W == Pt, P = k == W;
        if (P && _r(e)) {
          if (!_r(t))
            return !1;
          m = !0, H = !1;
        }
        if (P && !H)
          return s || (s = new Gt()), m || Vr(e) ? Vl(e, t, a, o, c, s) : np(e, t, k, a, o, c, s);
        if (!(a & C)) {
          var q = H && Te.call(e, "__wrapped__"), $ = E && Te.call(t, "__wrapped__");
          if (q || $) {
            var ce = q ? e.value() : e, ee = $ ? t.value() : t;
            return s || (s = new Gt()), c(ce, ee, a, o, s);
          }
        }
        return P ? (s || (s = new Gt()), op(e, t, a, o, c, s)) : !1;
      }
      function Es(e) {
        return He(e) && je(e) == ft;
      }
      function wn(e, t, a, o) {
        var c = a.length, s = c, m = !o;
        if (e == null)
          return !s;
        for (e = ye(e); c--; ) {
          var _ = a[c];
          if (m && _[2] ? _[1] !== e[_[0]] : !(_[0] in e))
            return !1;
        }
        for (; ++c < s; ) {
          _ = a[c];
          var k = _[0], W = e[k], H = _[1];
          if (m && _[2]) {
            if (W === i && !(k in e))
              return !1;
          } else {
            var E = new Gt();
            if (o)
              var P = o(W, H, k, e, t, E);
            if (!(P === i ? da(H, W, C | B, o, E) : P))
              return !1;
          }
        }
        return !0;
      }
      function ml(e) {
        if (!be(e) || wp(e))
          return !1;
        var t = cr(e) ? Ef : _h;
        return t.test(Rr(e));
      }
      function Rs(e) {
        return He(e) && tt(e) == Q;
      }
      function Is(e) {
        return He(e) && je(e) == z;
      }
      function Ks(e) {
        return He(e) && ki(e.length) && !!Fe[tt(e)];
      }
      function Ll(e) {
        return typeof e == "function" ? e : e == null ? ut : typeof e == "object" ? ne(e) ? yl(e[0], e[1]) : _l(e) : Nu(e);
      }
      function dn(e) {
        if (!ma(e))
          return Of(e);
        var t = [];
        for (var a in ye(e))
          Te.call(e, a) && a != "constructor" && t.push(a);
        return t;
      }
      function Ms(e) {
        if (!be(e))
          return mp(e);
        var t = ma(e), a = [];
        for (var o in e)
          o == "constructor" && (t || !Te.call(e, o)) || a.push(o);
        return a;
      }
      function gn(e, t) {
        return e < t;
      }
      function Tl(e, t) {
        var a = -1, o = ot(e) ? F(e.length) : [];
        return Ar(e, function(c, s, m) {
          o[++a] = t(c, s, m);
        }), o;
      }
      function _l(e) {
        var t = Hn(e);
        return t.length == 1 && t[0][2] ? ru(t[0][0], t[0][1]) : function(a) {
          return a === e || wn(a, e, t);
        };
      }
      function yl(e, t) {
        return Rn(e) && tu(t) ? ru($t(e), t) : function(a) {
          var o = Yn(a, e);
          return o === i && o === t ? zn(a, e) : da(t, o, C | B);
        };
      }
      function ui(e, t, a, o, c) {
        e !== t && fn(t, function(s, m) {
          if (c || (c = new Gt()), be(s))
            Ps(e, t, m, a, ui, o, c);
          else {
            var _ = o ? o(Kn(e, m), s, m + "", e, t, c) : i;
            _ === i && (_ = s), cn(e, m, _);
          }
        }, lt);
      }
      function Ps(e, t, a, o, c, s, m) {
        var _ = Kn(e, a), k = Kn(t, a), W = m.get(k);
        if (W) {
          cn(e, a, W);
          return;
        }
        var H = s ? s(_, k, a + "", e, t, m) : i, E = H === i;
        if (E) {
          var P = ne(k), q = !P && _r(k), $ = !P && !q && Vr(k);
          H = k, P || q || $ ? ne(_) ? H = _ : Re(_) ? H = nt(_) : q ? (E = !1, H = Il(k, !0)) : $ ? (E = !1, H = Kl(k, !0)) : H = [] : Ta(k) || Ir(k) ? (H = _, Ir(_) ? H = Hu(_) : (!be(_) || cr(_)) && (H = eu(k))) : E = !1;
        }
        E && (m.set(k, H), c(H, k, o, s, m), m.delete(k)), cn(e, a, H);
      }
      function kl(e, t) {
        var a = e.length;
        if (a)
          return t += t < 0 ? a : 0, ur(t, a) ? e[t] : i;
      }
      function Dl(e, t, a) {
        t.length ? t = ve(t, function(s) {
          return ne(s) ? function(m) {
            return Hr(m, s.length === 1 ? s[0] : s);
          } : s;
        }) : t = [ut];
        var o = -1;
        t = ve(t, wt(j()));
        var c = Tl(e, function(s, m, _) {
          var k = ve(t, function(W) {
            return W(s);
          });
          return { criteria: k, index: ++o, value: s };
        });
        return ff(c, function(s, m) {
          return Vs(s, m, a);
        });
      }
      function Os(e, t) {
        return Fl(e, t, function(a, o) {
          return zn(e, o);
        });
      }
      function Fl(e, t, a) {
        for (var o = -1, c = t.length, s = {}; ++o < c; ) {
          var m = t[o], _ = Hr(e, m);
          a(_, m) && ga(s, Lr(m, e), _);
        }
        return s;
      }
      function Gs(e) {
        return function(t) {
          return Hr(t, e);
        };
      }
      function An(e, t, a, o) {
        var c = o ? hf : Gr, s = -1, m = t.length, _ = e;
        for (e === t && (t = nt(t)), a && (_ = ve(e, wt(a))); ++s < m; )
          for (var k = 0, W = t[s], H = a ? a(W) : W; (k = c(_, H, k, o)) > -1; )
            _ !== e && ja.call(_, k, 1), ja.call(e, k, 1);
        return e;
      }
      function Cl(e, t) {
        for (var a = e ? t.length : 0, o = a - 1; a--; ) {
          var c = t[a];
          if (a == o || c !== s) {
            var s = c;
            ur(c) ? ja.call(e, c, 1) : _n(e, c);
          }
        }
        return e;
      }
      function mn(e, t) {
        return e + ti(ll() * (t - e + 1));
      }
      function Us(e, t, a, o) {
        for (var c = -1, s = Ge(ei((t - e) / (a || 1)), 0), m = F(s); s--; )
          m[o ? s : ++c] = e, e += a;
        return m;
      }
      function Ln(e, t) {
        var a = "";
        if (!e || t < 1 || t > ht)
          return a;
        do
          t % 2 && (a += e), t = ti(t / 2), t && (e += e);
        while (t);
        return a;
      }
      function he(e, t) {
        return Mn(au(e, t, ut), e + "");
      }
      function Ns(e) {
        return hl(jr(e));
      }
      function xs(e, t) {
        var a = jr(e);
        return Ai(a, Wr(t, 0, a.length));
      }
      function ga(e, t, a, o) {
        if (!be(e))
          return e;
        t = Lr(t, e);
        for (var c = -1, s = t.length, m = s - 1, _ = e; _ != null && ++c < s; ) {
          var k = $t(t[c]), W = a;
          if (k === "__proto__" || k === "constructor" || k === "prototype")
            return e;
          if (c != m) {
            var H = _[k];
            W = o ? o(H, k, _) : i, W === i && (W = be(H) ? H : ur(t[c + 1]) ? [] : {});
          }
          pa(_, k, W), _ = _[k];
        }
        return e;
      }
      var Bl = ri ? function(e, t) {
        return ri.set(e, t), e;
      } : ut, Ys = $a ? function(e, t) {
        return $a(e, "toString", {
          configurable: !0,
          enumerable: !1,
          value: qn(t),
          writable: !0
        });
      } : ut;
      function zs(e) {
        return Ai(jr(e));
      }
      function Wt(e, t, a) {
        var o = -1, c = e.length;
        t < 0 && (t = -t > c ? 0 : c + t), a = a > c ? c : a, a < 0 && (a += c), c = t > a ? 0 : a - t >>> 0, t >>>= 0;
        for (var s = F(c); ++o < c; )
          s[o] = e[o + t];
        return s;
      }
      function Js(e, t) {
        var a;
        return Ar(e, function(o, c, s) {
          return a = t(o, c, s), !a;
        }), !!a;
      }
      function ci(e, t, a) {
        var o = 0, c = e == null ? o : e.length;
        if (typeof t == "number" && t === t && c <= yt) {
          for (; o < c; ) {
            var s = o + c >>> 1, m = e[s];
            m !== null && !gt(m) && (a ? m <= t : m < t) ? o = s + 1 : c = s;
          }
          return c;
        }
        return Tn(e, t, ut, a);
      }
      function Tn(e, t, a, o) {
        var c = 0, s = e == null ? 0 : e.length;
        if (s === 0)
          return 0;
        t = a(t);
        for (var m = t !== t, _ = t === null, k = gt(t), W = t === i; c < s; ) {
          var H = ti((c + s) / 2), E = a(e[H]), P = E !== i, q = E === null, $ = E === E, ce = gt(E);
          if (m)
            var ee = o || $;
          else
            W ? ee = $ && (o || P) : _ ? ee = $ && P && (o || !q) : k ? ee = $ && P && !q && (o || !ce) : q || ce ? ee = !1 : ee = o ? E <= t : E < t;
          ee ? c = H + 1 : s = H;
        }
        return Ve(s, zt);
      }
      function vl(e, t) {
        for (var a = -1, o = e.length, c = 0, s = []; ++a < o; ) {
          var m = e[a], _ = t ? t(m) : m;
          if (!a || !Ut(_, k)) {
            var k = _;
            s[c++] = m === 0 ? 0 : m;
          }
        }
        return s;
      }
      function bl(e) {
        return typeof e == "number" ? e : gt(e) ? sr : +e;
      }
      function dt(e) {
        if (typeof e == "string")
          return e;
        if (ne(e))
          return ve(e, dt) + "";
        if (gt(e))
          return ul ? ul.call(e) : "";
        var t = e + "";
        return t == "0" && 1 / e == -Ze ? "-0" : t;
      }
      function mr(e, t, a) {
        var o = -1, c = Na, s = e.length, m = !0, _ = [], k = _;
        if (a)
          m = !1, c = Zi;
        else if (s >= u) {
          var W = t ? null : ap(e);
          if (W)
            return Ya(W);
          m = !1, c = la, k = new br();
        } else
          k = t ? [] : _;
        e:
          for (; ++o < s; ) {
            var H = e[o], E = t ? t(H) : H;
            if (H = a || H !== 0 ? H : 0, m && E === E) {
              for (var P = k.length; P--; )
                if (k[P] === E)
                  continue e;
              t && k.push(E), _.push(H);
            } else
              c(k, E, a) || (k !== _ && k.push(E), _.push(H));
          }
        return _;
      }
      function _n(e, t) {
        return t = Lr(t, e), e = iu(e, t), e == null || delete e[$t(Ht(t))];
      }
      function Wl(e, t, a, o) {
        return ga(e, t, a(Hr(e, t)), o);
      }
      function hi(e, t, a, o) {
        for (var c = e.length, s = o ? c : -1; (o ? s-- : ++s < c) && t(e[s], s, e); )
          ;
        return a ? Wt(e, o ? 0 : s, o ? s + 1 : c) : Wt(e, o ? s + 1 : 0, o ? c : s);
      }
      function Hl(e, t) {
        var a = e;
        return a instanceof pe && (a = a.value()), Qi(t, function(o, c) {
          return c.func.apply(c.thisArg, wr([o], c.args));
        }, a);
      }
      function yn(e, t, a) {
        var o = e.length;
        if (o < 2)
          return o ? mr(e[0]) : [];
        for (var c = -1, s = F(o); ++c < o; )
          for (var m = e[c], _ = -1; ++_ < o; )
            _ != c && (s[c] = Sa(s[c] || m, e[_], t, a));
        return mr(Je(s, 1), t, a);
      }
      function El(e, t, a) {
        for (var o = -1, c = e.length, s = t.length, m = {}; ++o < c; ) {
          var _ = o < s ? t[o] : i;
          a(m, e[o], _);
        }
        return m;
      }
      function kn(e) {
        return Re(e) ? e : [];
      }
      function Dn(e) {
        return typeof e == "function" ? e : ut;
      }
      function Lr(e, t) {
        return ne(e) ? e : Rn(e, t) ? [e] : uu(Ae(e));
      }
      var qs = he;
      function Tr(e, t, a) {
        var o = e.length;
        return a = a === i ? o : a, !t && a >= o ? e : Wt(e, t, a);
      }
      var Rl = Rf || function(e) {
        return ze.clearTimeout(e);
      };
      function Il(e, t) {
        if (t)
          return e.slice();
        var a = e.length, o = rl ? rl(a) : new e.constructor(a);
        return e.copy(o), o;
      }
      function Fn(e) {
        var t = new e.constructor(e.byteLength);
        return new Qa(t).set(new Qa(e)), t;
      }
      function Xs(e, t) {
        var a = t ? Fn(e.buffer) : e.buffer;
        return new e.constructor(a, e.byteOffset, e.byteLength);
      }
      function Zs(e) {
        var t = new e.constructor(e.source, Ao.exec(e));
        return t.lastIndex = e.lastIndex, t;
      }
      function Qs(e) {
        return sa ? ye(sa.call(e)) : {};
      }
      function Kl(e, t) {
        var a = t ? Fn(e.buffer) : e.buffer;
        return new e.constructor(a, e.byteOffset, e.length);
      }
      function Ml(e, t) {
        if (e !== t) {
          var a = e !== i, o = e === null, c = e === e, s = gt(e), m = t !== i, _ = t === null, k = t === t, W = gt(t);
          if (!_ && !W && !s && e > t || s && m && k && !_ && !W || o && m && k || !a && k || !c)
            return 1;
          if (!o && !s && !W && e < t || W && a && c && !o && !s || _ && a && c || !m && c || !k)
            return -1;
        }
        return 0;
      }
      function Vs(e, t, a) {
        for (var o = -1, c = e.criteria, s = t.criteria, m = c.length, _ = a.length; ++o < m; ) {
          var k = Ml(c[o], s[o]);
          if (k) {
            if (o >= _)
              return k;
            var W = a[o];
            return k * (W == "desc" ? -1 : 1);
          }
        }
        return e.index - t.index;
      }
      function Pl(e, t, a, o) {
        for (var c = -1, s = e.length, m = a.length, _ = -1, k = t.length, W = Ge(s - m, 0), H = F(k + W), E = !o; ++_ < k; )
          H[_] = t[_];
        for (; ++c < m; )
          (E || c < s) && (H[a[c]] = e[c]);
        for (; W--; )
          H[_++] = e[c++];
        return H;
      }
      function Ol(e, t, a, o) {
        for (var c = -1, s = e.length, m = -1, _ = a.length, k = -1, W = t.length, H = Ge(s - _, 0), E = F(H + W), P = !o; ++c < H; )
          E[c] = e[c];
        for (var q = c; ++k < W; )
          E[q + k] = t[k];
        for (; ++m < _; )
          (P || c < s) && (E[q + a[m]] = e[c++]);
        return E;
      }
      function nt(e, t) {
        var a = -1, o = e.length;
        for (t || (t = F(o)); ++a < o; )
          t[a] = e[a];
        return t;
      }
      function jt(e, t, a, o) {
        var c = !a;
        a || (a = {});
        for (var s = -1, m = t.length; ++s < m; ) {
          var _ = t[s], k = o ? o(a[_], e[_], _, a, e) : i;
          k === i && (k = e[_]), c ? nr(a, _, k) : pa(a, _, k);
        }
        return a;
      }
      function js(e, t) {
        return jt(e, En(e), t);
      }
      function $s(e, t) {
        return jt(e, jl(e), t);
      }
      function fi(e, t) {
        return function(a, o) {
          var c = ne(a) ? af : Ts, s = t ? t() : {};
          return c(a, e, j(o, 2), s);
        };
      }
      function Xr(e) {
        return he(function(t, a) {
          var o = -1, c = a.length, s = c > 1 ? a[c - 1] : i, m = c > 2 ? a[2] : i;
          for (s = e.length > 3 && typeof s == "function" ? (c--, s) : i, m && rt(a[0], a[1], m) && (s = c < 3 ? i : s, c = 1), t = ye(t); ++o < c; ) {
            var _ = a[o];
            _ && e(t, _, o, s);
          }
          return t;
        });
      }
      function Gl(e, t) {
        return function(a, o) {
          if (a == null)
            return a;
          if (!ot(a))
            return e(a, o);
          for (var c = a.length, s = t ? c : -1, m = ye(a); (t ? s-- : ++s < c) && o(m[s], s, m) !== !1; )
            ;
          return a;
        };
      }
      function Ul(e) {
        return function(t, a, o) {
          for (var c = -1, s = ye(t), m = o(t), _ = m.length; _--; ) {
            var k = m[e ? _ : ++c];
            if (a(s[k], k, s) === !1)
              break;
          }
          return t;
        };
      }
      function ep(e, t, a) {
        var o = t & v, c = Aa(e);
        function s() {
          var m = this && this !== ze && this instanceof s ? c : e;
          return m.apply(o ? a : this, arguments);
        }
        return s;
      }
      function Nl(e) {
        return function(t) {
          t = Ae(t);
          var a = Ur(t) ? Ot(t) : i, o = a ? a[0] : t.charAt(0), c = a ? Tr(a, 1).join("") : t.slice(1);
          return o[e]() + c;
        };
      }
      function Zr(e) {
        return function(t) {
          return Qi(Gu(Ou(t).replace(xh, "")), e, "");
        };
      }
      function Aa(e) {
        return function() {
          var t = arguments;
          switch (t.length) {
            case 0:
              return new e();
            case 1:
              return new e(t[0]);
            case 2:
              return new e(t[0], t[1]);
            case 3:
              return new e(t[0], t[1], t[2]);
            case 4:
              return new e(t[0], t[1], t[2], t[3]);
            case 5:
              return new e(t[0], t[1], t[2], t[3], t[4]);
            case 6:
              return new e(t[0], t[1], t[2], t[3], t[4], t[5]);
            case 7:
              return new e(t[0], t[1], t[2], t[3], t[4], t[5], t[6]);
          }
          var a = qr(e.prototype), o = e.apply(a, t);
          return be(o) ? o : a;
        };
      }
      function tp(e, t, a) {
        var o = Aa(e);
        function c() {
          for (var s = arguments.length, m = F(s), _ = s, k = Qr(c); _--; )
            m[_] = arguments[_];
          var W = s < 3 && m[0] !== k && m[s - 1] !== k ? [] : dr(m, k);
          if (s -= W.length, s < a)
            return ql(
              e,
              t,
              si,
              c.placeholder,
              i,
              m,
              W,
              i,
              i,
              a - s
            );
          var H = this && this !== ze && this instanceof c ? o : e;
          return St(H, this, m);
        }
        return c;
      }
      function xl(e) {
        return function(t, a, o) {
          var c = ye(t);
          if (!ot(t)) {
            var s = j(a, 3);
            t = Ne(t), a = function(_) {
              return s(c[_], _, c);
            };
          }
          var m = e(t, a, o);
          return m > -1 ? c[s ? t[m] : m] : i;
        };
      }
      function Yl(e) {
        return lr(function(t) {
          var a = t.length, o = a, c = vt.prototype.thru;
          for (e && t.reverse(); o--; ) {
            var s = t[o];
            if (typeof s != "function")
              throw new Bt(S);
            if (c && !m && di(s) == "wrapper")
              var m = new vt([], !0);
          }
          for (o = m ? o : a; ++o < a; ) {
            s = t[o];
            var _ = di(s), k = _ == "wrapper" ? Wn(s) : i;
            k && In(k[0]) && k[1] == (V | N | oe | x) && !k[4].length && k[9] == 1 ? m = m[di(k[0])].apply(m, k[3]) : m = s.length == 1 && In(s) ? m[_]() : m.thru(s);
          }
          return function() {
            var W = arguments, H = W[0];
            if (m && W.length == 1 && ne(H))
              return m.plant(H).value();
            for (var E = 0, P = a ? t[E].apply(this, W) : H; ++E < a; )
              P = t[E].call(this, P);
            return P;
          };
        });
      }
      function si(e, t, a, o, c, s, m, _, k, W) {
        var H = t & V, E = t & v, P = t & I, q = t & (N | M), $ = t & ue, ce = P ? i : Aa(e);
        function ee() {
          for (var se = arguments.length, we = F(se), At = se; At--; )
            we[At] = arguments[At];
          if (q)
            var at = Qr(ee), mt = pf(we, at);
          if (o && (we = Pl(we, o, c, q)), s && (we = Ol(we, s, m, q)), se -= mt, q && se < W) {
            var Ie = dr(we, at);
            return ql(
              e,
              t,
              si,
              ee.placeholder,
              a,
              we,
              Ie,
              _,
              k,
              W - se
            );
          }
          var Nt = E ? a : this, fr = P ? Nt[e] : e;
          return se = we.length, _ ? we = Tp(we, _) : $ && se > 1 && we.reverse(), H && k < se && (we.length = k), this && this !== ze && this instanceof ee && (fr = ce || Aa(fr)), fr.apply(Nt, we);
        }
        return ee;
      }
      function zl(e, t) {
        return function(a, o) {
          return vs(a, e, t(o), {});
        };
      }
      function pi(e, t) {
        return function(a, o) {
          var c;
          if (a === i && o === i)
            return t;
          if (a !== i && (c = a), o !== i) {
            if (c === i)
              return o;
            typeof a == "string" || typeof o == "string" ? (a = dt(a), o = dt(o)) : (a = bl(a), o = bl(o)), c = e(a, o);
          }
          return c;
        };
      }
      function Cn(e) {
        return lr(function(t) {
          return t = ve(t, wt(j())), he(function(a) {
            var o = this;
            return e(t, function(c) {
              return St(c, o, a);
            });
          });
        });
      }
      function Si(e, t) {
        t = t === i ? " " : dt(t);
        var a = t.length;
        if (a < 2)
          return a ? Ln(t, e) : t;
        var o = Ln(t, ei(e / Nr(t)));
        return Ur(t) ? Tr(Ot(o), 0, e).join("") : o.slice(0, e);
      }
      function rp(e, t, a, o) {
        var c = t & v, s = Aa(e);
        function m() {
          for (var _ = -1, k = arguments.length, W = -1, H = o.length, E = F(H + k), P = this && this !== ze && this instanceof m ? s : e; ++W < H; )
            E[W] = o[W];
          for (; k--; )
            E[W++] = arguments[++_];
          return St(P, c ? a : this, E);
        }
        return m;
      }
      function Jl(e) {
        return function(t, a, o) {
          return o && typeof o != "number" && rt(t, a, o) && (a = o = i), t = hr(t), a === i ? (a = t, t = 0) : a = hr(a), o = o === i ? t < a ? 1 : -1 : hr(o), Us(t, a, o, e);
        };
      }
      function wi(e) {
        return function(t, a) {
          return typeof t == "string" && typeof a == "string" || (t = Et(t), a = Et(a)), e(t, a);
        };
      }
      function ql(e, t, a, o, c, s, m, _, k, W) {
        var H = t & N, E = H ? m : i, P = H ? i : m, q = H ? s : i, $ = H ? i : s;
        t |= H ? oe : te, t &= ~(H ? te : oe), t & fe || (t &= ~(v | I));
        var ce = [
          e,
          t,
          c,
          q,
          E,
          $,
          P,
          _,
          k,
          W
        ], ee = a.apply(i, ce);
        return In(e) && nu(ee, ce), ee.placeholder = o, ou(ee, e, t);
      }
      function Bn(e) {
        var t = Oe[e];
        return function(a, o) {
          if (a = Et(a), o = o == null ? 0 : Ve(le(o), 292), o && ol(a)) {
            var c = (Ae(a) + "e").split("e"), s = t(c[0] + "e" + (+c[1] + o));
            return c = (Ae(s) + "e").split("e"), +(c[0] + "e" + (+c[1] - o));
          }
          return t(a);
        };
      }
      var ap = zr && 1 / Ya(new zr([, -0]))[1] == Ze ? function(e) {
        return new zr(e);
      } : Qn;
      function Xl(e) {
        return function(t) {
          var a = je(t);
          return a == ft ? an(t) : a == z ? Lf(t) : sf(t, e(t));
        };
      }
      function or(e, t, a, o, c, s, m, _) {
        var k = t & I;
        if (!k && typeof e != "function")
          throw new Bt(S);
        var W = o ? o.length : 0;
        if (W || (t &= ~(oe | te), o = c = i), m = m === i ? m : Ge(le(m), 0), _ = _ === i ? _ : le(_), W -= c ? c.length : 0, t & te) {
          var H = o, E = c;
          o = c = i;
        }
        var P = k ? i : Wn(e), q = [
          e,
          t,
          a,
          o,
          c,
          H,
          E,
          s,
          m,
          _
        ];
        if (P && Ap(q, P), e = q[0], t = q[1], a = q[2], o = q[3], c = q[4], _ = q[9] = q[9] === i ? k ? 0 : e.length : Ge(q[9] - W, 0), !_ && t & (N | M) && (t &= ~(N | M)), !t || t == v)
          var $ = ep(e, t, a);
        else
          t == N || t == M ? $ = tp(e, t, _) : (t == oe || t == (v | oe)) && !c.length ? $ = rp(e, t, a, o) : $ = si.apply(i, q);
        var ce = P ? Bl : nu;
        return ou(ce($, q), e, t);
      }
      function Zl(e, t, a, o) {
        return e === i || Ut(e, Yr[a]) && !Te.call(o, a) ? t : e;
      }
      function Ql(e, t, a, o, c, s) {
        return be(e) && be(t) && (s.set(t, e), ui(e, t, i, Ql, s), s.delete(t)), e;
      }
      function ip(e) {
        return Ta(e) ? i : e;
      }
      function Vl(e, t, a, o, c, s) {
        var m = a & C, _ = e.length, k = t.length;
        if (_ != k && !(m && k > _))
          return !1;
        var W = s.get(e), H = s.get(t);
        if (W && H)
          return W == t && H == e;
        var E = -1, P = !0, q = a & B ? new br() : i;
        for (s.set(e, t), s.set(t, e); ++E < _; ) {
          var $ = e[E], ce = t[E];
          if (o)
            var ee = m ? o(ce, $, E, t, e, s) : o($, ce, E, e, t, s);
          if (ee !== i) {
            if (ee)
              continue;
            P = !1;
            break;
          }
          if (q) {
            if (!Vi(t, function(se, we) {
              if (!la(q, we) && ($ === se || c($, se, a, o, s)))
                return q.push(we);
            })) {
              P = !1;
              break;
            }
          } else if (!($ === ce || c($, ce, a, o, s))) {
            P = !1;
            break;
          }
        }
        return s.delete(e), s.delete(t), P;
      }
      function np(e, t, a, o, c, s, m) {
        switch (a) {
          case Ee:
            if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
              return !1;
            e = e.buffer, t = t.buffer;
          case de:
            return !(e.byteLength != t.byteLength || !s(new Qa(e), new Qa(t)));
          case Kt:
          case qt:
          case Mt:
            return Ut(+e, +t);
          case Zt:
            return e.name == t.name && e.message == t.message;
          case Q:
          case re:
            return e == t + "";
          case ft:
            var _ = an;
          case z:
            var k = o & C;
            if (_ || (_ = Ya), e.size != t.size && !k)
              return !1;
            var W = m.get(e);
            if (W)
              return W == t;
            o |= B, m.set(e, t);
            var H = Vl(_(e), _(t), o, c, s, m);
            return m.delete(e), H;
          case me:
            if (sa)
              return sa.call(e) == sa.call(t);
        }
        return !1;
      }
      function op(e, t, a, o, c, s) {
        var m = a & C, _ = vn(e), k = _.length, W = vn(t), H = W.length;
        if (k != H && !m)
          return !1;
        for (var E = k; E--; ) {
          var P = _[E];
          if (!(m ? P in t : Te.call(t, P)))
            return !1;
        }
        var q = s.get(e), $ = s.get(t);
        if (q && $)
          return q == t && $ == e;
        var ce = !0;
        s.set(e, t), s.set(t, e);
        for (var ee = m; ++E < k; ) {
          P = _[E];
          var se = e[P], we = t[P];
          if (o)
            var At = m ? o(we, se, P, t, e, s) : o(se, we, P, e, t, s);
          if (!(At === i ? se === we || c(se, we, a, o, s) : At)) {
            ce = !1;
            break;
          }
          ee || (ee = P == "constructor");
        }
        if (ce && !ee) {
          var at = e.constructor, mt = t.constructor;
          at != mt && "constructor" in e && "constructor" in t && !(typeof at == "function" && at instanceof at && typeof mt == "function" && mt instanceof mt) && (ce = !1);
        }
        return s.delete(e), s.delete(t), ce;
      }
      function lr(e) {
        return Mn(au(e, i, su), e + "");
      }
      function vn(e) {
        return gl(e, Ne, En);
      }
      function bn(e) {
        return gl(e, lt, jl);
      }
      var Wn = ri ? function(e) {
        return ri.get(e);
      } : Qn;
      function di(e) {
        for (var t = e.name + "", a = Jr[t], o = Te.call(Jr, t) ? a.length : 0; o--; ) {
          var c = a[o], s = c.func;
          if (s == null || s == e)
            return c.name;
        }
        return t;
      }
      function Qr(e) {
        var t = Te.call(f, "placeholder") ? f : e;
        return t.placeholder;
      }
      function j() {
        var e = f.iteratee || Xn;
        return e = e === Xn ? Ll : e, arguments.length ? e(arguments[0], arguments[1]) : e;
      }
      function gi(e, t) {
        var a = e.__data__;
        return Sp(t) ? a[typeof t == "string" ? "string" : "hash"] : a.map;
      }
      function Hn(e) {
        for (var t = Ne(e), a = t.length; a--; ) {
          var o = t[a], c = e[o];
          t[a] = [o, c, tu(c)];
        }
        return t;
      }
      function Er(e, t) {
        var a = gf(e, t);
        return ml(a) ? a : i;
      }
      function lp(e) {
        var t = Te.call(e, Br), a = e[Br];
        try {
          e[Br] = i;
          var o = !0;
        } catch {
        }
        var c = Xa.call(e);
        return o && (t ? e[Br] = a : delete e[Br]), c;
      }
      var En = on ? function(e) {
        return e == null ? [] : (e = ye(e), Sr(on(e), function(t) {
          return il.call(e, t);
        }));
      } : Vn, jl = on ? function(e) {
        for (var t = []; e; )
          wr(t, En(e)), e = Va(e);
        return t;
      } : Vn, je = tt;
      (ln && je(new ln(new ArrayBuffer(1))) != Ee || ca && je(new ca()) != ft || un && je(un.resolve()) != Ia || zr && je(new zr()) != z || ha && je(new ha()) != ae) && (je = function(e) {
        var t = tt(e), a = t == Pt ? e.constructor : i, o = a ? Rr(a) : "";
        if (o)
          switch (o) {
            case xf:
              return Ee;
            case Yf:
              return ft;
            case zf:
              return Ia;
            case Jf:
              return z;
            case qf:
              return ae;
          }
        return t;
      });
      function up(e, t, a) {
        for (var o = -1, c = a.length; ++o < c; ) {
          var s = a[o], m = s.size;
          switch (s.type) {
            case "drop":
              e += m;
              break;
            case "dropRight":
              t -= m;
              break;
            case "take":
              t = Ve(t, e + m);
              break;
            case "takeRight":
              e = Ge(e, t - m);
              break;
          }
        }
        return { start: e, end: t };
      }
      function cp(e) {
        var t = e.match(Sh);
        return t ? t[1].split(wh) : [];
      }
      function $l(e, t, a) {
        t = Lr(t, e);
        for (var o = -1, c = t.length, s = !1; ++o < c; ) {
          var m = $t(t[o]);
          if (!(s = e != null && a(e, m)))
            break;
          e = e[m];
        }
        return s || ++o != c ? s : (c = e == null ? 0 : e.length, !!c && ki(c) && ur(m, c) && (ne(e) || Ir(e)));
      }
      function hp(e) {
        var t = e.length, a = new e.constructor(t);
        return t && typeof e[0] == "string" && Te.call(e, "index") && (a.index = e.index, a.input = e.input), a;
      }
      function eu(e) {
        return typeof e.constructor == "function" && !ma(e) ? qr(Va(e)) : {};
      }
      function fp(e, t, a) {
        var o = e.constructor;
        switch (t) {
          case de:
            return Fn(e);
          case Kt:
          case qt:
            return new o(+e);
          case Ee:
            return Xs(e, a);
          case We:
          case De:
          case Pe:
          case et:
          case st:
          case it:
          case Me:
          case pr:
          case pt:
            return Kl(e, a);
          case ft:
            return new o();
          case Mt:
          case re:
            return new o(e);
          case Q:
            return Zs(e);
          case z:
            return new o();
          case me:
            return Qs(e);
        }
      }
      function sp(e, t) {
        var a = t.length;
        if (!a)
          return e;
        var o = a - 1;
        return t[o] = (a > 1 ? "& " : "") + t[o], t = t.join(a > 2 ? ", " : " "), e.replace(ph, `{
/* [wrapped with ` + t + `] */
`);
      }
      function pp(e) {
        return ne(e) || Ir(e) || !!(nl && e && e[nl]);
      }
      function ur(e, t) {
        var a = typeof e;
        return t = t ?? ht, !!t && (a == "number" || a != "symbol" && kh.test(e)) && e > -1 && e % 1 == 0 && e < t;
      }
      function rt(e, t, a) {
        if (!be(a))
          return !1;
        var o = typeof t;
        return (o == "number" ? ot(a) && ur(t, a.length) : o == "string" && t in a) ? Ut(a[t], e) : !1;
      }
      function Rn(e, t) {
        if (ne(e))
          return !1;
        var a = typeof e;
        return a == "number" || a == "symbol" || a == "boolean" || e == null || gt(e) ? !0 : ch.test(e) || !uh.test(e) || t != null && e in ye(t);
      }
      function Sp(e) {
        var t = typeof e;
        return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
      }
      function In(e) {
        var t = di(e), a = f[t];
        if (typeof a != "function" || !(t in pe.prototype))
          return !1;
        if (e === a)
          return !0;
        var o = Wn(a);
        return !!o && e === o[0];
      }
      function wp(e) {
        return !!tl && tl in e;
      }
      var dp = Ja ? cr : jn;
      function ma(e) {
        var t = e && e.constructor, a = typeof t == "function" && t.prototype || Yr;
        return e === a;
      }
      function tu(e) {
        return e === e && !be(e);
      }
      function ru(e, t) {
        return function(a) {
          return a == null ? !1 : a[e] === t && (t !== i || e in ye(a));
        };
      }
      function gp(e) {
        var t = _i(e, function(o) {
          return a.size === g && a.clear(), o;
        }), a = t.cache;
        return t;
      }
      function Ap(e, t) {
        var a = e[1], o = t[1], c = a | o, s = c < (v | I | V), m = o == V && a == N || o == V && a == x && e[7].length <= t[8] || o == (V | x) && t[7].length <= t[8] && a == N;
        if (!(s || m))
          return e;
        o & v && (e[2] = t[2], c |= a & v ? 0 : fe);
        var _ = t[3];
        if (_) {
          var k = e[3];
          e[3] = k ? Pl(k, _, t[4]) : _, e[4] = k ? dr(e[3], d) : t[4];
        }
        return _ = t[5], _ && (k = e[5], e[5] = k ? Ol(k, _, t[6]) : _, e[6] = k ? dr(e[5], d) : t[6]), _ = t[7], _ && (e[7] = _), o & V && (e[8] = e[8] == null ? t[8] : Ve(e[8], t[8])), e[9] == null && (e[9] = t[9]), e[0] = t[0], e[1] = c, e;
      }
      function mp(e) {
        var t = [];
        if (e != null)
          for (var a in ye(e))
            t.push(a);
        return t;
      }
      function Lp(e) {
        return Xa.call(e);
      }
      function au(e, t, a) {
        return t = Ge(t === i ? e.length - 1 : t, 0), function() {
          for (var o = arguments, c = -1, s = Ge(o.length - t, 0), m = F(s); ++c < s; )
            m[c] = o[t + c];
          c = -1;
          for (var _ = F(t + 1); ++c < t; )
            _[c] = o[c];
          return _[t] = a(m), St(e, this, _);
        };
      }
      function iu(e, t) {
        return t.length < 2 ? e : Hr(e, Wt(t, 0, -1));
      }
      function Tp(e, t) {
        for (var a = e.length, o = Ve(t.length, a), c = nt(e); o--; ) {
          var s = t[o];
          e[o] = ur(s, a) ? c[s] : i;
        }
        return e;
      }
      function Kn(e, t) {
        if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__")
          return e[t];
      }
      var nu = lu(Bl), La = Kf || function(e, t) {
        return ze.setTimeout(e, t);
      }, Mn = lu(Ys);
      function ou(e, t, a) {
        var o = t + "";
        return Mn(e, sp(o, _p(cp(o), a)));
      }
      function lu(e) {
        var t = 0, a = 0;
        return function() {
          var o = Gf(), c = _e - (o - a);
          if (a = o, c > 0) {
            if (++t >= Y)
              return arguments[0];
          } else
            t = 0;
          return e.apply(i, arguments);
        };
      }
      function Ai(e, t) {
        var a = -1, o = e.length, c = o - 1;
        for (t = t === i ? o : t; ++a < t; ) {
          var s = mn(a, c), m = e[s];
          e[s] = e[a], e[a] = m;
        }
        return e.length = t, e;
      }
      var uu = gp(function(e) {
        var t = [];
        return e.charCodeAt(0) === 46 && t.push(""), e.replace(hh, function(a, o, c, s) {
          t.push(c ? s.replace(Ah, "$1") : o || a);
        }), t;
      });
      function $t(e) {
        if (typeof e == "string" || gt(e))
          return e;
        var t = e + "";
        return t == "0" && 1 / e == -Ze ? "-0" : t;
      }
      function Rr(e) {
        if (e != null) {
          try {
            return qa.call(e);
          } catch {
          }
          try {
            return e + "";
          } catch {
          }
        }
        return "";
      }
      function _p(e, t) {
        return Ct(It, function(a) {
          var o = "_." + a[0];
          t & a[1] && !Na(e, o) && e.push(o);
        }), e.sort();
      }
      function cu(e) {
        if (e instanceof pe)
          return e.clone();
        var t = new vt(e.__wrapped__, e.__chain__);
        return t.__actions__ = nt(e.__actions__), t.__index__ = e.__index__, t.__values__ = e.__values__, t;
      }
      function yp(e, t, a) {
        (a ? rt(e, t, a) : t === i) ? t = 1 : t = Ge(le(t), 0);
        var o = e == null ? 0 : e.length;
        if (!o || t < 1)
          return [];
        for (var c = 0, s = 0, m = F(ei(o / t)); c < o; )
          m[s++] = Wt(e, c, c += t);
        return m;
      }
      function kp(e) {
        for (var t = -1, a = e == null ? 0 : e.length, o = 0, c = []; ++t < a; ) {
          var s = e[t];
          s && (c[o++] = s);
        }
        return c;
      }
      function Dp() {
        var e = arguments.length;
        if (!e)
          return [];
        for (var t = F(e - 1), a = arguments[0], o = e; o--; )
          t[o - 1] = arguments[o];
        return wr(ne(a) ? nt(a) : [a], Je(t, 1));
      }
      var Fp = he(function(e, t) {
        return Re(e) ? Sa(e, Je(t, 1, Re, !0)) : [];
      }), Cp = he(function(e, t) {
        var a = Ht(t);
        return Re(a) && (a = i), Re(e) ? Sa(e, Je(t, 1, Re, !0), j(a, 2)) : [];
      }), Bp = he(function(e, t) {
        var a = Ht(t);
        return Re(a) && (a = i), Re(e) ? Sa(e, Je(t, 1, Re, !0), i, a) : [];
      });
      function vp(e, t, a) {
        var o = e == null ? 0 : e.length;
        return o ? (t = a || t === i ? 1 : le(t), Wt(e, t < 0 ? 0 : t, o)) : [];
      }
      function bp(e, t, a) {
        var o = e == null ? 0 : e.length;
        return o ? (t = a || t === i ? 1 : le(t), t = o - t, Wt(e, 0, t < 0 ? 0 : t)) : [];
      }
      function Wp(e, t) {
        return e && e.length ? hi(e, j(t, 3), !0, !0) : [];
      }
      function Hp(e, t) {
        return e && e.length ? hi(e, j(t, 3), !0) : [];
      }
      function Ep(e, t, a, o) {
        var c = e == null ? 0 : e.length;
        return c ? (a && typeof a != "number" && rt(e, t, a) && (a = 0, o = c), Ds(e, t, a, o)) : [];
      }
      function hu(e, t, a) {
        var o = e == null ? 0 : e.length;
        if (!o)
          return -1;
        var c = a == null ? 0 : le(a);
        return c < 0 && (c = Ge(o + c, 0)), xa(e, j(t, 3), c);
      }
      function fu(e, t, a) {
        var o = e == null ? 0 : e.length;
        if (!o)
          return -1;
        var c = o - 1;
        return a !== i && (c = le(a), c = a < 0 ? Ge(o + c, 0) : Ve(c, o - 1)), xa(e, j(t, 3), c, !0);
      }
      function su(e) {
        var t = e == null ? 0 : e.length;
        return t ? Je(e, 1) : [];
      }
      function Rp(e) {
        var t = e == null ? 0 : e.length;
        return t ? Je(e, Ze) : [];
      }
      function Ip(e, t) {
        var a = e == null ? 0 : e.length;
        return a ? (t = t === i ? 1 : le(t), Je(e, t)) : [];
      }
      function Kp(e) {
        for (var t = -1, a = e == null ? 0 : e.length, o = {}; ++t < a; ) {
          var c = e[t];
          o[c[0]] = c[1];
        }
        return o;
      }
      function pu(e) {
        return e && e.length ? e[0] : i;
      }
      function Mp(e, t, a) {
        var o = e == null ? 0 : e.length;
        if (!o)
          return -1;
        var c = a == null ? 0 : le(a);
        return c < 0 && (c = Ge(o + c, 0)), Gr(e, t, c);
      }
      function Pp(e) {
        var t = e == null ? 0 : e.length;
        return t ? Wt(e, 0, -1) : [];
      }
      var Op = he(function(e) {
        var t = ve(e, kn);
        return t.length && t[0] === e[0] ? Sn(t) : [];
      }), Gp = he(function(e) {
        var t = Ht(e), a = ve(e, kn);
        return t === Ht(a) ? t = i : a.pop(), a.length && a[0] === e[0] ? Sn(a, j(t, 2)) : [];
      }), Up = he(function(e) {
        var t = Ht(e), a = ve(e, kn);
        return t = typeof t == "function" ? t : i, t && a.pop(), a.length && a[0] === e[0] ? Sn(a, i, t) : [];
      });
      function Np(e, t) {
        return e == null ? "" : Pf.call(e, t);
      }
      function Ht(e) {
        var t = e == null ? 0 : e.length;
        return t ? e[t - 1] : i;
      }
      function xp(e, t, a) {
        var o = e == null ? 0 : e.length;
        if (!o)
          return -1;
        var c = o;
        return a !== i && (c = le(a), c = c < 0 ? Ge(o + c, 0) : Ve(c, o - 1)), t === t ? _f(e, t, c) : xa(e, qo, c, !0);
      }
      function Yp(e, t) {
        return e && e.length ? kl(e, le(t)) : i;
      }
      var zp = he(Su);
      function Su(e, t) {
        return e && e.length && t && t.length ? An(e, t) : e;
      }
      function Jp(e, t, a) {
        return e && e.length && t && t.length ? An(e, t, j(a, 2)) : e;
      }
      function qp(e, t, a) {
        return e && e.length && t && t.length ? An(e, t, i, a) : e;
      }
      var Xp = lr(function(e, t) {
        var a = e == null ? 0 : e.length, o = hn(e, t);
        return Cl(e, ve(t, function(c) {
          return ur(c, a) ? +c : c;
        }).sort(Ml)), o;
      });
      function Zp(e, t) {
        var a = [];
        if (!(e && e.length))
          return a;
        var o = -1, c = [], s = e.length;
        for (t = j(t, 3); ++o < s; ) {
          var m = e[o];
          t(m, o, e) && (a.push(m), c.push(o));
        }
        return Cl(e, c), a;
      }
      function Pn(e) {
        return e == null ? e : Nf.call(e);
      }
      function Qp(e, t, a) {
        var o = e == null ? 0 : e.length;
        return o ? (a && typeof a != "number" && rt(e, t, a) ? (t = 0, a = o) : (t = t == null ? 0 : le(t), a = a === i ? o : le(a)), Wt(e, t, a)) : [];
      }
      function Vp(e, t) {
        return ci(e, t);
      }
      function jp(e, t, a) {
        return Tn(e, t, j(a, 2));
      }
      function $p(e, t) {
        var a = e == null ? 0 : e.length;
        if (a) {
          var o = ci(e, t);
          if (o < a && Ut(e[o], t))
            return o;
        }
        return -1;
      }
      function eS(e, t) {
        return ci(e, t, !0);
      }
      function tS(e, t, a) {
        return Tn(e, t, j(a, 2), !0);
      }
      function rS(e, t) {
        var a = e == null ? 0 : e.length;
        if (a) {
          var o = ci(e, t, !0) - 1;
          if (Ut(e[o], t))
            return o;
        }
        return -1;
      }
      function aS(e) {
        return e && e.length ? vl(e) : [];
      }
      function iS(e, t) {
        return e && e.length ? vl(e, j(t, 2)) : [];
      }
      function nS(e) {
        var t = e == null ? 0 : e.length;
        return t ? Wt(e, 1, t) : [];
      }
      function oS(e, t, a) {
        return e && e.length ? (t = a || t === i ? 1 : le(t), Wt(e, 0, t < 0 ? 0 : t)) : [];
      }
      function lS(e, t, a) {
        var o = e == null ? 0 : e.length;
        return o ? (t = a || t === i ? 1 : le(t), t = o - t, Wt(e, t < 0 ? 0 : t, o)) : [];
      }
      function uS(e, t) {
        return e && e.length ? hi(e, j(t, 3), !1, !0) : [];
      }
      function cS(e, t) {
        return e && e.length ? hi(e, j(t, 3)) : [];
      }
      var hS = he(function(e) {
        return mr(Je(e, 1, Re, !0));
      }), fS = he(function(e) {
        var t = Ht(e);
        return Re(t) && (t = i), mr(Je(e, 1, Re, !0), j(t, 2));
      }), sS = he(function(e) {
        var t = Ht(e);
        return t = typeof t == "function" ? t : i, mr(Je(e, 1, Re, !0), i, t);
      });
      function pS(e) {
        return e && e.length ? mr(e) : [];
      }
      function SS(e, t) {
        return e && e.length ? mr(e, j(t, 2)) : [];
      }
      function wS(e, t) {
        return t = typeof t == "function" ? t : i, e && e.length ? mr(e, i, t) : [];
      }
      function On(e) {
        if (!(e && e.length))
          return [];
        var t = 0;
        return e = Sr(e, function(a) {
          if (Re(a))
            return t = Ge(a.length, t), !0;
        }), tn(t, function(a) {
          return ve(e, ji(a));
        });
      }
      function wu(e, t) {
        if (!(e && e.length))
          return [];
        var a = On(e);
        return t == null ? a : ve(a, function(o) {
          return St(t, i, o);
        });
      }
      var dS = he(function(e, t) {
        return Re(e) ? Sa(e, t) : [];
      }), gS = he(function(e) {
        return yn(Sr(e, Re));
      }), AS = he(function(e) {
        var t = Ht(e);
        return Re(t) && (t = i), yn(Sr(e, Re), j(t, 2));
      }), mS = he(function(e) {
        var t = Ht(e);
        return t = typeof t == "function" ? t : i, yn(Sr(e, Re), i, t);
      }), LS = he(On);
      function TS(e, t) {
        return El(e || [], t || [], pa);
      }
      function _S(e, t) {
        return El(e || [], t || [], ga);
      }
      var yS = he(function(e) {
        var t = e.length, a = t > 1 ? e[t - 1] : i;
        return a = typeof a == "function" ? (e.pop(), a) : i, wu(e, a);
      });
      function du(e) {
        var t = f(e);
        return t.__chain__ = !0, t;
      }
      function kS(e, t) {
        return t(e), e;
      }
      function mi(e, t) {
        return t(e);
      }
      var DS = lr(function(e) {
        var t = e.length, a = t ? e[0] : 0, o = this.__wrapped__, c = function(s) {
          return hn(s, e);
        };
        return t > 1 || this.__actions__.length || !(o instanceof pe) || !ur(a) ? this.thru(c) : (o = o.slice(a, +a + (t ? 1 : 0)), o.__actions__.push({
          func: mi,
          args: [c],
          thisArg: i
        }), new vt(o, this.__chain__).thru(function(s) {
          return t && !s.length && s.push(i), s;
        }));
      });
      function FS() {
        return du(this);
      }
      function CS() {
        return new vt(this.value(), this.__chain__);
      }
      function BS() {
        this.__values__ === i && (this.__values__ = bu(this.value()));
        var e = this.__index__ >= this.__values__.length, t = e ? i : this.__values__[this.__index__++];
        return { done: e, value: t };
      }
      function vS() {
        return this;
      }
      function bS(e) {
        for (var t, a = this; a instanceof ii; ) {
          var o = cu(a);
          o.__index__ = 0, o.__values__ = i, t ? c.__wrapped__ = o : t = o;
          var c = o;
          a = a.__wrapped__;
        }
        return c.__wrapped__ = e, t;
      }
      function WS() {
        var e = this.__wrapped__;
        if (e instanceof pe) {
          var t = e;
          return this.__actions__.length && (t = new pe(this)), t = t.reverse(), t.__actions__.push({
            func: mi,
            args: [Pn],
            thisArg: i
          }), new vt(t, this.__chain__);
        }
        return this.thru(Pn);
      }
      function HS() {
        return Hl(this.__wrapped__, this.__actions__);
      }
      var ES = fi(function(e, t, a) {
        Te.call(e, a) ? ++e[a] : nr(e, a, 1);
      });
      function RS(e, t, a) {
        var o = ne(e) ? zo : ks;
        return a && rt(e, t, a) && (t = i), o(e, j(t, 3));
      }
      function IS(e, t) {
        var a = ne(e) ? Sr : wl;
        return a(e, j(t, 3));
      }
      var KS = xl(hu), MS = xl(fu);
      function PS(e, t) {
        return Je(Li(e, t), 1);
      }
      function OS(e, t) {
        return Je(Li(e, t), Ze);
      }
      function GS(e, t, a) {
        return a = a === i ? 1 : le(a), Je(Li(e, t), a);
      }
      function gu(e, t) {
        var a = ne(e) ? Ct : Ar;
        return a(e, j(t, 3));
      }
      function Au(e, t) {
        var a = ne(e) ? nf : Sl;
        return a(e, j(t, 3));
      }
      var US = fi(function(e, t, a) {
        Te.call(e, a) ? e[a].push(t) : nr(e, a, [t]);
      });
      function NS(e, t, a, o) {
        e = ot(e) ? e : jr(e), a = a && !o ? le(a) : 0;
        var c = e.length;
        return a < 0 && (a = Ge(c + a, 0)), Di(e) ? a <= c && e.indexOf(t, a) > -1 : !!c && Gr(e, t, a) > -1;
      }
      var xS = he(function(e, t, a) {
        var o = -1, c = typeof t == "function", s = ot(e) ? F(e.length) : [];
        return Ar(e, function(m) {
          s[++o] = c ? St(t, m, a) : wa(m, t, a);
        }), s;
      }), YS = fi(function(e, t, a) {
        nr(e, a, t);
      });
      function Li(e, t) {
        var a = ne(e) ? ve : Tl;
        return a(e, j(t, 3));
      }
      function zS(e, t, a, o) {
        return e == null ? [] : (ne(t) || (t = t == null ? [] : [t]), a = o ? i : a, ne(a) || (a = a == null ? [] : [a]), Dl(e, t, a));
      }
      var JS = fi(function(e, t, a) {
        e[a ? 0 : 1].push(t);
      }, function() {
        return [[], []];
      });
      function qS(e, t, a) {
        var o = ne(e) ? Qi : Zo, c = arguments.length < 3;
        return o(e, j(t, 4), a, c, Ar);
      }
      function XS(e, t, a) {
        var o = ne(e) ? of : Zo, c = arguments.length < 3;
        return o(e, j(t, 4), a, c, Sl);
      }
      function ZS(e, t) {
        var a = ne(e) ? Sr : wl;
        return a(e, yi(j(t, 3)));
      }
      function QS(e) {
        var t = ne(e) ? hl : Ns;
        return t(e);
      }
      function VS(e, t, a) {
        (a ? rt(e, t, a) : t === i) ? t = 1 : t = le(t);
        var o = ne(e) ? ms : xs;
        return o(e, t);
      }
      function jS(e) {
        var t = ne(e) ? Ls : zs;
        return t(e);
      }
      function $S(e) {
        if (e == null)
          return 0;
        if (ot(e))
          return Di(e) ? Nr(e) : e.length;
        var t = je(e);
        return t == ft || t == z ? e.size : dn(e).length;
      }
      function ew(e, t, a) {
        var o = ne(e) ? Vi : Js;
        return a && rt(e, t, a) && (t = i), o(e, j(t, 3));
      }
      var tw = he(function(e, t) {
        if (e == null)
          return [];
        var a = t.length;
        return a > 1 && rt(e, t[0], t[1]) ? t = [] : a > 2 && rt(t[0], t[1], t[2]) && (t = [t[0]]), Dl(e, Je(t, 1), []);
      }), Ti = If || function() {
        return ze.Date.now();
      };
      function rw(e, t) {
        if (typeof t != "function")
          throw new Bt(S);
        return e = le(e), function() {
          if (--e < 1)
            return t.apply(this, arguments);
        };
      }
      function mu(e, t, a) {
        return t = a ? i : t, t = e && t == null ? e.length : t, or(e, V, i, i, i, i, t);
      }
      function Lu(e, t) {
        var a;
        if (typeof t != "function")
          throw new Bt(S);
        return e = le(e), function() {
          return --e > 0 && (a = t.apply(this, arguments)), e <= 1 && (t = i), a;
        };
      }
      var Gn = he(function(e, t, a) {
        var o = v;
        if (a.length) {
          var c = dr(a, Qr(Gn));
          o |= oe;
        }
        return or(e, o, t, a, c);
      }), Tu = he(function(e, t, a) {
        var o = v | I;
        if (a.length) {
          var c = dr(a, Qr(Tu));
          o |= oe;
        }
        return or(t, o, e, a, c);
      });
      function _u(e, t, a) {
        t = a ? i : t;
        var o = or(e, N, i, i, i, i, i, t);
        return o.placeholder = _u.placeholder, o;
      }
      function yu(e, t, a) {
        t = a ? i : t;
        var o = or(e, M, i, i, i, i, i, t);
        return o.placeholder = yu.placeholder, o;
      }
      function ku(e, t, a) {
        var o, c, s, m, _, k, W = 0, H = !1, E = !1, P = !0;
        if (typeof e != "function")
          throw new Bt(S);
        t = Et(t) || 0, be(a) && (H = !!a.leading, E = "maxWait" in a, s = E ? Ge(Et(a.maxWait) || 0, t) : s, P = "trailing" in a ? !!a.trailing : P);
        function q(Ie) {
          var Nt = o, fr = c;
          return o = c = i, W = Ie, m = e.apply(fr, Nt), m;
        }
        function $(Ie) {
          return W = Ie, _ = La(se, t), H ? q(Ie) : m;
        }
        function ce(Ie) {
          var Nt = Ie - k, fr = Ie - W, xu = t - Nt;
          return E ? Ve(xu, s - fr) : xu;
        }
        function ee(Ie) {
          var Nt = Ie - k, fr = Ie - W;
          return k === i || Nt >= t || Nt < 0 || E && fr >= s;
        }
        function se() {
          var Ie = Ti();
          if (ee(Ie))
            return we(Ie);
          _ = La(se, ce(Ie));
        }
        function we(Ie) {
          return _ = i, P && o ? q(Ie) : (o = c = i, m);
        }
        function At() {
          _ !== i && Rl(_), W = 0, o = k = c = _ = i;
        }
        function at() {
          return _ === i ? m : we(Ti());
        }
        function mt() {
          var Ie = Ti(), Nt = ee(Ie);
          if (o = arguments, c = this, k = Ie, Nt) {
            if (_ === i)
              return $(k);
            if (E)
              return Rl(_), _ = La(se, t), q(k);
          }
          return _ === i && (_ = La(se, t)), m;
        }
        return mt.cancel = At, mt.flush = at, mt;
      }
      var aw = he(function(e, t) {
        return pl(e, 1, t);
      }), iw = he(function(e, t, a) {
        return pl(e, Et(t) || 0, a);
      });
      function nw(e) {
        return or(e, ue);
      }
      function _i(e, t) {
        if (typeof e != "function" || t != null && typeof t != "function")
          throw new Bt(S);
        var a = function() {
          var o = arguments, c = t ? t.apply(this, o) : o[0], s = a.cache;
          if (s.has(c))
            return s.get(c);
          var m = e.apply(this, o);
          return a.cache = s.set(c, m) || s, m;
        };
        return a.cache = new (_i.Cache || ir)(), a;
      }
      _i.Cache = ir;
      function yi(e) {
        if (typeof e != "function")
          throw new Bt(S);
        return function() {
          var t = arguments;
          switch (t.length) {
            case 0:
              return !e.call(this);
            case 1:
              return !e.call(this, t[0]);
            case 2:
              return !e.call(this, t[0], t[1]);
            case 3:
              return !e.call(this, t[0], t[1], t[2]);
          }
          return !e.apply(this, t);
        };
      }
      function ow(e) {
        return Lu(2, e);
      }
      var lw = qs(function(e, t) {
        t = t.length == 1 && ne(t[0]) ? ve(t[0], wt(j())) : ve(Je(t, 1), wt(j()));
        var a = t.length;
        return he(function(o) {
          for (var c = -1, s = Ve(o.length, a); ++c < s; )
            o[c] = t[c].call(this, o[c]);
          return St(e, this, o);
        });
      }), Un = he(function(e, t) {
        var a = dr(t, Qr(Un));
        return or(e, oe, i, t, a);
      }), Du = he(function(e, t) {
        var a = dr(t, Qr(Du));
        return or(e, te, i, t, a);
      }), uw = lr(function(e, t) {
        return or(e, x, i, i, i, t);
      });
      function cw(e, t) {
        if (typeof e != "function")
          throw new Bt(S);
        return t = t === i ? t : le(t), he(e, t);
      }
      function hw(e, t) {
        if (typeof e != "function")
          throw new Bt(S);
        return t = t == null ? 0 : Ge(le(t), 0), he(function(a) {
          var o = a[t], c = Tr(a, 0, t);
          return o && wr(c, o), St(e, this, c);
        });
      }
      function fw(e, t, a) {
        var o = !0, c = !0;
        if (typeof e != "function")
          throw new Bt(S);
        return be(a) && (o = "leading" in a ? !!a.leading : o, c = "trailing" in a ? !!a.trailing : c), ku(e, t, {
          leading: o,
          maxWait: t,
          trailing: c
        });
      }
      function sw(e) {
        return mu(e, 1);
      }
      function pw(e, t) {
        return Un(Dn(t), e);
      }
      function Sw() {
        if (!arguments.length)
          return [];
        var e = arguments[0];
        return ne(e) ? e : [e];
      }
      function ww(e) {
        return bt(e, D);
      }
      function dw(e, t) {
        return t = typeof t == "function" ? t : i, bt(e, D, t);
      }
      function gw(e) {
        return bt(e, w | D);
      }
      function Aw(e, t) {
        return t = typeof t == "function" ? t : i, bt(e, w | D, t);
      }
      function mw(e, t) {
        return t == null || sl(e, t, Ne(t));
      }
      function Ut(e, t) {
        return e === t || e !== e && t !== t;
      }
      var Lw = wi(pn), Tw = wi(function(e, t) {
        return e >= t;
      }), Ir = Al(function() {
        return arguments;
      }()) ? Al : function(e) {
        return He(e) && Te.call(e, "callee") && !il.call(e, "callee");
      }, ne = F.isArray, _w = Oo ? wt(Oo) : bs;
      function ot(e) {
        return e != null && ki(e.length) && !cr(e);
      }
      function Re(e) {
        return He(e) && ot(e);
      }
      function yw(e) {
        return e === !0 || e === !1 || He(e) && tt(e) == Kt;
      }
      var _r = Mf || jn, kw = Go ? wt(Go) : Ws;
      function Dw(e) {
        return He(e) && e.nodeType === 1 && !Ta(e);
      }
      function Fw(e) {
        if (e == null)
          return !0;
        if (ot(e) && (ne(e) || typeof e == "string" || typeof e.splice == "function" || _r(e) || Vr(e) || Ir(e)))
          return !e.length;
        var t = je(e);
        if (t == ft || t == z)
          return !e.size;
        if (ma(e))
          return !dn(e).length;
        for (var a in e)
          if (Te.call(e, a))
            return !1;
        return !0;
      }
      function Cw(e, t) {
        return da(e, t);
      }
      function Bw(e, t, a) {
        a = typeof a == "function" ? a : i;
        var o = a ? a(e, t) : i;
        return o === i ? da(e, t, i, a) : !!o;
      }
      function Nn(e) {
        if (!He(e))
          return !1;
        var t = tt(e);
        return t == Zt || t == Xt || typeof e.message == "string" && typeof e.name == "string" && !Ta(e);
      }
      function vw(e) {
        return typeof e == "number" && ol(e);
      }
      function cr(e) {
        if (!be(e))
          return !1;
        var t = tt(e);
        return t == Dt || t == tr || t == Jt || t == Oi;
      }
      function Fu(e) {
        return typeof e == "number" && e == le(e);
      }
      function ki(e) {
        return typeof e == "number" && e > -1 && e % 1 == 0 && e <= ht;
      }
      function be(e) {
        var t = typeof e;
        return e != null && (t == "object" || t == "function");
      }
      function He(e) {
        return e != null && typeof e == "object";
      }
      var Cu = Uo ? wt(Uo) : Es;
      function bw(e, t) {
        return e === t || wn(e, t, Hn(t));
      }
      function Ww(e, t, a) {
        return a = typeof a == "function" ? a : i, wn(e, t, Hn(t), a);
      }
      function Hw(e) {
        return Bu(e) && e != +e;
      }
      function Ew(e) {
        if (dp(e))
          throw new ie(h);
        return ml(e);
      }
      function Rw(e) {
        return e === null;
      }
      function Iw(e) {
        return e == null;
      }
      function Bu(e) {
        return typeof e == "number" || He(e) && tt(e) == Mt;
      }
      function Ta(e) {
        if (!He(e) || tt(e) != Pt)
          return !1;
        var t = Va(e);
        if (t === null)
          return !0;
        var a = Te.call(t, "constructor") && t.constructor;
        return typeof a == "function" && a instanceof a && qa.call(a) == Wf;
      }
      var xn = No ? wt(No) : Rs;
      function Kw(e) {
        return Fu(e) && e >= -ht && e <= ht;
      }
      var vu = xo ? wt(xo) : Is;
      function Di(e) {
        return typeof e == "string" || !ne(e) && He(e) && tt(e) == re;
      }
      function gt(e) {
        return typeof e == "symbol" || He(e) && tt(e) == me;
      }
      var Vr = Yo ? wt(Yo) : Ks;
      function Mw(e) {
        return e === i;
      }
      function Pw(e) {
        return He(e) && je(e) == ae;
      }
      function Ow(e) {
        return He(e) && tt(e) == Le;
      }
      var Gw = wi(gn), Uw = wi(function(e, t) {
        return e <= t;
      });
      function bu(e) {
        if (!e)
          return [];
        if (ot(e))
          return Di(e) ? Ot(e) : nt(e);
        if (ua && e[ua])
          return mf(e[ua]());
        var t = je(e), a = t == ft ? an : t == z ? Ya : jr;
        return a(e);
      }
      function hr(e) {
        if (!e)
          return e === 0 ? e : 0;
        if (e = Et(e), e === Ze || e === -Ze) {
          var t = e < 0 ? -1 : 1;
          return t * _t;
        }
        return e === e ? e : 0;
      }
      function le(e) {
        var t = hr(e), a = t % 1;
        return t === t ? a ? t - a : t : 0;
      }
      function Wu(e) {
        return e ? Wr(le(e), 0, Qe) : 0;
      }
      function Et(e) {
        if (typeof e == "number")
          return e;
        if (gt(e))
          return sr;
        if (be(e)) {
          var t = typeof e.valueOf == "function" ? e.valueOf() : e;
          e = be(t) ? t + "" : t;
        }
        if (typeof e != "string")
          return e === 0 ? e : +e;
        e = Qo(e);
        var a = Th.test(e);
        return a || yh.test(e) ? tf(e.slice(2), a ? 2 : 8) : Lh.test(e) ? sr : +e;
      }
      function Hu(e) {
        return jt(e, lt(e));
      }
      function Nw(e) {
        return e ? Wr(le(e), -ht, ht) : e === 0 ? e : 0;
      }
      function Ae(e) {
        return e == null ? "" : dt(e);
      }
      var xw = Xr(function(e, t) {
        if (ma(t) || ot(t)) {
          jt(t, Ne(t), e);
          return;
        }
        for (var a in t)
          Te.call(t, a) && pa(e, a, t[a]);
      }), Eu = Xr(function(e, t) {
        jt(t, lt(t), e);
      }), Fi = Xr(function(e, t, a, o) {
        jt(t, lt(t), e, o);
      }), Yw = Xr(function(e, t, a, o) {
        jt(t, Ne(t), e, o);
      }), zw = lr(hn);
      function Jw(e, t) {
        var a = qr(e);
        return t == null ? a : fl(a, t);
      }
      var qw = he(function(e, t) {
        e = ye(e);
        var a = -1, o = t.length, c = o > 2 ? t[2] : i;
        for (c && rt(t[0], t[1], c) && (o = 1); ++a < o; )
          for (var s = t[a], m = lt(s), _ = -1, k = m.length; ++_ < k; ) {
            var W = m[_], H = e[W];
            (H === i || Ut(H, Yr[W]) && !Te.call(e, W)) && (e[W] = s[W]);
          }
        return e;
      }), Xw = he(function(e) {
        return e.push(i, Ql), St(Ru, i, e);
      });
      function Zw(e, t) {
        return Jo(e, j(t, 3), Vt);
      }
      function Qw(e, t) {
        return Jo(e, j(t, 3), sn);
      }
      function Vw(e, t) {
        return e == null ? e : fn(e, j(t, 3), lt);
      }
      function jw(e, t) {
        return e == null ? e : dl(e, j(t, 3), lt);
      }
      function $w(e, t) {
        return e && Vt(e, j(t, 3));
      }
      function ed(e, t) {
        return e && sn(e, j(t, 3));
      }
      function td(e) {
        return e == null ? [] : li(e, Ne(e));
      }
      function rd(e) {
        return e == null ? [] : li(e, lt(e));
      }
      function Yn(e, t, a) {
        var o = e == null ? i : Hr(e, t);
        return o === i ? a : o;
      }
      function ad(e, t) {
        return e != null && $l(e, t, Fs);
      }
      function zn(e, t) {
        return e != null && $l(e, t, Cs);
      }
      var id = zl(function(e, t, a) {
        t != null && typeof t.toString != "function" && (t = Xa.call(t)), e[t] = a;
      }, qn(ut)), nd = zl(function(e, t, a) {
        t != null && typeof t.toString != "function" && (t = Xa.call(t)), Te.call(e, t) ? e[t].push(a) : e[t] = [a];
      }, j), od = he(wa);
      function Ne(e) {
        return ot(e) ? cl(e) : dn(e);
      }
      function lt(e) {
        return ot(e) ? cl(e, !0) : Ms(e);
      }
      function ld(e, t) {
        var a = {};
        return t = j(t, 3), Vt(e, function(o, c, s) {
          nr(a, t(o, c, s), o);
        }), a;
      }
      function ud(e, t) {
        var a = {};
        return t = j(t, 3), Vt(e, function(o, c, s) {
          nr(a, c, t(o, c, s));
        }), a;
      }
      var cd = Xr(function(e, t, a) {
        ui(e, t, a);
      }), Ru = Xr(function(e, t, a, o) {
        ui(e, t, a, o);
      }), hd = lr(function(e, t) {
        var a = {};
        if (e == null)
          return a;
        var o = !1;
        t = ve(t, function(s) {
          return s = Lr(s, e), o || (o = s.length > 1), s;
        }), jt(e, bn(e), a), o && (a = bt(a, w | L | D, ip));
        for (var c = t.length; c--; )
          _n(a, t[c]);
        return a;
      });
      function fd(e, t) {
        return Iu(e, yi(j(t)));
      }
      var sd = lr(function(e, t) {
        return e == null ? {} : Os(e, t);
      });
      function Iu(e, t) {
        if (e == null)
          return {};
        var a = ve(bn(e), function(o) {
          return [o];
        });
        return t = j(t), Fl(e, a, function(o, c) {
          return t(o, c[0]);
        });
      }
      function pd(e, t, a) {
        t = Lr(t, e);
        var o = -1, c = t.length;
        for (c || (c = 1, e = i); ++o < c; ) {
          var s = e == null ? i : e[$t(t[o])];
          s === i && (o = c, s = a), e = cr(s) ? s.call(e) : s;
        }
        return e;
      }
      function Sd(e, t, a) {
        return e == null ? e : ga(e, t, a);
      }
      function wd(e, t, a, o) {
        return o = typeof o == "function" ? o : i, e == null ? e : ga(e, t, a, o);
      }
      var Ku = Xl(Ne), Mu = Xl(lt);
      function dd(e, t, a) {
        var o = ne(e), c = o || _r(e) || Vr(e);
        if (t = j(t, 4), a == null) {
          var s = e && e.constructor;
          c ? a = o ? new s() : [] : be(e) ? a = cr(s) ? qr(Va(e)) : {} : a = {};
        }
        return (c ? Ct : Vt)(e, function(m, _, k) {
          return t(a, m, _, k);
        }), a;
      }
      function gd(e, t) {
        return e == null ? !0 : _n(e, t);
      }
      function Ad(e, t, a) {
        return e == null ? e : Wl(e, t, Dn(a));
      }
      function md(e, t, a, o) {
        return o = typeof o == "function" ? o : i, e == null ? e : Wl(e, t, Dn(a), o);
      }
      function jr(e) {
        return e == null ? [] : rn(e, Ne(e));
      }
      function Ld(e) {
        return e == null ? [] : rn(e, lt(e));
      }
      function Td(e, t, a) {
        return a === i && (a = t, t = i), a !== i && (a = Et(a), a = a === a ? a : 0), t !== i && (t = Et(t), t = t === t ? t : 0), Wr(Et(e), t, a);
      }
      function _d(e, t, a) {
        return t = hr(t), a === i ? (a = t, t = 0) : a = hr(a), e = Et(e), Bs(e, t, a);
      }
      function yd(e, t, a) {
        if (a && typeof a != "boolean" && rt(e, t, a) && (t = a = i), a === i && (typeof t == "boolean" ? (a = t, t = i) : typeof e == "boolean" && (a = e, e = i)), e === i && t === i ? (e = 0, t = 1) : (e = hr(e), t === i ? (t = e, e = 0) : t = hr(t)), e > t) {
          var o = e;
          e = t, t = o;
        }
        if (a || e % 1 || t % 1) {
          var c = ll();
          return Ve(e + c * (t - e + ef("1e-" + ((c + "").length - 1))), t);
        }
        return mn(e, t);
      }
      var kd = Zr(function(e, t, a) {
        return t = t.toLowerCase(), e + (a ? Pu(t) : t);
      });
      function Pu(e) {
        return Jn(Ae(e).toLowerCase());
      }
      function Ou(e) {
        return e = Ae(e), e && e.replace(Dh, Sf).replace(Yh, "");
      }
      function Dd(e, t, a) {
        e = Ae(e), t = dt(t);
        var o = e.length;
        a = a === i ? o : Wr(le(a), 0, o);
        var c = a;
        return a -= t.length, a >= 0 && e.slice(a, c) == t;
      }
      function Fd(e) {
        return e = Ae(e), e && Ma.test(e) ? e.replace(Fr, wf) : e;
      }
      function Cd(e) {
        return e = Ae(e), e && fh.test(e) ? e.replace(Gi, "\\$&") : e;
      }
      var Bd = Zr(function(e, t, a) {
        return e + (a ? "-" : "") + t.toLowerCase();
      }), vd = Zr(function(e, t, a) {
        return e + (a ? " " : "") + t.toLowerCase();
      }), bd = Nl("toLowerCase");
      function Wd(e, t, a) {
        e = Ae(e), t = le(t);
        var o = t ? Nr(e) : 0;
        if (!t || o >= t)
          return e;
        var c = (t - o) / 2;
        return Si(ti(c), a) + e + Si(ei(c), a);
      }
      function Hd(e, t, a) {
        e = Ae(e), t = le(t);
        var o = t ? Nr(e) : 0;
        return t && o < t ? e + Si(t - o, a) : e;
      }
      function Ed(e, t, a) {
        e = Ae(e), t = le(t);
        var o = t ? Nr(e) : 0;
        return t && o < t ? Si(t - o, a) + e : e;
      }
      function Rd(e, t, a) {
        return a || t == null ? t = 0 : t && (t = +t), Uf(Ae(e).replace(Ui, ""), t || 0);
      }
      function Id(e, t, a) {
        return (a ? rt(e, t, a) : t === i) ? t = 1 : t = le(t), Ln(Ae(e), t);
      }
      function Kd() {
        var e = arguments, t = Ae(e[0]);
        return e.length < 3 ? t : t.replace(e[1], e[2]);
      }
      var Md = Zr(function(e, t, a) {
        return e + (a ? "_" : "") + t.toLowerCase();
      });
      function Pd(e, t, a) {
        return a && typeof a != "number" && rt(e, t, a) && (t = a = i), a = a === i ? Qe : a >>> 0, a ? (e = Ae(e), e && (typeof t == "string" || t != null && !xn(t)) && (t = dt(t), !t && Ur(e)) ? Tr(Ot(e), 0, a) : e.split(t, a)) : [];
      }
      var Od = Zr(function(e, t, a) {
        return e + (a ? " " : "") + Jn(t);
      });
      function Gd(e, t, a) {
        return e = Ae(e), a = a == null ? 0 : Wr(le(a), 0, e.length), t = dt(t), e.slice(a, a + t.length) == t;
      }
      function Ud(e, t, a) {
        var o = f.templateSettings;
        a && rt(e, t, a) && (t = i), e = Ae(e), t = Fi({}, t, o, Zl);
        var c = Fi({}, t.imports, o.imports, Zl), s = Ne(c), m = rn(c, s), _, k, W = 0, H = t.interpolate || Oa, E = "__p += '", P = nn(
          (t.escape || Oa).source + "|" + H.source + "|" + (H === go ? mh : Oa).source + "|" + (t.evaluate || Oa).source + "|$",
          "g"
        ), q = "//# sourceURL=" + (Te.call(t, "sourceURL") ? (t.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++Zh + "]") + `
`;
        e.replace(P, function(ee, se, we, At, at, mt) {
          return we || (we = At), E += e.slice(W, mt).replace(Fh, df), se && (_ = !0, E += `' +
__e(` + se + `) +
'`), at && (k = !0, E += `';
` + at + `;
__p += '`), we && (E += `' +
((__t = (` + we + `)) == null ? '' : __t) +
'`), W = mt + ee.length, ee;
        }), E += `';
`;
        var $ = Te.call(t, "variable") && t.variable;
        if (!$)
          E = `with (obj) {
` + E + `
}
`;
        else if (gh.test($))
          throw new ie(A);
        E = (k ? E.replace(oa, "") : E).replace(Pr, "$1").replace(rr, "$1;"), E = "function(" + ($ || "obj") + `) {
` + ($ ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (_ ? ", __e = _.escape" : "") + (k ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + E + `return __p
}`;
        var ce = Uu(function() {
          return ge(s, q + "return " + E).apply(i, m);
        });
        if (ce.source = E, Nn(ce))
          throw ce;
        return ce;
      }
      function Nd(e) {
        return Ae(e).toLowerCase();
      }
      function xd(e) {
        return Ae(e).toUpperCase();
      }
      function Yd(e, t, a) {
        if (e = Ae(e), e && (a || t === i))
          return Qo(e);
        if (!e || !(t = dt(t)))
          return e;
        var o = Ot(e), c = Ot(t), s = Vo(o, c), m = jo(o, c) + 1;
        return Tr(o, s, m).join("");
      }
      function zd(e, t, a) {
        if (e = Ae(e), e && (a || t === i))
          return e.slice(0, el(e) + 1);
        if (!e || !(t = dt(t)))
          return e;
        var o = Ot(e), c = jo(o, Ot(t)) + 1;
        return Tr(o, 0, c).join("");
      }
      function Jd(e, t, a) {
        if (e = Ae(e), e && (a || t === i))
          return e.replace(Ui, "");
        if (!e || !(t = dt(t)))
          return e;
        var o = Ot(e), c = Vo(o, Ot(t));
        return Tr(o, c).join("");
      }
      function qd(e, t) {
        var a = R, o = K;
        if (be(t)) {
          var c = "separator" in t ? t.separator : c;
          a = "length" in t ? le(t.length) : a, o = "omission" in t ? dt(t.omission) : o;
        }
        e = Ae(e);
        var s = e.length;
        if (Ur(e)) {
          var m = Ot(e);
          s = m.length;
        }
        if (a >= s)
          return e;
        var _ = a - Nr(o);
        if (_ < 1)
          return o;
        var k = m ? Tr(m, 0, _).join("") : e.slice(0, _);
        if (c === i)
          return k + o;
        if (m && (_ += k.length - _), xn(c)) {
          if (e.slice(_).search(c)) {
            var W, H = k;
            for (c.global || (c = nn(c.source, Ae(Ao.exec(c)) + "g")), c.lastIndex = 0; W = c.exec(H); )
              var E = W.index;
            k = k.slice(0, E === i ? _ : E);
          }
        } else if (e.indexOf(dt(c), _) != _) {
          var P = k.lastIndexOf(c);
          P > -1 && (k = k.slice(0, P));
        }
        return k + o;
      }
      function Xd(e) {
        return e = Ae(e), e && Ka.test(e) ? e.replace(Qt, yf) : e;
      }
      var Zd = Zr(function(e, t, a) {
        return e + (a ? " " : "") + t.toUpperCase();
      }), Jn = Nl("toUpperCase");
      function Gu(e, t, a) {
        return e = Ae(e), t = a ? i : t, t === i ? Af(e) ? Ff(e) : cf(e) : e.match(t) || [];
      }
      var Uu = he(function(e, t) {
        try {
          return St(e, i, t);
        } catch (a) {
          return Nn(a) ? a : new ie(a);
        }
      }), Qd = lr(function(e, t) {
        return Ct(t, function(a) {
          a = $t(a), nr(e, a, Gn(e[a], e));
        }), e;
      });
      function Vd(e) {
        var t = e == null ? 0 : e.length, a = j();
        return e = t ? ve(e, function(o) {
          if (typeof o[1] != "function")
            throw new Bt(S);
          return [a(o[0]), o[1]];
        }) : [], he(function(o) {
          for (var c = -1; ++c < t; ) {
            var s = e[c];
            if (St(s[0], this, o))
              return St(s[1], this, o);
          }
        });
      }
      function jd(e) {
        return ys(bt(e, w));
      }
      function qn(e) {
        return function() {
          return e;
        };
      }
      function $d(e, t) {
        return e == null || e !== e ? t : e;
      }
      var eg = Yl(), tg = Yl(!0);
      function ut(e) {
        return e;
      }
      function Xn(e) {
        return Ll(typeof e == "function" ? e : bt(e, w));
      }
      function rg(e) {
        return _l(bt(e, w));
      }
      function ag(e, t) {
        return yl(e, bt(t, w));
      }
      var ig = he(function(e, t) {
        return function(a) {
          return wa(a, e, t);
        };
      }), ng = he(function(e, t) {
        return function(a) {
          return wa(e, a, t);
        };
      });
      function Zn(e, t, a) {
        var o = Ne(t), c = li(t, o);
        a == null && !(be(t) && (c.length || !o.length)) && (a = t, t = e, e = this, c = li(t, Ne(t)));
        var s = !(be(a) && "chain" in a) || !!a.chain, m = cr(e);
        return Ct(c, function(_) {
          var k = t[_];
          e[_] = k, m && (e.prototype[_] = function() {
            var W = this.__chain__;
            if (s || W) {
              var H = e(this.__wrapped__), E = H.__actions__ = nt(this.__actions__);
              return E.push({ func: k, args: arguments, thisArg: e }), H.__chain__ = W, H;
            }
            return k.apply(e, wr([this.value()], arguments));
          });
        }), e;
      }
      function og() {
        return ze._ === this && (ze._ = Hf), this;
      }
      function Qn() {
      }
      function lg(e) {
        return e = le(e), he(function(t) {
          return kl(t, e);
        });
      }
      var ug = Cn(ve), cg = Cn(zo), hg = Cn(Vi);
      function Nu(e) {
        return Rn(e) ? ji($t(e)) : Gs(e);
      }
      function fg(e) {
        return function(t) {
          return e == null ? i : Hr(e, t);
        };
      }
      var sg = Jl(), pg = Jl(!0);
      function Vn() {
        return [];
      }
      function jn() {
        return !1;
      }
      function Sg() {
        return {};
      }
      function wg() {
        return "";
      }
      function dg() {
        return !0;
      }
      function gg(e, t) {
        if (e = le(e), e < 1 || e > ht)
          return [];
        var a = Qe, o = Ve(e, Qe);
        t = j(t), e -= Qe;
        for (var c = tn(o, t); ++a < e; )
          t(a);
        return c;
      }
      function Ag(e) {
        return ne(e) ? ve(e, $t) : gt(e) ? [e] : nt(uu(Ae(e)));
      }
      function mg(e) {
        var t = ++bf;
        return Ae(e) + t;
      }
      var Lg = pi(function(e, t) {
        return e + t;
      }, 0), Tg = Bn("ceil"), _g = pi(function(e, t) {
        return e / t;
      }, 1), yg = Bn("floor");
      function kg(e) {
        return e && e.length ? oi(e, ut, pn) : i;
      }
      function Dg(e, t) {
        return e && e.length ? oi(e, j(t, 2), pn) : i;
      }
      function Fg(e) {
        return Xo(e, ut);
      }
      function Cg(e, t) {
        return Xo(e, j(t, 2));
      }
      function Bg(e) {
        return e && e.length ? oi(e, ut, gn) : i;
      }
      function vg(e, t) {
        return e && e.length ? oi(e, j(t, 2), gn) : i;
      }
      var bg = pi(function(e, t) {
        return e * t;
      }, 1), Wg = Bn("round"), Hg = pi(function(e, t) {
        return e - t;
      }, 0);
      function Eg(e) {
        return e && e.length ? en(e, ut) : 0;
      }
      function Rg(e, t) {
        return e && e.length ? en(e, j(t, 2)) : 0;
      }
      return f.after = rw, f.ary = mu, f.assign = xw, f.assignIn = Eu, f.assignInWith = Fi, f.assignWith = Yw, f.at = zw, f.before = Lu, f.bind = Gn, f.bindAll = Qd, f.bindKey = Tu, f.castArray = Sw, f.chain = du, f.chunk = yp, f.compact = kp, f.concat = Dp, f.cond = Vd, f.conforms = jd, f.constant = qn, f.countBy = ES, f.create = Jw, f.curry = _u, f.curryRight = yu, f.debounce = ku, f.defaults = qw, f.defaultsDeep = Xw, f.defer = aw, f.delay = iw, f.difference = Fp, f.differenceBy = Cp, f.differenceWith = Bp, f.drop = vp, f.dropRight = bp, f.dropRightWhile = Wp, f.dropWhile = Hp, f.fill = Ep, f.filter = IS, f.flatMap = PS, f.flatMapDeep = OS, f.flatMapDepth = GS, f.flatten = su, f.flattenDeep = Rp, f.flattenDepth = Ip, f.flip = nw, f.flow = eg, f.flowRight = tg, f.fromPairs = Kp, f.functions = td, f.functionsIn = rd, f.groupBy = US, f.initial = Pp, f.intersection = Op, f.intersectionBy = Gp, f.intersectionWith = Up, f.invert = id, f.invertBy = nd, f.invokeMap = xS, f.iteratee = Xn, f.keyBy = YS, f.keys = Ne, f.keysIn = lt, f.map = Li, f.mapKeys = ld, f.mapValues = ud, f.matches = rg, f.matchesProperty = ag, f.memoize = _i, f.merge = cd, f.mergeWith = Ru, f.method = ig, f.methodOf = ng, f.mixin = Zn, f.negate = yi, f.nthArg = lg, f.omit = hd, f.omitBy = fd, f.once = ow, f.orderBy = zS, f.over = ug, f.overArgs = lw, f.overEvery = cg, f.overSome = hg, f.partial = Un, f.partialRight = Du, f.partition = JS, f.pick = sd, f.pickBy = Iu, f.property = Nu, f.propertyOf = fg, f.pull = zp, f.pullAll = Su, f.pullAllBy = Jp, f.pullAllWith = qp, f.pullAt = Xp, f.range = sg, f.rangeRight = pg, f.rearg = uw, f.reject = ZS, f.remove = Zp, f.rest = cw, f.reverse = Pn, f.sampleSize = VS, f.set = Sd, f.setWith = wd, f.shuffle = jS, f.slice = Qp, f.sortBy = tw, f.sortedUniq = aS, f.sortedUniqBy = iS, f.split = Pd, f.spread = hw, f.tail = nS, f.take = oS, f.takeRight = lS, f.takeRightWhile = uS, f.takeWhile = cS, f.tap = kS, f.throttle = fw, f.thru = mi, f.toArray = bu, f.toPairs = Ku, f.toPairsIn = Mu, f.toPath = Ag, f.toPlainObject = Hu, f.transform = dd, f.unary = sw, f.union = hS, f.unionBy = fS, f.unionWith = sS, f.uniq = pS, f.uniqBy = SS, f.uniqWith = wS, f.unset = gd, f.unzip = On, f.unzipWith = wu, f.update = Ad, f.updateWith = md, f.values = jr, f.valuesIn = Ld, f.without = dS, f.words = Gu, f.wrap = pw, f.xor = gS, f.xorBy = AS, f.xorWith = mS, f.zip = LS, f.zipObject = TS, f.zipObjectDeep = _S, f.zipWith = yS, f.entries = Ku, f.entriesIn = Mu, f.extend = Eu, f.extendWith = Fi, Zn(f, f), f.add = Lg, f.attempt = Uu, f.camelCase = kd, f.capitalize = Pu, f.ceil = Tg, f.clamp = Td, f.clone = ww, f.cloneDeep = gw, f.cloneDeepWith = Aw, f.cloneWith = dw, f.conformsTo = mw, f.deburr = Ou, f.defaultTo = $d, f.divide = _g, f.endsWith = Dd, f.eq = Ut, f.escape = Fd, f.escapeRegExp = Cd, f.every = RS, f.find = KS, f.findIndex = hu, f.findKey = Zw, f.findLast = MS, f.findLastIndex = fu, f.findLastKey = Qw, f.floor = yg, f.forEach = gu, f.forEachRight = Au, f.forIn = Vw, f.forInRight = jw, f.forOwn = $w, f.forOwnRight = ed, f.get = Yn, f.gt = Lw, f.gte = Tw, f.has = ad, f.hasIn = zn, f.head = pu, f.identity = ut, f.includes = NS, f.indexOf = Mp, f.inRange = _d, f.invoke = od, f.isArguments = Ir, f.isArray = ne, f.isArrayBuffer = _w, f.isArrayLike = ot, f.isArrayLikeObject = Re, f.isBoolean = yw, f.isBuffer = _r, f.isDate = kw, f.isElement = Dw, f.isEmpty = Fw, f.isEqual = Cw, f.isEqualWith = Bw, f.isError = Nn, f.isFinite = vw, f.isFunction = cr, f.isInteger = Fu, f.isLength = ki, f.isMap = Cu, f.isMatch = bw, f.isMatchWith = Ww, f.isNaN = Hw, f.isNative = Ew, f.isNil = Iw, f.isNull = Rw, f.isNumber = Bu, f.isObject = be, f.isObjectLike = He, f.isPlainObject = Ta, f.isRegExp = xn, f.isSafeInteger = Kw, f.isSet = vu, f.isString = Di, f.isSymbol = gt, f.isTypedArray = Vr, f.isUndefined = Mw, f.isWeakMap = Pw, f.isWeakSet = Ow, f.join = Np, f.kebabCase = Bd, f.last = Ht, f.lastIndexOf = xp, f.lowerCase = vd, f.lowerFirst = bd, f.lt = Gw, f.lte = Uw, f.max = kg, f.maxBy = Dg, f.mean = Fg, f.meanBy = Cg, f.min = Bg, f.minBy = vg, f.stubArray = Vn, f.stubFalse = jn, f.stubObject = Sg, f.stubString = wg, f.stubTrue = dg, f.multiply = bg, f.nth = Yp, f.noConflict = og, f.noop = Qn, f.now = Ti, f.pad = Wd, f.padEnd = Hd, f.padStart = Ed, f.parseInt = Rd, f.random = yd, f.reduce = qS, f.reduceRight = XS, f.repeat = Id, f.replace = Kd, f.result = pd, f.round = Wg, f.runInContext = y, f.sample = QS, f.size = $S, f.snakeCase = Md, f.some = ew, f.sortedIndex = Vp, f.sortedIndexBy = jp, f.sortedIndexOf = $p, f.sortedLastIndex = eS, f.sortedLastIndexBy = tS, f.sortedLastIndexOf = rS, f.startCase = Od, f.startsWith = Gd, f.subtract = Hg, f.sum = Eg, f.sumBy = Rg, f.template = Ud, f.times = gg, f.toFinite = hr, f.toInteger = le, f.toLength = Wu, f.toLower = Nd, f.toNumber = Et, f.toSafeInteger = Nw, f.toString = Ae, f.toUpper = xd, f.trim = Yd, f.trimEnd = zd, f.trimStart = Jd, f.truncate = qd, f.unescape = Xd, f.uniqueId = mg, f.upperCase = Zd, f.upperFirst = Jn, f.each = gu, f.eachRight = Au, f.first = pu, Zn(f, function() {
        var e = {};
        return Vt(f, function(t, a) {
          Te.call(f.prototype, a) || (e[a] = t);
        }), e;
      }(), { chain: !1 }), f.VERSION = l, Ct(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(e) {
        f[e].placeholder = f;
      }), Ct(["drop", "take"], function(e, t) {
        pe.prototype[e] = function(a) {
          a = a === i ? 1 : Ge(le(a), 0);
          var o = this.__filtered__ && !t ? new pe(this) : this.clone();
          return o.__filtered__ ? o.__takeCount__ = Ve(a, o.__takeCount__) : o.__views__.push({
            size: Ve(a, Qe),
            type: e + (o.__dir__ < 0 ? "Right" : "")
          }), o;
        }, pe.prototype[e + "Right"] = function(a) {
          return this.reverse()[e](a).reverse();
        };
      }), Ct(["filter", "map", "takeWhile"], function(e, t) {
        var a = t + 1, o = a == Be || a == Se;
        pe.prototype[e] = function(c) {
          var s = this.clone();
          return s.__iteratees__.push({
            iteratee: j(c, 3),
            type: a
          }), s.__filtered__ = s.__filtered__ || o, s;
        };
      }), Ct(["head", "last"], function(e, t) {
        var a = "take" + (t ? "Right" : "");
        pe.prototype[e] = function() {
          return this[a](1).value()[0];
        };
      }), Ct(["initial", "tail"], function(e, t) {
        var a = "drop" + (t ? "" : "Right");
        pe.prototype[e] = function() {
          return this.__filtered__ ? new pe(this) : this[a](1);
        };
      }), pe.prototype.compact = function() {
        return this.filter(ut);
      }, pe.prototype.find = function(e) {
        return this.filter(e).head();
      }, pe.prototype.findLast = function(e) {
        return this.reverse().find(e);
      }, pe.prototype.invokeMap = he(function(e, t) {
        return typeof e == "function" ? new pe(this) : this.map(function(a) {
          return wa(a, e, t);
        });
      }), pe.prototype.reject = function(e) {
        return this.filter(yi(j(e)));
      }, pe.prototype.slice = function(e, t) {
        e = le(e);
        var a = this;
        return a.__filtered__ && (e > 0 || t < 0) ? new pe(a) : (e < 0 ? a = a.takeRight(-e) : e && (a = a.drop(e)), t !== i && (t = le(t), a = t < 0 ? a.dropRight(-t) : a.take(t - e)), a);
      }, pe.prototype.takeRightWhile = function(e) {
        return this.reverse().takeWhile(e).reverse();
      }, pe.prototype.toArray = function() {
        return this.take(Qe);
      }, Vt(pe.prototype, function(e, t) {
        var a = /^(?:filter|find|map|reject)|While$/.test(t), o = /^(?:head|last)$/.test(t), c = f[o ? "take" + (t == "last" ? "Right" : "") : t], s = o || /^find/.test(t);
        c && (f.prototype[t] = function() {
          var m = this.__wrapped__, _ = o ? [1] : arguments, k = m instanceof pe, W = _[0], H = k || ne(m), E = function(se) {
            var we = c.apply(f, wr([se], _));
            return o && P ? we[0] : we;
          };
          H && a && typeof W == "function" && W.length != 1 && (k = H = !1);
          var P = this.__chain__, q = !!this.__actions__.length, $ = s && !P, ce = k && !q;
          if (!s && H) {
            m = ce ? m : new pe(this);
            var ee = e.apply(m, _);
            return ee.__actions__.push({ func: mi, args: [E], thisArg: i }), new vt(ee, P);
          }
          return $ && ce ? e.apply(this, _) : (ee = this.thru(E), $ ? o ? ee.value()[0] : ee.value() : ee);
        });
      }), Ct(["pop", "push", "shift", "sort", "splice", "unshift"], function(e) {
        var t = za[e], a = /^(?:push|sort|unshift)$/.test(e) ? "tap" : "thru", o = /^(?:pop|shift)$/.test(e);
        f.prototype[e] = function() {
          var c = arguments;
          if (o && !this.__chain__) {
            var s = this.value();
            return t.apply(ne(s) ? s : [], c);
          }
          return this[a](function(m) {
            return t.apply(ne(m) ? m : [], c);
          });
        };
      }), Vt(pe.prototype, function(e, t) {
        var a = f[t];
        if (a) {
          var o = a.name + "";
          Te.call(Jr, o) || (Jr[o] = []), Jr[o].push({ name: t, func: a });
        }
      }), Jr[si(i, I).name] = [{
        name: "wrapper",
        func: i
      }], pe.prototype.clone = Xf, pe.prototype.reverse = Zf, pe.prototype.value = Qf, f.prototype.at = DS, f.prototype.chain = FS, f.prototype.commit = CS, f.prototype.next = BS, f.prototype.plant = bS, f.prototype.reverse = WS, f.prototype.toJSON = f.prototype.valueOf = f.prototype.value = HS, f.prototype.first = f.prototype.head, ua && (f.prototype[ua] = vS), f;
    }, xr = Cf();
    Cr ? ((Cr.exports = xr)._ = xr, qi._ = xr) : ze._ = xr;
  }).call(_a);
})(Ii, Ii.exports);
var Xu = Ii.exports;
const Xg = (n) => {
  const r = po[n];
  if (!r)
    return;
  const i = [
    [r.leftXBoundary, r.lowerYBoundary],
    [r.rightXBoundary, r.upperYBoundary]
  ];
  return [
    [i[0][0], i[0][1]],
    [i[1][0], i[1][1]]
  ];
}, oo = (n) => {
  const r = Xg(n);
  if (!r)
    return;
  const i = 5, l = r[1][0] - r[0][0], u = r[1][1] - r[0][1];
  return [
    [r[0][0] + l / i, r[0][1] + u / i],
    [r[1][0] - l / i, r[1][1] - u / i]
  ];
}, ea = [];
function Zg(n, r = Xe) {
  let i;
  const l = /* @__PURE__ */ new Set();
  function u(A) {
    if (Dr(n, A) && (n = A, i)) {
      const T = !ea.length;
      for (const g of l)
        g[1](), ea.push(g, n);
      if (T) {
        for (let g = 0; g < ea.length; g += 2)
          ea[g][0](ea[g + 1]);
        ea.length = 0;
      }
    }
  }
  function h(A) {
    u(A(n));
  }
  function S(A, T = Xe) {
    const g = [A, T];
    return l.add(g), l.size === 1 && (i = r(u) || Xe), A(n), () => {
      l.delete(g), l.size === 0 && i && (i(), i = null);
    };
  }
  return { set: u, update: h, subscribe: S };
}
const Qg = Zg(null);
function Zu(n, r, i) {
  const l = n.slice();
  return l[11] = r[i], l;
}
function Qu(n) {
  let r, i, l, u, h, S, A, T = (
    /*showBounds*/
    n[0] && Vu(n)
  ), g = (
    /*platforms*/
    n[3]
  ), d = [];
  for (let D = 0; D < g.length; D += 1)
    d[D] = ju(Zu(n, g, D));
  let w = (
    /*stage*/
    n[1].getRandallPosition && $u(n)
  ), L = (
    /*offStageZone*/
    n[4] && /*showBounds*/
    n[0] && ec(n)
  );
  return {
    c() {
      T && T.c(), r = qe(), i = X("polyline"), u = qe();
      for (let D = 0; D < d.length; D += 1)
        d[D].c();
      h = qe(), w && w.c(), S = qe(), L && L.c(), A = Ue(), p(i, "points", l = /*stage*/
      n[1].mainStage.join(" "));
    },
    m(D, C) {
      T && T.m(D, C), U(D, r, C), U(D, i, C), U(D, u, C);
      for (let B = 0; B < d.length; B += 1)
        d[B] && d[B].m(D, C);
      U(D, h, C), w && w.m(D, C), U(D, S, C), L && L.m(D, C), U(D, A, C);
    },
    p(D, C) {
      if (/*showBounds*/
      D[0] ? T ? T.p(D, C) : (T = Vu(D), T.c(), T.m(r.parentNode, r)) : T && (T.d(1), T = null), C & /*stage*/
      2 && l !== (l = /*stage*/
      D[1].mainStage.join(" ")) && p(i, "points", l), C & /*platforms*/
      8) {
        g = /*platforms*/
        D[3];
        let B;
        for (B = 0; B < g.length; B += 1) {
          const v = Zu(D, g, B);
          d[B] ? d[B].p(v, C) : (d[B] = ju(v), d[B].c(), d[B].m(h.parentNode, h));
        }
        for (; B < d.length; B += 1)
          d[B].d(1);
        d.length = g.length;
      }
      /*stage*/
      D[1].getRandallPosition ? w ? w.p(D, C) : (w = $u(D), w.c(), w.m(S.parentNode, S)) : w && (w.d(1), w = null), /*offStageZone*/
      D[4] && /*showBounds*/
      D[0] ? L ? L.p(D, C) : (L = ec(D), L.c(), L.m(A.parentNode, A)) : L && (L.d(1), L = null);
    },
    d(D) {
      T && T.d(D), D && G(r), D && G(i), D && G(u), ia(d, D), D && G(h), w && w.d(D), D && G(S), L && L.d(D), D && G(A);
    }
  };
}
function Vu(n) {
  let r, i, l, u, h;
  return {
    c() {
      r = X("rect"), p(r, "x", i = /*stage*/
      n[1].blastZones[0][0]), p(r, "y", l = /*stage*/
      n[1].blastZones[0][1]), p(r, "width", u = /*stage*/
      n[1].blastZones[1][0] - /*stage*/
      n[1].blastZones[0][0]), p(r, "height", h = /*stage*/
      n[1].blastZones[1][1] - /*stage*/
      n[1].blastZones[0][1]);
    },
    m(S, A) {
      U(S, r, A);
    },
    p(S, A) {
      A & /*stage*/
      2 && i !== (i = /*stage*/
      S[1].blastZones[0][0]) && p(r, "x", i), A & /*stage*/
      2 && l !== (l = /*stage*/
      S[1].blastZones[0][1]) && p(r, "y", l), A & /*stage*/
      2 && u !== (u = /*stage*/
      S[1].blastZones[1][0] - /*stage*/
      S[1].blastZones[0][0]) && p(r, "width", u), A & /*stage*/
      2 && h !== (h = /*stage*/
      S[1].blastZones[1][1] - /*stage*/
      S[1].blastZones[0][1]) && p(r, "height", h);
    },
    d(S) {
      S && G(r);
    }
  };
}
function ju(n) {
  let r, i;
  return {
    c() {
      r = X("polyline"), p(r, "points", i = /*platform*/
      n[11].join(" "));
    },
    m(l, u) {
      U(l, r, u);
    },
    p(l, u) {
      u & /*platforms*/
      8 && i !== (i = /*platform*/
      l[11].join(" ")) && p(r, "points", i);
    },
    d(l) {
      l && G(r);
    }
  };
}
function $u(n) {
  let r, i;
  return {
    c() {
      var l, u, h;
      r = X("polyline"), p(r, "points", i = /*stage*/
      (h = (u = n[1]) == null ? void 0 : u.getRandallPosition(
        /*effFrame*/
        ((l = n[2]) == null ? void 0 : l.frame) ?? 0
      )) == null ? void 0 : h.join(" "));
    },
    m(l, u) {
      U(l, r, u);
    },
    p(l, u) {
      var h, S, A;
      u & /*stage, effFrame*/
      6 && i !== (i = /*stage*/
      (A = (S = l[1]) == null ? void 0 : S.getRandallPosition(
        /*effFrame*/
        ((h = l[2]) == null ? void 0 : h.frame) ?? 0
      )) == null ? void 0 : A.join(" ")) && p(r, "points", i);
    },
    d(l) {
      l && G(r);
    }
  };
}
function ec(n) {
  let r, i, l, u, h;
  return {
    c() {
      r = X("rect"), p(r, "class", "opacity-50"), p(r, "x", i = /*offStageZone*/
      n[4][0][0]), p(r, "y", l = /*offStageZone*/
      n[4][0][1]), p(r, "width", u = /*offStageZone*/
      n[4][1][0] - /*offStageZone*/
      n[4][0][0]), p(r, "height", h = /*offStageZone*/
      n[4][1][1] - /*offStageZone*/
      n[4][0][1]);
    },
    m(S, A) {
      U(S, r, A);
    },
    p(S, A) {
      A & /*offStageZone*/
      16 && i !== (i = /*offStageZone*/
      S[4][0][0]) && p(r, "x", i), A & /*offStageZone*/
      16 && l !== (l = /*offStageZone*/
      S[4][0][1]) && p(r, "y", l), A & /*offStageZone*/
      16 && u !== (u = /*offStageZone*/
      S[4][1][0] - /*offStageZone*/
      S[4][0][0]) && p(r, "width", u), A & /*offStageZone*/
      16 && h !== (h = /*offStageZone*/
      S[4][1][1] - /*offStageZone*/
      S[4][0][1]) && p(r, "height", h);
    },
    d(S) {
      S && G(r);
    }
  };
}
function Vg(n) {
  let r = !Xu.isNil(
    /*stage*/
    n[1]
  ), i, l = r && Qu(n);
  return {
    c() {
      l && l.c(), i = Ue();
    },
    m(u, h) {
      l && l.m(u, h), U(u, i, h);
    },
    p(u, [h]) {
      h & /*stage*/
      2 && (r = !Xu.isNil(
        /*stage*/
        u[1]
      )), r ? l ? l.p(u, h) : (l = Qu(u), l.c(), l.m(i.parentNode, i)) : l && (l.d(1), l = null);
    },
    i: Xe,
    o: Xe,
    d(u) {
      l && l.d(u), u && G(i);
    }
  };
}
const tc = 2, jg = 0.80625, rc = 16.125, ac = 22.125;
function ic(n, r) {
  return n.map((i) => `${i.split(",")[0].trim()}, ${r}`);
}
function $g(n, r, i) {
  let l, u, h, S, A;
  Mg(n, Qg, (C) => i(10, A = C));
  let { showBounds: T = !0 } = r, { stageId: g } = r, { frame: d = void 0 } = r, w = rc, L = ac, D = null;
  return n.$$set = (C) => {
    "showBounds" in C && i(0, T = C.showBounds), "stageId" in C && i(5, g = C.stageId), "frame" in C && i(6, d = C.frame);
  }, n.$$.update = () => {
    if (n.$$.dirty & /*stageId*/
    32 && i(1, l = po[g]), n.$$.dirty & /*stageId*/
    32 && i(4, u = oo(g)), n.$$.dirty & /*frame, $gameFrame*/
    1088 && i(2, h = d ?? A), n.$$.dirty & /*stageId, effFrame, lastFodFrame*/
    548 && g === tc && h) {
      const C = h.frame ?? 0;
      (D === null || C < D) && (i(7, w = rc), i(8, L = ac)), i(9, D = C);
      const B = h.stageEvents ?? [];
      for (const v of B)
        if (v && v.height != null && v.platform != null) {
          const I = v.height * jg;
          v.platform === 1 ? i(7, w = I) : v.platform === 0 && i(8, L = I);
        }
    }
    n.$$.dirty & /*stage, stageId, fodLeftY, fodRightY*/
    418 && i(3, S = (() => {
      if (!(l != null && l.platforms))
        return [];
      if (g !== tc)
        return l.platforms;
      const C = l.platforms.map((B) => [...B]);
      return C[0] && (C[0] = ic(l.platforms[0], w)), C[1] && (C[1] = ic(l.platforms[1], L)), C;
    })());
  }, [
    T,
    l,
    h,
    S,
    u,
    g,
    d,
    w,
    L,
    D,
    A
  ];
}
class e0 extends Ea {
  constructor(r) {
    super(), Ha(this, r, $g, Vg, Dr, { showBounds: 0, stageId: 5, frame: 6 });
  }
}
const So = [
  "Captain Falcon",
  // 0, 0x0
  "Donkey Kong",
  // 1, 0x1
  "Fox",
  // 2, 0x2
  "Mr. Game & Watch",
  // 3, 0x3
  "Kirby",
  // 4, 0x4
  "Bowser",
  // 5, 0x5
  "Link",
  // 6, 0x6
  "Luigi",
  // 7, 0x7
  "Mario",
  // 8, 0x8
  "Marth",
  // 9, 0x9
  "Mewtwo",
  // 10, 0xa
  "Ness",
  // 11, 0xb
  "Peach",
  // 12, 0xc
  "Pikachu",
  // 13, 0xd
  "Ice Climbers",
  // 14, 0xe
  "Jigglypuff",
  // 15, 0xf
  "Samus",
  // 16, 0x10
  "Yoshi",
  // 17, 0x11
  "Zelda",
  // 18, 0x12
  "Sheik",
  // 19, 0x13
  "Falco",
  // 20, 0x14
  "Young Link",
  // 21, 0x15
  "Dr. Mario",
  // 22, 0x16
  "Roy",
  // 23, 0x17
  "Pichu",
  // 24, 0x18
  "Ganondorf",
  // 25, 0x19
  "Master Hand",
  // 26, 0x1a
  "Wireframe Male",
  // 27, 0x1b
  "Wireframe Female",
  // 28, 0x1c
  "Giga Bowser",
  // 29, 0x1d
  "Crazy Hand",
  // 30, 0x1e
  "Sandbag",
  // 31, 0x1f
  "Popo"
  // 32, 0x20
], Mi = [
  "Mario",
  // 0, 0x0
  "Fox",
  // 1, 0x1
  "Captain Falcon",
  // 2, 0x2
  "Donkey Kong",
  // 3, 0x3
  "Kirby",
  // 4, 0x4
  "Bowser",
  // 5, 0x5
  "Link",
  // 6, 0x6
  "Sheik",
  // 7, 0x7
  "Ness",
  // 8, 0x8
  "Peach",
  // 9, 0x9
  "Popo",
  // 10, 0xa
  "Nana",
  // 11, 0xb
  "Pikachu",
  // 12, 0xc
  "Samus",
  // 13, 0xd
  "Yoshi",
  // 14, 0xe
  "Jigglypuff",
  // 15, 0xf
  "Mewtwo",
  // 16, 0x10
  "Luigi",
  // 17, 0x11
  "Marth",
  // 18, 0x12
  "Zelda",
  // 19, 0x13
  "Young Link",
  // 20, 0x14
  "Dr. Mario",
  // 21, 0x15
  "Falco",
  // 22, 0x16
  "Pichu",
  // 23, 0x17
  "Mr. Game & Watch",
  // 24, 0x18
  "Ganondorf",
  // 25, 0x19
  "Roy",
  // 26, 0x1a
  "Master Hand",
  // 27, 0x1b
  "Crazy Hand",
  // 28, 0x1c
  "Wireframe Male (Boy)",
  // 29, 0x1d
  "Wireframe Female (Girl)",
  // 30, 0x1e
  "Giga Bowser",
  // 31, 0x1f
  "Sandbag"
  // 32, 0x20
], t0 = [
  "DeadDown",
  // 0, 0x0
  "DeadLeft",
  // 1, 0x1
  "DeadRight",
  // 2, 0x2
  "DeadUp",
  // 3, 0x3
  "DeadUpStar",
  // 4, 0x4
  "DeadUpStarIce",
  // 5, 0x5
  "DeadUpFall",
  // 6, 0x6
  "DeadUpFallHitCamera",
  // 7, 0x7
  "DeadUpFallHitCameraFlat",
  // 8, 0x8
  "DeadUpFallIce",
  // 9, 0x9
  "DeadUpFallHitCameraIce",
  // 10, 0xa
  "Sleep",
  // 11, 0xb
  "Rebirth",
  // 12, 0xc
  "RebirthWait",
  // 13, 0xd
  "Wait",
  // 14, 0xe
  "WalkSlow",
  // 15, 0xf
  "WalkMiddle",
  // 16, 0x10
  "WalkFast",
  // 17, 0x11
  "Turn",
  // 18, 0x12
  "TurnRun",
  // 19, 0x13
  "Dash",
  // 20, 0x14
  "Run",
  // 21, 0x15
  "RunDirect",
  // 22, 0x16
  "RunBrake",
  // 23, 0x17
  "KneeBend",
  // 24, 0x18
  "JumpF",
  // 25, 0x19
  "JumpB",
  // 26, 0x1a
  "JumpAerialF",
  // 27, 0x1b
  "JumpAerialB",
  // 28, 0x1c
  "Fall",
  // 29, 0x1d
  "FallF",
  // 30, 0x1e
  "FallB",
  // 31, 0x1f
  "FallAerial",
  // 32, 0x20
  "FallAerialF",
  // 33, 0x21
  "FallAerialB",
  // 34, 0x22
  "FallSpecial",
  // 35, 0x23
  "FallSpecialF",
  // 36, 0x24
  "FallSpecialB",
  // 37, 0x25
  "DamageFall",
  // 38, 0x26
  "Squat",
  // 39, 0x27
  "SquatWait",
  // 40, 0x28
  "SquatRv",
  // 41, 0x29
  "Landing",
  // 42, 0x2a
  "LandingFallSpecial",
  // 43, 0x2b
  "Attack11",
  // 44, 0x2c
  "Attack12",
  // 45, 0x2d
  "Attack13",
  // 46, 0x2e
  "Attack100Start",
  // 47, 0x2f
  "Attack100Loop",
  // 48, 0x30
  "Attack100End",
  // 49, 0x31
  "AttackDash",
  // 50, 0x32
  "AttackS3Hi",
  // 51, 0x33
  "AttackS3HiS",
  // 52, 0x34
  "AttackS3S",
  // 53, 0x35
  "AttackS3LwS",
  // 54, 0x36
  "AttackS3Lw",
  // 55, 0x37
  "AttackHi3",
  // 56, 0x38
  "AttackLw3",
  // 57, 0x39
  "AttackS4Hi",
  // 58, 0x3a
  "AttackS4HiS",
  // 59, 0x3b
  "AttackS4S",
  // 60, 0x3c
  "AttackS4LwS",
  // 61, 0x3d
  "AttackS4Lw",
  // 62, 0x3e
  "AttackHi4",
  // 63, 0x3f
  "AttackLw4",
  // 64, 0x40
  "AttackAirN",
  // 65, 0x41
  "AttackAirF",
  // 66, 0x42
  "AttackAirB",
  // 67, 0x43
  "AttackAirHi",
  // 68, 0x44
  "AttackAirLw",
  // 69, 0x45
  "LandingAirN",
  // 70, 0x46
  "LandingAirF",
  // 71, 0x47
  "LandingAirB",
  // 72, 0x48
  "LandingAirHi",
  // 73, 0x49
  "LandingAirLw",
  // 74, 0x4a
  "DamageHi1",
  // 75, 0x4b
  "DamageHi2",
  // 76, 0x4c
  "DamageHi3",
  // 77, 0x4d
  "DamageN1",
  // 78, 0x4e
  "DamageN2",
  // 79, 0x4f
  "DamageN3",
  // 80, 0x50
  "DamageLw1",
  // 81, 0x51
  "DamageLw2",
  // 82, 0x52
  "DamageLw3",
  // 83, 0x53
  "DamageAir1",
  // 84, 0x54
  "DamageAir2",
  // 85, 0x55
  "DamageAir3",
  // 86, 0x56
  "DamageFlyHi",
  // 87, 0x57
  "DamageFlyN",
  // 88, 0x58
  "DamageFlyLw",
  // 89, 0x59
  "DamageFlyTop",
  // 90, 0x5a
  "DamageFlyRoll",
  // 91, 0x5b
  "LightGet",
  // 92, 0x5c
  "HeavyGet",
  // 93, 0x5d
  "LightThrowF",
  // 94, 0x5e
  "LightThrowB",
  // 95, 0x5f
  "LightThrowHi",
  // 96, 0x60
  "LightThrowLw",
  // 97, 0x61
  "LightThrowDash",
  // 98, 0x62
  "LightThrowDrop",
  // 99, 0x63
  "LightThrowAirF",
  // 100, 0x64
  "LightThrowAirB",
  // 101, 0x65
  "LightThrowAirHi",
  // 102, 0x66
  "LightThrowAirLw",
  // 103, 0x67
  "HeavyThrowF",
  // 104, 0x68
  "HeavyThrowB",
  // 105, 0x69
  "HeavyThrowHi",
  // 106, 0x6a
  "HeavyThrowLw",
  // 107, 0x6b
  "LightThrowF4",
  // 108, 0x6c
  "LightThrowB4",
  // 109, 0x6d
  "LightThrowHi4",
  // 110, 0x6e
  "LightThrowLw4",
  // 111, 0x6f
  "LightThrowAirF4",
  // 112, 0x70
  "LightThrowAirB4",
  // 113, 0x71
  "LightThrowAirHi4",
  // 114, 0x72
  "LightThrowAirLw4",
  // 115, 0x73
  "HeavyThrowF4",
  // 116, 0x74
  "HeavyThrowB4",
  // 117, 0x75
  "HeavyThrowHi4",
  // 118, 0x76
  "HeavyThrowLw4",
  // 119, 0x77
  "SwordSwing1",
  // 120, 0x78
  "SwordSwing3",
  // 121, 0x79
  "SwordSwing4",
  // 122, 0x7a
  "SwordSwingDash",
  // 123, 0x7b
  "BatSwing1",
  // 124, 0x7c
  "BatSwing3",
  // 125, 0x7d
  "BatSwing4",
  // 126, 0x7e
  "BatSwingDash",
  // 127, 0x7f
  "ParasolSwing1",
  // 128, 0x80
  "ParasolSwing3",
  // 129, 0x81
  "ParasolSwing4",
  // 130, 0x82
  "ParasolSwingDash",
  // 131, 0x83
  "HarisenSwing1",
  // 132, 0x84
  "HarisenSwing3",
  // 133, 0x85
  "HarisenSwing4",
  // 134, 0x86
  "HarisenSwingDash",
  // 135, 0x87
  "StarRodSwing1",
  // 136, 0x88
  "StarRodSwing3",
  // 137, 0x89
  "StarRodSwing4",
  // 138, 0x8a
  "StarRodSwingDash",
  // 139, 0x8b
  "LipStickSwing1",
  // 140, 0x8c
  "LipStickSwing3",
  // 141, 0x8d
  "LipStickSwing4",
  // 142, 0x8e
  "LipStickSwingDash",
  // 143, 0x8f
  "ItemParasolOpen",
  // 144, 0x90
  "ItemParasolFall",
  // 145, 0x91
  "ItemParasolFallSpecial",
  // 146, 0x92
  "ItemParasolDamageFall",
  // 147, 0x93
  "LGunShoot",
  // 148, 0x94
  "LGunShootAir",
  // 149, 0x95
  "LGunShootEmpty",
  // 150, 0x96
  "LGunShootAirEmpty",
  // 151, 0x97
  "FireFlowerShoot",
  // 152, 0x98
  "FireFlowerShootAir",
  // 153, 0x99
  "ItemScrew",
  // 154, 0x9a
  "ItemScrewAir",
  // 155, 0x9b
  "DamageScrew",
  // 156, 0x9c
  "DamageScrewAir",
  // 157, 0x9d
  "ItemScopeStart",
  // 158, 0x9e
  "ItemScopeRapid",
  // 159, 0x9f
  "ItemScopeFire",
  // 160, 0xa0
  "ItemScopeEnd",
  // 161, 0xa1
  "ItemScopeAirStart",
  // 162, 0xa2
  "ItemScopeAirRapid",
  // 163, 0xa3
  "ItemScopeAirFire",
  // 164, 0xa4
  "ItemScopeAirEnd",
  // 165, 0xa5
  "ItemScopeStartEmpty",
  // 166, 0xa6
  "ItemScopeRapidEmpty",
  // 167, 0xa7
  "ItemScopeFireEmpty",
  // 168, 0xa8
  "ItemScopeEndEmpty",
  // 169, 0xa9
  "ItemScopeAirStartEmpty",
  // 170, 0xaa
  "ItemScopeAirRapidEmpty",
  // 171, 0xab
  "ItemScopeAirFireEmpty",
  // 172, 0xac
  "ItemScopeAirEndEmpty",
  // 173, 0xad
  "LiftWait",
  // 174, 0xae
  "LiftWalk1",
  // 175, 0xaf
  "LiftWalk2",
  // 176, 0xb0
  "LiftTurn",
  // 177, 0xb1
  "GuardOn",
  // 178, 0xb2
  "Guard",
  // 179, 0xb3
  "GuardOff",
  // 180, 0xb4
  "GuardSetOff",
  // 181, 0xb5
  "GuardReflect",
  // 182, 0xb6
  "DownBoundU",
  // 183, 0xb7
  "DownWaitU",
  // 184, 0xb8
  "DownDamageU",
  // 185, 0xb9
  "DownStandU",
  // 186, 0xba
  "DownAttackU",
  // 187, 0xbb
  "DownFowardU",
  // 188, 0xbc
  "DownBackU",
  // 189, 0xbd
  "DownSpotU",
  // 190, 0xbe
  "DownBoundD",
  // 191, 0xbf
  "DownWaitD",
  // 192, 0xc0
  "DownDamageD",
  // 193, 0xc1
  "DownStandD",
  // 194, 0xc2
  "DownAttackD",
  // 195, 0xc3
  "DownFowardD",
  // 196, 0xc4
  "DownBackD",
  // 197, 0xc5
  "DownSpotD",
  // 198, 0xc6
  "Passive",
  // 199, 0xc7
  "PassiveStandF",
  // 200, 0xc8
  "PassiveStandB",
  // 201, 0xc9
  "PassiveWall",
  // 202, 0xca
  "PassiveWallJump",
  // 203, 0xcb
  "PassiveCeil",
  // 204, 0xcc
  "ShieldBreakFly",
  // 205, 0xcd
  "ShieldBreakFall",
  // 206, 0xce
  "ShieldBreakDownU",
  // 207, 0xcf
  "ShieldBreakDownD",
  // 208, 0xd0
  "ShieldBreakStandU",
  // 209, 0xd1
  "ShieldBreakStandD",
  // 210, 0xd2
  "FuraFura",
  // 211, 0xd3
  "Catch",
  // 212, 0xd4
  "CatchPull",
  // 213, 0xd5
  "CatchDash",
  // 214, 0xd6
  "CatchDashPull",
  // 215, 0xd7
  "CatchWait",
  // 216, 0xd8
  "CatchAttack",
  // 217, 0xd9
  "CatchCut",
  // 218, 0xda
  "ThrowF",
  // 219, 0xdb
  "ThrowB",
  // 220, 0xdc
  "ThrowHi",
  // 221, 0xdd
  "ThrowLw",
  // 222, 0xde
  "CapturePulledHi",
  // 223, 0xdf
  "CaptureWaitHi",
  // 224, 0xe0
  "CaptureDamageHi",
  // 225, 0xe1
  "CapturePulledLw",
  // 226, 0xe2
  "CaptureWaitLw",
  // 227, 0xe3
  "CaptureDamageLw",
  // 228, 0xe4
  "CaptureCut",
  // 229, 0xe5
  "CaptureJump",
  // 230, 0xe6
  "CaptureNeck",
  // 231, 0xe7
  "CaptureFoot",
  // 232, 0xe8
  "EscapeF",
  // 233, 0xe9
  "EscapeB",
  // 234, 0xea
  "Escape",
  // 235, 0xeb
  "EscapeAir",
  // 236, 0xec
  "ReboundStop",
  // 237, 0xed
  "Rebound",
  // 238, 0xee
  "ThrownF",
  // 239, 0xef
  "ThrownB",
  // 240, 0xf0
  "ThrownHi",
  // 241, 0xf1
  "ThrownLw",
  // 242, 0xf2
  "ThrownLwWomen",
  // 243, 0xf3
  "Pass",
  // 244, 0xf4
  "Ottotto",
  // 245, 0xf5
  "OttottoWait",
  // 246, 0xf6
  "FlyReflectWall",
  // 247, 0xf7
  "FlyReflectCeil",
  // 248, 0xf8
  "StopWall",
  // 249, 0xf9
  "StopCeil",
  // 250, 0xfa
  "MissFoot",
  // 251, 0xfb
  "CliffCatch",
  // 252, 0xfc
  "CliffWait",
  // 253, 0xfd
  "CliffClimbSlow",
  // 254, 0xfe
  "CliffClimbQuick",
  // 255, 0xff
  "CliffAttackSlow",
  // 256, 0x100
  "CliffAttackQuick",
  // 257, 0x101
  "CliffEscapeSlow",
  // 258, 0x102
  "CliffEscapeQuick",
  // 259, 0x103
  "CliffJumpSlow1",
  // 260, 0x104
  "CliffJumpSlow2",
  // 261, 0x105
  "CliffJumpQuick1",
  // 262, 0x106
  "CliffJumpQuick2",
  // 263, 0x107
  "AppealR",
  // 264, 0x108
  "AppealL",
  // 265, 0x109
  "ShoulderedWait",
  // 266, 0x10a
  "ShoulderedWalkSlow",
  // 267, 0x10b
  "ShoulderedWalkMiddle",
  // 268, 0x10c
  "ShoulderedWalkFast",
  // 269, 0x10d
  "ShoulderedTurn",
  // 270, 0x10e
  "ThrownFF",
  // 271, 0x10f
  "ThrownFB",
  // 272, 0x110
  "ThrownFHi",
  // 273, 0x111
  "ThrownFLw",
  // 274, 0x112
  "CaptureCaptain",
  // 275, 0x113
  "CaptureYoshi",
  // 276, 0x114
  "YoshiEgg",
  // 277, 0x115
  "CaptureKoopa",
  // 278, 0x116
  "CaptureDamageKoopa",
  // 279, 0x117
  "CaptureWaitKoopa",
  // 280, 0x118
  "ThrownKoopaF",
  // 281, 0x119
  "ThrownKoopaB",
  // 282, 0x11a
  "CaptureKoopaAir",
  // 283, 0x11b
  "CaptureDamageKoopaAir",
  // 284, 0x11c
  "CaptureWaitKoopaAir",
  // 285, 0x11d
  "ThrownKoopaAirF",
  // 286, 0x11e
  "ThrownKoopaAirB",
  // 287, 0x11f
  "CaptureKirby",
  // 288, 0x120
  "CaptureWaitKirby",
  // 289, 0x121
  "ThrownKirbyStar",
  // 290, 0x122
  "ThrownCopyStar",
  // 291, 0x123
  "ThrownKirby",
  // 292, 0x124
  "BarrelWait",
  // 293, 0x125
  "Bury",
  // 294, 0x126
  "BuryWait",
  // 295, 0x127
  "BuryJump",
  // 296, 0x128
  "DamageSong",
  // 297, 0x129
  "DamageSongWait",
  // 298, 0x12a
  "DamageSongRv",
  // 299, 0x12b
  "DamageBind",
  // 300, 0x12c
  "CaptureMewtwo",
  // 301, 0x12d
  "CaptureMewtwoAir",
  // 302, 0x12e
  "ThrownMewtwo",
  // 303, 0x12f
  "ThrownMewtwoAir",
  // 304, 0x130
  "WarpStarJump",
  // 305, 0x131
  "WarpStarFall",
  // 306, 0x132
  "HammerWait",
  // 307, 0x133
  "HammerWalk",
  // 308, 0x134
  "HammerTurn",
  // 309, 0x135
  "HammerKneeBend",
  // 310, 0x136
  "HammerFall",
  // 311, 0x137
  "HammerJump",
  // 312, 0x138
  "HammerLanding",
  // 313, 0x139
  "KinokoGiantStart",
  // 314, 0x13a
  "KinokoGiantStartAir",
  // 315, 0x13b
  "KinokoGiantEnd",
  // 316, 0x13c
  "KinokoGiantEndAir",
  // 317, 0x13d
  "KinokoSmallStart",
  // 318, 0x13e
  "KinokoSmallStartAir",
  // 319, 0x13f
  "KinokoSmallEnd",
  // 320, 0x140
  "KinokoSmallEndAir",
  // 321, 0x141
  "Entry",
  // 322, 0x142
  "EntryStart",
  // 323, 0x143
  "EntryEnd",
  // 324, 0x144
  "DamageIce",
  // 325, 0x145
  "DamageIceJump",
  // 326, 0x146
  "CaptureMasterhand",
  // 327, 0x147
  "CapturedamageMasterhand",
  // 328, 0x148
  "CapturewaitMasterhand",
  // 329, 0x149
  "ThrownMasterhand",
  // 330, 0x14a
  "CaptureKirbyYoshi",
  // 331, 0x14b
  "KirbyYoshiEgg",
  // 332, 0x14c
  "CaptureLeadead",
  // 333, 0x14d
  "CaptureLikelike",
  // 334, 0x14e
  "DownReflect",
  // 335, 0x14f
  "CaptureCrazyhand",
  // 336, 0x150
  "CapturedamageCrazyhand",
  // 337, 0x151
  "CapturewaitCrazyhand",
  // 338, 0x152
  "ThrownCrazyhand",
  // 339, 0x153
  "BarrelCannonWait"
  // 340, 0x154
], r0 = [
  // Basic Items
  "Capsule",
  // 0x00
  "Box",
  // 0x01
  "Barrel (Taru)",
  // 0x02
  "Egg",
  // 0x03
  "Party Ball (Kusudama)",
  // 0x04
  "Barrel Cannon (TaruCann)",
  // 0x05
  "Bob-omb (BombHei)",
  // 0x06
  "Mr. Saturn (Dosei)",
  // 0x07
  "Heart Container",
  // 0x08
  "Maxim Tomato",
  // 0x09
  "Starman (Super Star)",
  // 0x0A
  "Home-Run Bat",
  // 0x0B
  "Beam Sword",
  // 0x0C
  "Parasol",
  // 0x0D
  "Green Shell (G Shell)",
  // 0x0E
  "Red Shell (R Shell)",
  // 0x0F
  "Ray Gun (L Gun)",
  // 0x10
  "Freezie (Freeze)",
  // 0x11
  "Food",
  // 0x12
  "Proximity Mine (MSBomb)",
  // 0x13
  "Flipper",
  // 0x14
  "Super Scope (S Scope)",
  // 0x15
  "Star Rod",
  // 0x16
  "Lip's Stick",
  // 0x17
  "Fan (Harisen)",
  // 0x18
  "Fire Flower (F Flower)",
  // 0x19
  "Super Mushroom (Kinoko)",
  // 0x1A
  "",
  // 0x1B
  "",
  // 0x1C
  "Warp Star (WStar)",
  // 0x1D
  "Screw Attack (ScBall)",
  // 0x1E
  "Bunny Hood (RabbitC)",
  // 0x1F
  "Metal Box (MetalB)",
  // 0x20
  "Cloaking Device (SpyCloak)",
  // 0x21
  "Poké Ball (M Ball)",
  // 0x22
  // Item Related
  "Ray Gun recoil effect",
  // 0x23
  "Star Rod Star",
  // 0x24
  "Lips Stick Dust",
  // 0x25
  "Super Scope Beam",
  // 0x26
  "Ray Gun Beam",
  // 0x27
  "Hammer Head",
  // 0x28
  "Flower",
  // 0x29
  "Yoshi's egg (Event)",
  // 0x2A
  // Monsters Part 1
  "Goomba (DKuriboh)",
  // 0x2B
  "Redead (Leadead)",
  // 0x2C
  "Octarok (Octarock)",
  // 0x2D
  "Ottosea",
  // 0x2E
  "Stone(Octarok Projectile)",
  // 0x2F
  // Character Related
  "Mario's fire",
  // 0x30
  "",
  // 0x31
  "Kirby's Cutter beam",
  // 0x32
  "Kirby's Hammer",
  // 0x33
  "",
  // 0x34
  "",
  // 0x35
  "Fox's Laser",
  // 0x36
  "Falco's Laser",
  // 0x37
  "Fox's shadow",
  // 0x38
  "Falco's shadow",
  // 0x39
  "Link's bomb",
  // 0x3A
  "Young Link's bomb",
  // 0x3B
  "Link's boomerang",
  // 0x3C
  "Young Link's boomerang",
  // 0x3D
  "Link's Hookshot",
  // 0x3E
  "Young Link's Hookshot",
  // 0x3F
  "Arrow",
  // 0x40
  "Fire Arrow",
  // 0x41
  "PK Fire",
  // 0x42
  "PK Flash",
  // 0x43
  "PK Flash",
  // 0x44
  "PK Thunder (Primary)",
  // 0x45
  "PK Thunder",
  // 0x46
  "PK Thunder",
  // 0x47
  "PK Thunder",
  // 0x48
  "PK Thunder",
  // 0x49
  "Fox's Blaster",
  // 0x4A
  "Falco's Blaster",
  // 0x4B
  "Link's Arrow",
  // 0x4C
  "Young Link's arrow",
  // 0x4D
  "PK Flash (explosion)",
  // 0x4E
  "Needle(thrown)",
  // 0x4F
  "Needle",
  // 0x50
  "Pikachu's Thunder",
  // 0x51
  "Pichu's Thunder",
  // 0x52
  "Mario's cape",
  // 0x53
  "Dr.Mario's cape",
  // 0x54
  "Smoke (Sheik)",
  // 0x55
  "Yoshi's egg(thrown)",
  // 0x56
  "Yoshi's Tongue??",
  // 0x57
  "Yoshi's Star",
  // 0x58
  "Pikachu's thunder (B)",
  // 0x59
  "Pikachu's thunder (B)",
  // 0x5A
  "Pichu's thunder (B)",
  // 0x5B
  "Pichu's thunder (B)",
  // 0x5C
  "Samus's bomb",
  // 0x5D
  "Samus's chargeshot",
  // 0x5E
  "Missile",
  // 0x5F
  "Grapple beam",
  // 0x60
  "Sheik's chain",
  // 0x61
  "",
  // 0x62
  "Turnip",
  // 0x63
  "Bowser's flame",
  // 0x64
  "Ness's bat",
  // 0x65
  "Yoyo",
  // 0x66
  "Peach's parasol",
  // 0x67
  "Toad",
  // 0x68
  "Luigi's fire",
  // 0x69
  "Ice(Iceclimbers)",
  // 0x6A
  "Blizzard",
  // 0x6B
  "Zelda's fire",
  // 0x6C
  "Zelda's fire (explosion)",
  // 0x6D
  "",
  // 0x6E
  "Toad's spore",
  // 0x6F
  "Mewtwo's Shadowball",
  // 0x70
  "Iceclimbers' UpB",
  // 0x71
  "Pesticide",
  // 0x72
  "Manhole",
  // 0x73
  "Fire(G&W)",
  // 0x74
  "Parashute",
  // 0x75
  "Turtle",
  // 0x76
  "Sperky",
  // 0x77
  "Judge",
  // 0x78
  "",
  // 0x79
  "Sausage",
  // 0x7A
  "Milk (Young Link)",
  // 0x7B
  "Firefighter(G&W)",
  // 0x7C
  "Masterhand's Laser",
  // 0x7D
  "Masterhand's Bullet",
  // 0x7E
  "Crazyhand's Laser",
  // 0x7F
  "Crazyhand's Bullet",
  // 0x80
  "Crazyhand's Bomb",
  // 0x81
  "Kirby copy Mario's Fire (B)",
  // 0x82
  "Kirby copy Dr. Mario's Capsule (B)",
  // 0x83
  "Kirby copy Luigi's Fire (B)",
  // 0x84
  "Kirby copy IceClimber's IceCube (B)",
  // 0x85
  "Kirby copy Peach's Toad (B)",
  // 0x86
  "Kirby copy Toad's Spore (B)",
  // 0x87
  "Kirby copy Fox's Laser (B)",
  // 0x88
  "Kirby copy Falco's Laser (B)",
  // 0x89
  "Kirby copy Fox's Blaster (B)",
  // 0x8A
  "Kirby copy Falco's Blaster (B)",
  // 0x8B
  "Kirby copy Link's Arrow (B)",
  // 0x8C
  "Kirby copy Young Link's Arrow (B)",
  // 0x8D
  "Kirby copy Link's Arrow (B)",
  // 0x8E
  "Kirby copy Young Link's Arrow (B)",
  // 0x8F
  "Kirby copy Mewtwo's Shadowball (B)",
  // 0x90
  "Kirby copy PK Flash (B)",
  // 0x91
  "Kirby copy PK Flash Explosion (B)",
  // 0x92
  "Kirby copy Pikachu's Thunder (B)",
  // 0x93
  "Kirby copy Pikachu's Thunder (B)",
  // 0x94
  "Kirby copy Pichu's Thunder (B)",
  // 0x95
  "Kirby copy Pichu's Thunder (B)",
  // 0x96
  "Kirby copy Samus' Chargeshot (B)",
  // 0x97
  "Kirby copy Sheik's Needle (thrown) (B)",
  // 0x98
  "Kirby copy Sheik's Needle (ground) (B)",
  // 0x99
  "Kirby copy Bowser's Flame (B)",
  // 0x9A
  "Kirby copy Mr. Game & Watch's Sausage (B)",
  // 0x9B
  "(unique)",
  // 0x9C
  "Yoshi's Tongue?? (B)",
  // 0x9D
  "(unique)",
  // 0x9E
  "Coin",
  // 0x9F
  // Pokemon
  "Random Pokemon",
  // 0xA0
  "Goldeen (Tosakinto)",
  // 0xA1
  "Chicorita",
  // 0xA2
  "Snorlax",
  // 0xA3
  "Blastoise",
  // 0xA4
  "Weezing (Matadogas)",
  // 0xA5
  "Charizard (Lizardon)",
  // 0xA6
  "Moltres",
  // 0xA7
  "Zapdos",
  // 0xA8
  "Articuno",
  // 0xA9
  "Wobbuffet",
  // 0xAA
  "Scizor",
  // 0xAB
  "Unown",
  // 0xAC
  "Entei",
  // 0xAD
  "Raikou",
  // 0xAE
  "Suicune",
  // 0xAF
  "Bellossom (Kireihana)",
  // 0xB0
  "Electrode (Marumine)",
  // 0xB1
  "Lugia",
  // 0xB2
  "Ho-oh",
  // 0xB3
  "Ditto (Metamon)",
  // 0xB4
  "Clefairy",
  // 0xB5
  "Togepi",
  // 0xB6
  "Mew",
  // 0xB7
  "Celebi",
  // 0xB8
  "Staryu (Hitodeman)",
  // 0xB9
  "Chansey",
  // 0xBA
  "Porygon2",
  // 0xBB
  "Cyndaquil (Hinoarashi)",
  // 0xBC
  "Marill",
  // 0xBD
  "Venusaur (Fushigibana)",
  // 0xBE
  // Pokemon Related
  "Chicorita's Leaf",
  // 0xBF
  "Blastoise's Water",
  // 0xC0
  "Weezing's Gas",
  // 0xC1
  "Weezing's Gas",
  // 0xC2
  "Charizard's Breath",
  // 0xC3
  "Charizard's Breath",
  // 0xC4
  "Charizard's Breath",
  // 0xC5
  "Charizard's Breath",
  // 0xC6
  "Mini-Unowns",
  // 0xC7
  "Lugia's Aeroblast",
  // 0xC8
  "Lugia's Aeroblast",
  // 0xC9
  "Lugia's Aeroblast",
  // 0xCA
  "Ho-Oh's Flame",
  // 0xCB
  "Staryu's Star",
  // 0xCC
  "Healing Egg",
  // 0xCD
  "Cyndaquil's Fire",
  // 0xCE
  "",
  // 0xCF
  // Monsters Part 2
  "Old Goomba (Old-Kuri)",
  // 0xD0
  "Target (Mato)",
  // 0xD1
  "Shyguy (Heiho)",
  // 0xD2
  "Koopa(Green) (Nokonoko)",
  // 0xD3
  "Koopa(Red) (PataPata)",
  // 0xD4
  "Likelile",
  // 0xD5
  "Old Redead (old-lead) [invalid]",
  // 0xD6
  "Old Octorok(old-octa) [invalid]",
  // 0xD7
  "Old Ottosea (old-otto)",
  // 0xD8
  "White Bear (whitebea)",
  // 0xD9
  "Klap",
  // 0xDA
  "Green Shell (zgshell)",
  // 0xDB
  "Red Shell (green act) (zrshell)",
  // 0xDC
  // Stage Specific
  "Tingle (on balloon)",
  // 0xDD
  "[Invalid]",
  // 0xDE
  "[Invalid]",
  // 0xDF
  "[Invalid]",
  // 0xE0
  "Apple",
  // 0xE1
  "Healing Apple",
  // 0xE2
  "[Invalid]",
  // 0xE3
  "[Invalid]",
  // 0xE4
  "[Invalid]",
  // 0xE5
  "Tool (Flatzone)",
  // 0xE6
  "[Invalid]",
  // 0xE7
  "[Invalid]",
  // 0xE8
  "Birdo",
  // 0xE9
  "Arwing Laser",
  // 0xEA
  "Great Fox's Laser",
  // 0xEB
  "Birdo's Egg"
  // 0xEC
];
function nc(n, r, i) {
  const l = n.slice();
  return l[16] = r[i], l;
}
function oc(n, r, i) {
  const l = n.slice();
  return l[16] = r[i], l;
}
function a0(n) {
  let r;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*x*/
        n[3]
      ), p(
        r,
        "cy",
        /*y*/
        n[2]
      ), p(r, "r", 5 * 0.85), p(r, "fill", "#aa0000");
    },
    m(i, l) {
      U(i, r, l);
    },
    p(i, l) {
      l & /*x*/
      8 && p(
        r,
        "cx",
        /*x*/
        i[3]
      ), l & /*y*/
      4 && p(
        r,
        "cy",
        /*y*/
        i[2]
      );
    },
    d(i) {
      i && G(r);
    }
  };
}
function i0(n) {
  let r, i, l, u, h, S, A, T;
  return {
    c() {
      r = X("circle"), u = qe(), h = X("circle"), p(r, "cx", i = /*chargeAt*/
      n[5][0]), p(r, "cy", l = /*chargeAt*/
      n[5][1]), p(
        r,
        "r",
        /*shadowR*/
        n[4]
      ), p(r, "fill", "#3b2a63"), p(r, "opacity", "0.85"), p(h, "cx", S = /*chargeAt*/
      n[5][0]), p(h, "cy", A = /*chargeAt*/
      n[5][1]), p(h, "r", T = /*shadowR*/
      n[4] * 0.5), p(h, "fill", "#a78bfa"), p(h, "opacity", "0.7");
    },
    m(g, d) {
      U(g, r, d), U(g, u, d), U(g, h, d);
    },
    p(g, d) {
      d & /*chargeAt*/
      32 && i !== (i = /*chargeAt*/
      g[5][0]) && p(r, "cx", i), d & /*chargeAt*/
      32 && l !== (l = /*chargeAt*/
      g[5][1]) && p(r, "cy", l), d & /*shadowR*/
      16 && p(
        r,
        "r",
        /*shadowR*/
        g[4]
      ), d & /*chargeAt*/
      32 && S !== (S = /*chargeAt*/
      g[5][0]) && p(h, "cx", S), d & /*chargeAt*/
      32 && A !== (A = /*chargeAt*/
      g[5][1]) && p(h, "cy", A), d & /*shadowR*/
      16 && T !== (T = /*shadowR*/
      g[4] * 0.5) && p(h, "r", T);
    },
    d(g) {
      g && G(r), g && G(u), g && G(h);
    }
  };
}
function n0(n) {
  let r, i, l, u;
  return {
    c() {
      r = X("circle"), p(r, "cx", i = /*chargeAt*/
      n[5][0]), p(r, "cy", l = /*chargeAt*/
      n[5][1]), p(r, "r", u = /*samusChargeHitbox*/
      (n[11][
        /*item*/
        n[0].chargePower ?? 0
      ] ?? 300) / 256), p(r, "fill", "darkgray");
    },
    m(h, S) {
      U(h, r, S);
    },
    p(h, S) {
      S & /*chargeAt*/
      32 && i !== (i = /*chargeAt*/
      h[5][0]) && p(r, "cx", i), S & /*chargeAt*/
      32 && l !== (l = /*chargeAt*/
      h[5][1]) && p(r, "cy", l), S & /*item*/
      1 && u !== (u = /*samusChargeHitbox*/
      (h[11][
        /*item*/
        h[0].chargePower ?? 0
      ] ?? 300) / 256) && p(r, "r", u);
    },
    d(h) {
      h && G(r);
    }
  };
}
function o0(n) {
  let r, i;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*x*/
        n[3]
      ), p(
        r,
        "cy",
        /*y*/
        n[2]
      ), p(r, "r", i = /*item*/
      (n[0].state === 3 ? 1536 : 500) / 256), p(r, "fill", "darkgray");
    },
    m(l, u) {
      U(l, r, u);
    },
    p(l, u) {
      u & /*x*/
      8 && p(
        r,
        "cx",
        /*x*/
        l[3]
      ), u & /*y*/
      4 && p(
        r,
        "cy",
        /*y*/
        l[2]
      ), u & /*item*/
      1 && i !== (i = /*item*/
      (l[0].state === 3 ? 1536 : 500) / 256) && p(r, "r", i);
    },
    d(l) {
      l && G(r);
    }
  };
}
function l0(n) {
  let r, i;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*x*/
        n[3]
      ), p(
        r,
        "cy",
        /*y*/
        n[2]
      ), p(r, "r", i = /*item*/
      ((n[0].missileType ?? 0) === 0 ? 500 : 600) / 256), p(r, "fill", "darkgray");
    },
    m(l, u) {
      U(l, r, u);
    },
    p(l, u) {
      u & /*x*/
      8 && p(
        r,
        "cx",
        /*x*/
        l[3]
      ), u & /*y*/
      4 && p(
        r,
        "cy",
        /*y*/
        l[2]
      ), u & /*item*/
      1 && i !== (i = /*item*/
      ((l[0].missileType ?? 0) === 0 ? 500 : 600) / 256) && p(r, "r", i);
    },
    d(l) {
      l && G(r);
    }
  };
}
function u0(n) {
  let r;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*x*/
        n[3]
      ), p(
        r,
        "cy",
        /*y*/
        n[2]
      ), p(r, "r", 600 / 256), p(r, "fill", "darkgray");
    },
    m(i, l) {
      U(i, r, l);
    },
    p(i, l) {
      l & /*x*/
      8 && p(
        r,
        "cx",
        /*x*/
        i[3]
      ), l & /*y*/
      4 && p(
        r,
        "cy",
        /*y*/
        i[2]
      );
    },
    d(i) {
      i && G(r);
    }
  };
}
function c0(n) {
  let r;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*x*/
        n[3]
      ), p(
        r,
        "cy",
        /*y*/
        n[2]
      ), p(r, "r", 500 / 256), p(r, "fill", "darkgray");
    },
    m(i, l) {
      U(i, r, l);
    },
    p(i, l) {
      l & /*x*/
      8 && p(
        r,
        "cx",
        /*x*/
        i[3]
      ), l & /*y*/
      4 && p(
        r,
        "cy",
        /*y*/
        i[2]
      );
    },
    d(i) {
      i && G(r);
    }
  };
}
function h0(n) {
  let r, i, l;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*heldX*/
        n[7]
      ), p(
        r,
        "cy",
        /*heldY*/
        n[6]
      ), p(r, "r", i = /*item*/
      n[0].state === 2 ? 2500 / 256 : 1e3 / 256), p(r, "fill", "darkgray"), p(r, "opacity", l = /*item*/
      n[0].state === 1 ? 1 : 0.5);
    },
    m(u, h) {
      U(u, r, h);
    },
    p(u, h) {
      h & /*heldX*/
      128 && p(
        r,
        "cx",
        /*heldX*/
        u[7]
      ), h & /*heldY*/
      64 && p(
        r,
        "cy",
        /*heldY*/
        u[6]
      ), h & /*item*/
      1 && i !== (i = /*item*/
      u[0].state === 2 ? 2500 / 256 : 1e3 / 256) && p(r, "r", i), h & /*item*/
      1 && l !== (l = /*item*/
      u[0].state === 1 ? 1 : 0.5) && p(r, "opacity", l);
    },
    d(u) {
      u && G(r);
    }
  };
}
function f0(n) {
  let r, i;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*heldX*/
        n[7]
      ), p(
        r,
        "cy",
        /*heldY*/
        n[6]
      ), p(r, "r", 600 / 256), p(r, "fill", "darkgray"), p(r, "opacity", i = /*item*/
      n[0].state === 0 ? 0.5 : 1);
    },
    m(l, u) {
      U(l, r, u);
    },
    p(l, u) {
      u & /*heldX*/
      128 && p(
        r,
        "cx",
        /*heldX*/
        l[7]
      ), u & /*heldY*/
      64 && p(
        r,
        "cy",
        /*heldY*/
        l[6]
      ), u & /*item*/
      1 && i !== (i = /*item*/
      l[0].state === 0 ? 0.5 : 1) && p(r, "opacity", i);
    },
    d(l) {
      l && G(r);
    }
  };
}
function s0(n) {
  let r, i, l, u, h, S, A, T = (
    /*falcoLaserPts*/
    n[9]
  ), g = [];
  for (let d = 0; d < T.length; d += 1)
    g[d] = lc(nc(n, T, d));
  return {
    c() {
      var d, w, L, D;
      r = X("line"), S = qe();
      for (let C = 0; C < g.length; C += 1)
        g[C].c();
      A = Ue(), p(r, "x1", i = /*falcoLaserPts*/
      (d = n[9][0]) == null ? void 0 : d[0]), p(r, "y1", l = /*falcoLaserPts*/
      (w = n[9][0]) == null ? void 0 : w[1]), p(r, "x2", u = /*falcoLaserPts*/
      (L = n[9][3]) == null ? void 0 : L[0]), p(r, "y2", h = /*falcoLaserPts*/
      (D = n[9][3]) == null ? void 0 : D[1]), p(r, "stroke", "red");
    },
    m(d, w) {
      U(d, r, w), U(d, S, w);
      for (let L = 0; L < g.length; L += 1)
        g[L] && g[L].m(d, w);
      U(d, A, w);
    },
    p(d, w) {
      var L, D, C, B;
      if (w & /*falcoLaserPts*/
      512 && i !== (i = /*falcoLaserPts*/
      (L = d[9][0]) == null ? void 0 : L[0]) && p(r, "x1", i), w & /*falcoLaserPts*/
      512 && l !== (l = /*falcoLaserPts*/
      (D = d[9][0]) == null ? void 0 : D[1]) && p(r, "y1", l), w & /*falcoLaserPts*/
      512 && u !== (u = /*falcoLaserPts*/
      (C = d[9][3]) == null ? void 0 : C[0]) && p(r, "x2", u), w & /*falcoLaserPts*/
      512 && h !== (h = /*falcoLaserPts*/
      (B = d[9][3]) == null ? void 0 : B[1]) && p(r, "y2", h), w & /*falcoLaserPts, laserSize*/
      768) {
        T = /*falcoLaserPts*/
        d[9];
        let v;
        for (v = 0; v < T.length; v += 1) {
          const I = nc(d, T, v);
          g[v] ? g[v].p(I, w) : (g[v] = lc(I), g[v].c(), g[v].m(A.parentNode, A));
        }
        for (; v < g.length; v += 1)
          g[v].d(1);
        g.length = T.length;
      }
    },
    d(d) {
      d && G(r), d && G(S), ia(g, d), d && G(A);
    }
  };
}
function p0(n) {
  let r, i, l, u, h, S, A, T = (
    /*foxLaserPts*/
    n[10]
  ), g = [];
  for (let d = 0; d < T.length; d += 1)
    g[d] = uc(oc(n, T, d));
  return {
    c() {
      var d, w, L, D;
      r = X("line"), S = qe();
      for (let C = 0; C < g.length; C += 1)
        g[C].c();
      A = Ue(), p(r, "x1", i = /*foxLaserPts*/
      (d = n[10][0]) == null ? void 0 : d[0]), p(r, "y1", l = /*foxLaserPts*/
      (w = n[10][0]) == null ? void 0 : w[1]), p(r, "x2", u = /*foxLaserPts*/
      (L = n[10][2]) == null ? void 0 : L[0]), p(r, "y2", h = /*foxLaserPts*/
      (D = n[10][2]) == null ? void 0 : D[1]), p(r, "stroke", "red");
    },
    m(d, w) {
      U(d, r, w), U(d, S, w);
      for (let L = 0; L < g.length; L += 1)
        g[L] && g[L].m(d, w);
      U(d, A, w);
    },
    p(d, w) {
      var L, D, C, B;
      if (w & /*foxLaserPts*/
      1024 && i !== (i = /*foxLaserPts*/
      (L = d[10][0]) == null ? void 0 : L[0]) && p(r, "x1", i), w & /*foxLaserPts*/
      1024 && l !== (l = /*foxLaserPts*/
      (D = d[10][0]) == null ? void 0 : D[1]) && p(r, "y1", l), w & /*foxLaserPts*/
      1024 && u !== (u = /*foxLaserPts*/
      (C = d[10][2]) == null ? void 0 : C[0]) && p(r, "x2", u), w & /*foxLaserPts*/
      1024 && h !== (h = /*foxLaserPts*/
      (B = d[10][2]) == null ? void 0 : B[1]) && p(r, "y2", h), w & /*foxLaserPts, laserSize*/
      1280) {
        T = /*foxLaserPts*/
        d[10];
        let v;
        for (v = 0; v < T.length; v += 1) {
          const I = oc(d, T, v);
          g[v] ? g[v].p(I, w) : (g[v] = uc(I), g[v].c(), g[v].m(A.parentNode, A));
        }
        for (; v < g.length; v += 1)
          g[v].d(1);
        g.length = T.length;
      }
    },
    d(d) {
      d && G(r), d && G(S), ia(g, d), d && G(A);
    }
  };
}
function S0(n) {
  let r;
  return {
    c() {
      r = X("circle"), p(
        r,
        "cx",
        /*x*/
        n[3]
      ), p(
        r,
        "cy",
        /*y*/
        n[2]
      ), p(r, "r", 500 / 256), p(r, "fill", "darkgray");
    },
    m(i, l) {
      U(i, r, l);
    },
    p(i, l) {
      l & /*x*/
      8 && p(
        r,
        "cx",
        /*x*/
        i[3]
      ), l & /*y*/
      4 && p(
        r,
        "cy",
        /*y*/
        i[2]
      );
    },
    d(i) {
      i && G(r);
    }
  };
}
function lc(n) {
  let r, i, l;
  return {
    c() {
      r = X("circle"), p(r, "cx", i = /*p*/
      n[16][0]), p(r, "cy", l = /*p*/
      n[16][1]), p(
        r,
        "r",
        /*laserSize*/
        n[8]
      ), p(r, "fill", "red");
    },
    m(u, h) {
      U(u, r, h);
    },
    p(u, h) {
      h & /*falcoLaserPts*/
      512 && i !== (i = /*p*/
      u[16][0]) && p(r, "cx", i), h & /*falcoLaserPts*/
      512 && l !== (l = /*p*/
      u[16][1]) && p(r, "cy", l), h & /*laserSize*/
      256 && p(
        r,
        "r",
        /*laserSize*/
        u[8]
      );
    },
    d(u) {
      u && G(r);
    }
  };
}
function uc(n) {
  let r, i, l;
  return {
    c() {
      r = X("circle"), p(r, "cx", i = /*p*/
      n[16][0]), p(r, "cy", l = /*p*/
      n[16][1]), p(
        r,
        "r",
        /*laserSize*/
        n[8]
      ), p(r, "fill", "red");
    },
    m(u, h) {
      U(u, r, h);
    },
    p(u, h) {
      h & /*foxLaserPts*/
      1024 && i !== (i = /*p*/
      u[16][0]) && p(r, "cx", i), h & /*foxLaserPts*/
      1024 && l !== (l = /*p*/
      u[16][1]) && p(r, "cy", l), h & /*laserSize*/
      256 && p(
        r,
        "r",
        /*laserSize*/
        u[8]
      );
    },
    d(u) {
      u && G(r);
    }
  };
}
function w0(n) {
  let r;
  function i(h, S) {
    if (
      /*name*/
      h[1] === "Needle(thrown)"
    )
      return S0;
    if (
      /*name*/
      h[1] === "Fox's Laser"
    )
      return p0;
    if (
      /*name*/
      h[1] === "Falco's Laser"
    )
      return s0;
    if (
      /*name*/
      h[1] === "Turnip"
    )
      return f0;
    if (
      /*name*/
      h[1] === "Yoshi's egg(thrown)"
    )
      return h0;
    if (
      /*name*/
      h[1] === "Luigi's fire"
    )
      return c0;
    if (
      /*name*/
      h[1] === "Mario's fire"
    )
      return u0;
    if (
      /*name*/
      h[1] === "Missile"
    )
      return l0;
    if (
      /*name*/
      h[1] === "Samus's bomb"
    )
      return o0;
    if (
      /*name*/
      h[1] === "Samus's chargeshot"
    )
      return n0;
    if (
      /*name*/
      h[1] === "Mewtwo's Shadowball" || /*name*/
      h[1] === "Kirby copy Mewtwo's Shadowball (B)"
    )
      return i0;
    if (
      /*name*/
      h[1] === "Shyguy (Heiho)"
    )
      return a0;
  }
  let l = i(n), u = l && l(n);
  return {
    c() {
      u && u.c(), r = Ue();
    },
    m(h, S) {
      u && u.m(h, S), U(h, r, S);
    },
    p(h, [S]) {
      l === (l = i(h)) && u ? u.p(h, S) : (u && u.d(1), u = l && l(h), u && (u.c(), u.m(r.parentNode, r)));
    },
    i: Xe,
    o: Xe,
    d(h) {
      u && u.d(h), h && G(r);
    }
  };
}
function cc(n, r, i) {
  const l = n.positionX ?? 0, u = n.positionY ?? 0, h = Math.atan2(n.velocityY ?? 0, n.velocityX ?? 0), S = Math.cos(h), A = Math.sin(h), T = i ? n.facingDirection ?? 1 : 1;
  return r.map((g) => [l + g / 256 * T * S, u + g / 256 * T * A]);
}
function d0(n, r, i) {
  let l, u, h, S, A, T, g, d, w, L, { item: D } = r, { ownerX: C = null } = r, { ownerY: B = null } = r, { ownerFacing: v = 1 } = r;
  const I = [300, 400, 500, 600, 700, 800, 900, 1200], fe = {
    "Samus's chargeshot": [5, 9],
    "Mewtwo's Shadowball": [7, 10]
  };
  return n.$$set = (N) => {
    "item" in N && i(0, D = N.item), "ownerX" in N && i(12, C = N.ownerX), "ownerY" in N && i(13, B = N.ownerY), "ownerFacing" in N && i(14, v = N.ownerFacing);
  }, n.$$.update = () => {
    n.$$.dirty & /*item*/
    1 && i(1, l = r0[D.typeId ?? -1]), n.$$.dirty & /*item*/
    1 && i(3, u = D.positionX ?? 0), n.$$.dirty & /*item*/
    1 && i(2, h = D.positionY ?? 0), n.$$.dirty & /*name, item*/
    3 && i(10, S = l === "Fox's Laser" ? cc(D, [-200, -933, -1666], !0) : []), n.$$.dirty & /*name, item*/
    3 && i(9, A = l === "Falco's Laser" ? cc(D, [-200, -933, -1666, -2400], !1) : []), n.$$.dirty & /*item, ownerX, x*/
    4105 && i(7, g = D.state === 0 && C !== null ? C : u), n.$$.dirty & /*item, ownerY, y*/
    8197 && i(6, d = D.state === 0 && B !== null ? B + 8 : h), n.$$.dirty & /*item, ownerX, ownerY, ownerFacing, x, y, name*/
    28687 && i(5, w = ((N) => {
      const M = fe[N];
      return M && D.state === 0 && C !== null && B !== null ? [C + M[0] * v, B + M[1]] : [u, h];
    })(l)), n.$$.dirty & /*item*/
    1 && i(4, L = (900 + Math.min(7, D.chargePower ?? 0) * 220) / 256);
  }, i(8, T = 300 / 256), [
    D,
    l,
    h,
    u,
    L,
    w,
    d,
    g,
    T,
    A,
    S,
    I,
    C,
    B,
    v
  ];
}
class g0 extends Ea {
  constructor(r) {
    super(), Ha(this, r, d0, w0, Dr, {
      item: 0,
      ownerX: 12,
      ownerY: 13,
      ownerFacing: 14
    });
  }
}
var Tt = Uint8Array, ra = Uint16Array, A0 = Int32Array, Zc = new Tt([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]), Qc = new Tt([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]), m0 = new Tt([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Vc = function(n, r) {
  for (var i = new ra(31), l = 0; l < 31; ++l)
    i[l] = r += 1 << n[l - 1];
  for (var u = new A0(i[30]), l = 1; l < 30; ++l)
    for (var h = i[l]; h < i[l + 1]; ++h)
      u[h] = h - i[l] << 5 | l;
  return { b: i, r: u };
}, jc = Vc(Zc, 2), $c = jc.b, L0 = jc.r;
$c[28] = 258, L0[258] = 28;
var T0 = Vc(Qc, 0), _0 = T0.b, lo = new ra(32768);
for (var Ce = 0; Ce < 32768; ++Ce) {
  var yr = (Ce & 43690) >> 1 | (Ce & 21845) << 1;
  yr = (yr & 52428) >> 2 | (yr & 13107) << 2, yr = (yr & 61680) >> 4 | (yr & 3855) << 4, lo[Ce] = ((yr & 65280) >> 8 | (yr & 255) << 8) >> 1;
}
var Da = function(n, r, i) {
  for (var l = n.length, u = 0, h = new ra(r); u < l; ++u)
    n[u] && ++h[n[u] - 1];
  var S = new ra(r);
  for (u = 1; u < r; ++u)
    S[u] = S[u - 1] + h[u - 1] << 1;
  var A;
  if (i) {
    A = new ra(1 << r);
    var T = 15 - r;
    for (u = 0; u < l; ++u)
      if (n[u])
        for (var g = u << 4 | n[u], d = r - n[u], w = S[n[u] - 1]++ << d, L = w | (1 << d) - 1; w <= L; ++w)
          A[lo[w] >> T] = g;
  } else
    for (A = new ra(l), u = 0; u < l; ++u)
      n[u] && (A[u] = lo[S[n[u] - 1]++] >> 15 - n[u]);
  return A;
}, Ra = new Tt(288);
for (var Ce = 0; Ce < 144; ++Ce)
  Ra[Ce] = 8;
for (var Ce = 144; Ce < 256; ++Ce)
  Ra[Ce] = 9;
for (var Ce = 256; Ce < 280; ++Ce)
  Ra[Ce] = 7;
for (var Ce = 280; Ce < 288; ++Ce)
  Ra[Ce] = 8;
var eh = new Tt(32);
for (var Ce = 0; Ce < 32; ++Ce)
  eh[Ce] = 5;
var y0 = /* @__PURE__ */ Da(Ra, 9, 1), k0 = /* @__PURE__ */ Da(eh, 5, 1), eo = function(n) {
  for (var r = n[0], i = 1; i < n.length; ++i)
    n[i] > r && (r = n[i]);
  return r;
}, xt = function(n, r, i) {
  var l = r / 8 | 0;
  return (n[l] | n[l + 1] << 8) >> (r & 7) & i;
}, to = function(n, r) {
  var i = r / 8 | 0;
  return (n[i] | n[i + 1] << 8 | n[i + 2] << 16) >> (r & 7);
}, D0 = function(n) {
  return (n + 7) / 8 | 0;
}, wo = function(n, r, i) {
  return (r == null || r < 0) && (r = 0), (i == null || i > n.length) && (i = n.length), new Tt(n.subarray(r, i));
}, F0 = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
], Lt = function(n, r, i) {
  var l = new Error(r || F0[n]);
  if (l.code = n, Error.captureStackTrace && Error.captureStackTrace(l, Lt), !i)
    throw l;
  return l;
}, C0 = function(n, r, i, l) {
  var u = n.length, h = l ? l.length : 0;
  if (!u || r.f && !r.l)
    return i || new Tt(0);
  var S = !i, A = S || r.i != 2, T = r.i;
  S && (i = new Tt(u * 3));
  var g = function(Zt) {
    var Dt = i.length;
    if (Zt > Dt) {
      var tr = new Tt(Math.max(Dt * 2, Zt));
      tr.set(i), i = tr;
    }
  }, d = r.f || 0, w = r.p || 0, L = r.b || 0, D = r.l, C = r.d, B = r.m, v = r.n, I = u * 8;
  do {
    if (!D) {
      d = xt(n, w, 1);
      var fe = xt(n, w + 1, 3);
      if (w += 3, fe)
        if (fe == 1)
          D = y0, C = k0, B = 9, v = 5;
        else if (fe == 2) {
          var te = xt(n, w, 31) + 257, V = xt(n, w + 10, 15) + 4, x = te + xt(n, w + 5, 31) + 1;
          w += 14;
          for (var ue = new Tt(x), R = new Tt(19), K = 0; K < V; ++K)
            R[m0[K]] = xt(n, w + K * 3, 7);
          w += V * 3;
          for (var Y = eo(R), _e = (1 << Y) - 1, Be = Da(R, Y, 1), K = 0; K < x; ) {
            var Ye = Be[xt(n, w, _e)];
            w += Ye & 15;
            var N = Ye >> 4;
            if (N < 16)
              ue[K++] = N;
            else {
              var Se = 0, Ze = 0;
              for (N == 16 ? (Ze = 3 + xt(n, w, 3), w += 2, Se = ue[K - 1]) : N == 17 ? (Ze = 3 + xt(n, w, 7), w += 3) : N == 18 && (Ze = 11 + xt(n, w, 127), w += 7); Ze--; )
                ue[K++] = Se;
            }
          }
          var ht = ue.subarray(0, te), _t = ue.subarray(te);
          B = eo(ht), v = eo(_t), D = Da(ht, B, 1), C = Da(_t, v, 1);
        } else
          Lt(1);
      else {
        var N = D0(w) + 4, M = n[N - 4] | n[N - 3] << 8, oe = N + M;
        if (oe > u) {
          T && Lt(0);
          break;
        }
        A && g(L + M), i.set(n.subarray(N, oe), L), r.b = L += M, r.p = w = oe * 8, r.f = d;
        continue;
      }
      if (w > I) {
        T && Lt(0);
        break;
      }
    }
    A && g(L + 131072);
    for (var sr = (1 << B) - 1, Qe = (1 << v) - 1, zt = w; ; zt = w) {
      var Se = D[to(n, w) & sr], yt = Se >> 4;
      if (w += Se & 15, w > I) {
        T && Lt(0);
        break;
      }
      if (Se || Lt(2), yt < 256)
        i[L++] = yt;
      else if (yt == 256) {
        zt = w, D = null;
        break;
      } else {
        var It = yt - 254;
        if (yt > 264) {
          var K = yt - 257, $e = Zc[K];
          It = xt(n, w, (1 << $e) - 1) + $c[K], w += $e;
        }
        var kt = C[to(n, w) & Qe], Jt = kt >> 4;
        kt || Lt(3), w += kt & 15;
        var _t = _0[Jt];
        if (Jt > 3) {
          var $e = Qc[Jt];
          _t += to(n, w) & (1 << $e) - 1, w += $e;
        }
        if (w > I) {
          T && Lt(0);
          break;
        }
        A && g(L + 131072);
        var Kt = L + It;
        if (L < _t) {
          var qt = h - _t, Xt = Math.min(_t, Kt);
          for (qt + L < 0 && Lt(3); L < Xt; ++L)
            i[L] = l[qt + L];
        }
        for (; L < Kt; ++L)
          i[L] = i[L - _t];
      }
    }
    r.l = D, r.p = zt, r.b = L, r.f = d, D && (d = 1, r.m = B, r.d = C, r.n = v);
  } while (!d);
  return L != i.length && S ? wo(i, 0, L) : i.subarray(0, L);
}, B0 = /* @__PURE__ */ new Tt(0), er = function(n, r) {
  return n[r] | n[r + 1] << 8;
}, Rt = function(n, r) {
  return (n[r] | n[r + 1] << 8 | n[r + 2] << 16 | n[r + 3] << 24) >>> 0;
}, ro = function(n, r) {
  return Rt(n, r) + Rt(n, r + 4) * 4294967296;
};
function v0(n, r) {
  return C0(n, { i: 2 }, r && r.out, r && r.dictionary);
}
var uo = typeof TextDecoder < "u" && /* @__PURE__ */ new TextDecoder(), b0 = 0;
try {
  uo.decode(B0, { stream: !0 }), b0 = 1;
} catch {
}
var W0 = function(n) {
  for (var r = "", i = 0; ; ) {
    var l = n[i++], u = (l > 127) + (l > 223) + (l > 239);
    if (i + u > n.length)
      return { s: r, r: wo(n, i - 1) };
    u ? u == 3 ? (l = ((l & 15) << 18 | (n[i++] & 63) << 12 | (n[i++] & 63) << 6 | n[i++] & 63) - 65536, r += String.fromCharCode(55296 | l >> 10, 56320 | l & 1023)) : u & 1 ? r += String.fromCharCode((l & 31) << 6 | n[i++] & 63) : r += String.fromCharCode((l & 15) << 12 | (n[i++] & 63) << 6 | n[i++] & 63) : r += String.fromCharCode(l);
  }
};
function th(n, r) {
  if (r) {
    for (var i = "", l = 0; l < n.length; l += 16384)
      i += String.fromCharCode.apply(null, n.subarray(l, l + 16384));
    return i;
  } else {
    if (uo)
      return uo.decode(n);
    var u = W0(n), h = u.s, i = u.r;
    return i.length && Lt(8), h;
  }
}
var H0 = function(n, r) {
  return r + 30 + er(n, r + 26) + er(n, r + 28);
}, E0 = function(n, r, i) {
  var l = er(n, r + 28), u = er(n, r + 30), h = th(n.subarray(r + 46, r + 46 + l), !(er(n, r + 8) & 2048)), S = r + 46 + l, A = R0(n, S, u, i, Rt(n, r + 20), Rt(n, r + 24), Rt(n, r + 42)), T = A[0], g = A[1], d = A[2];
  return [er(n, r + 10), T, g, h, S + u + er(n, r + 32), d];
}, R0 = function(n, r, i, l, u, h, S) {
  var A = u == 4294967295, T = h == 4294967295, g = S == 4294967295, d = r + i, w = A + T + g;
  if (l && w) {
    for (; r + 4 < d; r += 4 + er(n, r + 2))
      if (er(n, r) == 1)
        return [
          A ? ro(n, r + 4 + 8 * T) : u,
          T ? ro(n, r + 4) : h,
          g ? ro(n, r + 4 + 8 * (T + A)) : S,
          1
        ];
    l < 2 && Lt(13);
  }
  return [u, h, S, 0];
};
function I0(n, r) {
  for (var i = {}, l = n.length - 22; Rt(n, l) != 101010256; --l)
    (!l || n.length - l > 65558) && Lt(13);
  var u = er(n, l + 8);
  if (!u)
    return {};
  var h = Rt(n, l + 16), S = Rt(n, l - 20) == 117853008;
  if (S) {
    var A = Rt(n, l - 12);
    S = Rt(n, A) == 101075792, S && (u = Rt(n, A + 32), h = Rt(n, A + 48));
  }
  for (var T = r && r.filter, g = 0; g < u; ++g) {
    var d = E0(n, h, S), w = d[0], L = d[1], D = d[2], C = d[3], B = d[4], v = d[5], I = H0(n, v);
    h = B, (!T || T({
      name: C,
      size: L,
      originalSize: D,
      compression: w
    })) && (w ? w == 8 ? i[C] = v0(n.subarray(I, I + L), { out: new Tt(D) }) : Lt(14, "unknown compression type " + w) : i[C] = wo(n, I, I + L));
  }
  return i;
}
let rh = "";
const K0 = (n) => rh = n.replace(/\/$/, ""), co = (n) => rh + n, ho = /* @__PURE__ */ new Map(), bi = /* @__PURE__ */ new Map(), M0 = [
  "/animations/captainFalcon.zip",
  "/animations/donkeyKong.zip",
  "/animations/fox.zip",
  "/animations/mrGameAndWatch.zip",
  "/animations/kirby.zip",
  "/animations/bowser.zip",
  "/animations/link.zip",
  "/animations/luigi.zip",
  "/animations/mario.zip",
  "/animations/marth.zip",
  "/animations/mewtwo.zip",
  "/animations/ness.zip",
  "/animations/peach.zip",
  "/animations/pikachu.zip",
  "/animations/iceClimbers.zip",
  "/animations/jigglypuff.zip",
  "/animations/samus.zip",
  "/animations/yoshi.zip",
  "/animations/zelda.zip",
  "/animations/sheik.zip",
  "/animations/falco.zip",
  "/animations/youngLink.zip",
  "/animations/doctorMario.zip",
  "/animations/roy.zip",
  "/animations/pichu.zip",
  "/animations/ganondorf.zip"
];
function ah(n) {
  for (const r of n)
    r >= 0 && !ho.has(r) && ih(r).catch(() => {
    });
}
async function ih(n) {
  const r = ho.get(n);
  if (r)
    return r;
  const i = bi.get(n);
  if (i)
    return i;
  const l = M0[n];
  if (!l)
    return {};
  const u = co(l), h = P0(u).then((S) => (ho.set(n, S), bi.delete(n), S)).catch((S) => {
    throw bi.delete(n), S;
  });
  return bi.set(n, h), h;
}
async function P0(n) {
  const r = await fetch(n, { headers: { "ngrok-skip-browser-warning": "true" } }), i = new Uint8Array(await r.arrayBuffer()), l = I0(i);
  return Object.fromEntries(
    Object.entries(l).map(([u, h]) => [
      u.replace(".json", ""),
      JSON.parse(th(h))
    ])
  );
}
const O0 = {
  scale: 0.69,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 0.69 * 31.25,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialNStart"],
    [342, "SpecialN"],
    [343, "SpecialNEnd"],
    [344, "SpecialAirNStart"],
    [345, "SpecialAirN"],
    [346, "SpecialAirNEnd"],
    [347, "SpecialSStart"],
    [348, "SpecialSHit"],
    [349, "SpecialSHit"],
    [350, "SpecialSHit"],
    [351, "SpecialSEndF"],
    [352, "SpecialSEndB"],
    [353, "SpecialAirSStart"],
    [354, "SpecialAirSHit"],
    [355, "SpecialAirSHit"],
    [356, "SpecialAirSHit"],
    [357, "SpecialAirSEndF"],
    [358, "SpecialAirSEndB"],
    [359, "SpecialHi"],
    [360, "SpecialAirHi"],
    [361, "SpecialLw"],
    [362, "SpecialAirLw"],
    [363, "SpecialLwLanding"]
  ])
}, G0 = {
  scale: 0.97,
  shieldOffset: [0.2, 10.447],
  shieldSize: 0.97 * 15,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["CliffWait", "CliffWait1"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [347, "SpecialN"],
    [348, "SpecialAirN"],
    [349, "SpecialSStart"],
    [350, "SpecialS"],
    [351, "SpecialAirSStart"],
    [352, "SpecialAirS"],
    [353, "SpecialHi"],
    [354, "SpecialAirHi"],
    [355, "SpecialHiCatch"],
    [356, "SpecialHiThrow"],
    [357, "SpecialLw"],
    [358, "SpecialLwEnd"],
    [359, "SpecialAirLw"],
    [360, "SpecialAirLwEnd"],
    [361, "SpecialAirLwEndAir"],
    [362, "SpecialLwEndAir"],
    [363, "SpecialHiThrow"]
  ])
}, U0 = {
  scale: 1.1,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1.1 * 10.75,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "Appeal"],
    [343, "SpecialN"],
    [344, "SpecialAirN"],
    [345, "SpecialS"],
    [346, "SpecialSAir"],
    [347, "SpecialHi"],
    [348, "SpecialAirHi"],
    [349, "SpecialLw"],
    [350, "SpecialAirLw"]
  ])
}, N0 = {
  scale: 1,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1 * 17.75,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [351, "ThrowFWait"],
    [352, "ThrowFWalkSlow"],
    [353, "ThrowFWalkMiddle"],
    [354, "ThrowFWalkFast"],
    [355, "ThrowFTurn"],
    [356, "ThrowFWait"],
    // jump squat
    [357, "ThrowFWait"],
    // fall
    [358, "ThrowFWait"],
    // jump
    [359, "ThrowFWait"],
    // landing
    [360, ""],
    // unused
    [361, "ThrowFF"],
    [362, "ThrowFB"],
    [363, "ThrowFHi"],
    [364, "ThrowFLw"],
    [365, "ThrowFF"],
    [366, "ThrowFB"],
    [367, "ThrowFHi"],
    [368, "ThrowFLw"],
    [369, "SpecialNStart"],
    [370, "SpecialNLoop"],
    [371, "SpecialNCansel"],
    [372, "SpecialN"],
    [373, "SpecialN"],
    [374, "SpecialAirNStart"],
    [375, "SpecialAirNLoop"],
    [376, "SpecialAirNCansel"],
    [377, "SpecialAirN"],
    [378, "SpecialAirN"],
    [379, "SpecialS"],
    [380, "SpecialAirS"],
    [381, "SpecialHi"],
    [382, "SpecialAirHi"],
    [383, "SpecialLwStart"],
    [384, "SpecialLwLoop"],
    [385, "SpecialLwEnd"]
  ])
}, x0 = {
  scale: 1.1,
  shieldOffset: [2.724, 9.003],
  shieldSize: 1.1 * 12.5,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialNStart"],
    [342, "SpecialNLoop"],
    [343, "SpecialNEnd"],
    [344, "SpecialAirNStart"],
    [345, "SpecialAirNLoop"],
    [346, "SpecialAirNEnd"],
    [347, "SpecialSStart"],
    [348, "SpecialS"],
    [349, "SpecialSEnd"],
    [350, "SpecialAirSStart"],
    [351, "SpecialAirS"],
    [352, "SpecialAirSEnd"],
    [353, "SpecialHiHold"],
    [354, "SpecialHiHoldAir"],
    [355, "SpecialHi"],
    [356, "SpecialHi"],
    [357, "SpecialHiLanding"],
    [358, "SpecialHiFall"],
    [359, "SpecialHiBound"],
    [360, "SpecialLwStart"],
    [361, "SpecialLwLoop"],
    [362, "SpecialLwHit"],
    [363, "SpecialLwEnd"],
    [364, "SpecialLw2"],
    [365, "SpecialAirLwStart"],
    [366, "SpecialAirLwLoop"],
    [367, "SpecialAirLwHit"],
    [368, "SpecialAirLwEnd"],
    [369, "SpecialAirLwLoop"],
    [370, "AppealSStartR"],
    [371, "AppealSStartL"],
    [372, "AppealSR"],
    [373, "AppealSL"],
    [374, "AppealSEndR"],
    [375, "AppealSEndL"]
  ])
}, Y0 = {
  scale: 0.96,
  shieldOffset: [2.724, 9.003],
  // model units
  shieldSize: 0.96 * 14.375,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialNStart"],
    [342, "SpecialNLoop"],
    [343, "SpecialNEnd"],
    [344, "SpecialAirNStart"],
    [345, "SpecialAirNLoop"],
    [346, "SpecialAirNEnd"],
    [347, "SpecialSStart"],
    [348, "SpecialS"],
    [349, "SpecialSEnd"],
    [350, "SpecialAirSStart"],
    [351, "SpecialAirS"],
    [352, "SpecialAirSEnd"],
    [353, "SpecialHiHold"],
    [354, "SpecialHiHoldAir"],
    [355, "SpecialHi"],
    [356, "SpecialHi"],
    [357, "SpecialHiLanding"],
    [358, "SpecialHiFall"],
    [359, "SpecialHiBound"],
    [360, "SpecialLwStart"],
    [361, "SpecialLwLoop"],
    [362, "SpecialLwHit"],
    [363, "SpecialLwEnd"],
    [364, "SpecialLwLoop"],
    [365, "SpecialAirLwStart"],
    [366, "SpecialAirLwLoop"],
    [367, "SpecialAirLwHit"],
    [368, "SpecialAirLwEnd"],
    [369, "SpecialAirLwLoop"],
    [370, "AppealSStartR"],
    [371, "AppealSStartL"],
    [372, "AppealSR"],
    [373, "AppealSL"],
    [374, "AppealSEndR"],
    [375, "AppealSEndL"]
  ])
}, z0 = {
  scale: 1.08,
  shieldOffset: [0.2, 10.447],
  // TODO
  shieldSize: 1.08 * 15,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["CliffWait", "CliffWait1"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, ""],
    [342, ""],
    [343, ""],
    [344, ""],
    [345, ""],
    [346, ""],
    [347, "SpecialN"],
    [348, "SpecialAirN"],
    [349, "SpecialSStart"],
    [350, "SpecialS"],
    [351, "SpecialAirSStart"],
    [352, "SpecialAirS"],
    [353, "SpecialHi"],
    [354, "SpecialAirHi"],
    [355, "SpecialHiCatch"],
    [356, "SpecialHiThrow"],
    [357, "SpecialLw"],
    [358, "SpecialLwEnd"],
    [359, "SpecialAirLw"],
    [360, "SpecialAirLwEnd"],
    [361, "SpecialAirLwEndAir"],
    [362, "SpecialLwEndAir"],
    [363, "SpecialHiThrow"]
  ])
}, hc = {
  scale: 1.15,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1.15 * 10.75,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialN"],
    [342, "SpecialAirN"],
    [343, "SpecialS1"],
    [344, "SpecialS2"],
    [345, "SpecialAirS1"],
    [346, "SpecialAirS2"],
    [347, "SpecialHiStart"],
    // popo throwing nana
    [348, "SpecialHiThrow"],
    // popo animation while nana flies up
    [349, ""],
    [350, "SpecialHiStart"],
    // failed
    [351, "SpecialHiThrow"],
    // failed 2
    [352, "SpecialAirHiStart"],
    // pop throwing nana in the air
    [353, "SpecialAirHiThrow"],
    // popo air animation while nana flies up
    [354, "SpecialAirHiThrow2"],
    // popo flying up pulled by nana
    [355, "SpecialAirHiStart"],
    // failed air
    [356, "SpecialAirHiThrow"],
    // failed air 2
    [357, "SpecialLw"],
    [358, "SpecialAirLw"],
    [359, "NanaSpecialS2"],
    [360, "NanaSpecialAirS2"],
    [361, "NanaSpecialHiStart"],
    // nana getting ready to be thrown
    [362, "NanaSpecialAirHiThrow"],
    [363, ""],
    [364, ""],
    [365, "NanaSpecialHiThrow"]
    // nana being thrown by popo
  ])
}, J0 = {
  scale: 0.94,
  shieldOffset: [0, 4.828],
  shieldSize: 0.94 * 13.125,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "JumpAerialF1"],
    [342, "JumpAerialF2"],
    [343, "JumpAerialF3"],
    [344, "JumpAerialF4"],
    [345, "JumpAerialF5"],
    [346, "SpecialNStartR"],
    [347, "SpecialNStartL"],
    [348, "SpecialN"],
    [349, "SpecialN"],
    [350, "SpecialN"],
    [351, "SpecialN"],
    [352, "SpecialNEndR"],
    [353, "SpecialNEndL"],
    [354, "SpecialAirNStartR"],
    [355, "SpecialAirNStartL"],
    [356, "SpecialN"],
    [357, "SpecialN"],
    [358, "SpecialN"],
    [359, "SpecialN"],
    [360, "SpecialAirNEndR"],
    [361, "SpecialAirNEndL"],
    [362, "DamageFall"],
    [363, "SpecialS"],
    [364, "SpecialAirS"],
    [365, "SpecialHiL"],
    [366, "SpecialAirHiL"],
    [367, "SpecialHiR"],
    [368, "SpecialAirHiR"],
    [369, "SpecialLwL"],
    [370, "SpecialAirLwL"],
    [371, "SpecialLwR"],
    [372, "SpecialAirLwR"]
  ])
}, q0 = {
  scale: 0.92,
  shieldOffset: [0, 4.828],
  shieldSize: 0.92 * 14.7,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "JumpAerialF1"],
    [342, "JumpAerialF2"],
    [343, "JumpAerialF3"],
    [344, "JumpAerialF4"],
    [345, "JumpAerialF5"],
    [346, "JumpAerialF1Met"],
    [347, "JumpAerialF2Met"],
    [348, "JumpAerialF3Met"],
    [349, "JumpAerialF4Met"],
    [350, "JumpAerialF5Met"],
    [351, "AttackDash"],
    [352, "AttackDash"],
    [353, "SpecialN"],
    // Ground Startup (Drink?)
    [354, "SpecialNLoop"],
    [355, "SpecialNEnd"],
    [356, "Eat"],
    // Capture (Eat?)
    [357, ""],
    // ???
    [358, ""],
    // Captured (used as swallowed character state? or is that ThrownKirby?)
    [359, "EatWait"],
    [360, "EatWalkSlow"],
    [361, "EatWalkMiddle"],
    [362, "EatWalkFast"],
    [363, "EatTurn"],
    [364, "EatLanding"],
    [365, "EatJump1"],
    [366, "EatLanding"],
    [367, "SpecialNDrink"],
    // Digest (Drink?)
    [368, ""],
    // ???
    [369, "SpecialNSpit"],
    // Spit
    [370, ""],
    // ???
    [371, "SpecialN"],
    // Air Startup (Drink?)
    [372, "SpecialNLoop"],
    [373, "SpecialNEnd"],
    [374, "Eat"],
    // Air Capture (Eat?)
    [375, ""],
    // ???
    [376, ""],
    // Air Captured (see 358)
    [377, "EatWait"],
    [378, "SpecialNDrink"],
    // Air Digest (Drink?)
    [379, ""],
    // ???
    [380, "SpecialNSpit"],
    // Air Spit
    [381, ""],
    // ???
    [382, "EatTurn"],
    [383, "SpecialS"],
    [384, "SpecialAirS"],
    [385, "SpecialHi1"],
    [386, "SpecialHi2"],
    [387, "SpecialHi3"],
    [388, "SpecialHi4"],
    [389, "SpecialAirHi1"],
    [390, "SpecialAirHi2"],
    [391, "SpecialAirHi3"],
    [392, "SpecialAirHi4"],
    [393, "SpecialLw1"],
    [394, "SpecialLw1"],
    [395, "SpecialLw2"],
    [396, "SpecialAirLw1"],
    [397, "SpecialAirLw1"],
    [398, "SpecialAirLw2"]
    // 399 - 537 are hat neutralBs
  ])
}, X0 = {
  scale: 1.22,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1.22 * 11.625,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS41"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "AttackS42"],
    [342, ""],
    [343, ""],
    [344, "SpecialNStart"],
    [345, "SpecialNLoop"],
    [346, "SpecialNEnd"],
    [347, "SpecialAirNStart"],
    [348, "SpecialAirNLoop"],
    [349, "SpecialAirNEnd"],
    [350, "SpecialS1"],
    [351, "SpecialS2"],
    [352, "SpecialS1"],
    [353, "SpecialAirS1"],
    [354, "SpecialAirS2"],
    [355, "SpecialAirS1"],
    [356, "SpecialHi"],
    [357, "SpecialAirHi"],
    [358, "SpecialLw"],
    [359, "SpecialAirLw"],
    [360, "AirCatch"],
    [361, "AirCatchHit"]
  ])
}, Z0 = {
  scale: 1.25,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1.25 * 10.75,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialN"],
    [342, "SpecialAirN"],
    [343, "SpecialSStart"],
    [344, "SpecialSHold"],
    [345, "SpecialSHold"],
    // Unused
    [346, "SpecialSEnd"],
    [347, "SpecialS"],
    [348, "SpecialS"],
    [349, "SpecialAirSStart"],
    [350, "SpecialAirSHold"],
    [351, "SpecialS"],
    [352, "SpecialAirSEnd"],
    [353, "SpecialS"],
    [354, "SpecialS"],
    [355, "SpecialHi"],
    [356, "SpecialAirHi"],
    [357, "SpecialLw"],
    [358, "SpecialAirLw"]
  ])
}, Q0 = {
  scale: 1.1,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1.1 * 10.75,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [343, "SpecialN"],
    [344, "SpecialAirN"],
    [345, "SpecialS"],
    [346, "SpecialSAir"],
    [347, "SpecialHi"],
    [348, "SpecialAirHi"],
    [349, "SpecialLw"],
    [350, "SpecialAirLw"]
  ])
}, V0 = {
  scale: 1.15,
  shieldOffset: [0.893, 7.257],
  shieldSize: 1.15 * 11.75,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS31"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialNStart"],
    [342, "SpecialNLoop"],
    [343, "SpecialNEnd"],
    [344, "SpecialNEnd"],
    [345, "SpecialAirNStart"],
    [346, "SpecialAirNLoop"],
    [347, "SpecialAirNEnd"],
    [348, "SpecialAirNEnd"],
    [349, "SpecialS1"],
    [350, "SpecialS2Hi"],
    [351, "SpecialS2Lw"],
    [352, "SpecialS3Hi"],
    [353, "SpecialS3S"],
    [354, "SpecialS3Lw"],
    [355, "SpecialS4Hi"],
    [356, "SpecialS4S"],
    [357, "SpecialS4Lw"],
    [358, "SpecialAirS1"],
    [359, "SpecialAirS2Hi"],
    [360, "SpecialAirS2Lw"],
    [361, "SpecialAirS3Hi"],
    [362, "SpecialAirS3S"],
    [363, "SpecialAirS3Lw"],
    [364, "SpecialAirS4Hi"],
    [365, "SpecialAirS4S"],
    [366, "SpecialAirS4Lw"],
    [367, "SpecialHi"],
    [368, "SpecialAirHi"],
    [369, "SpecialLw"],
    [370, "SpecialLwHit"],
    [371, "SpecialAirLw"],
    [372, "SpecialAirLwHit"]
  ])
}, j0 = {
  scale: 1,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1 * 16.25,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialNStart"],
    [342, "SpecialNLoop"],
    [343, "SpecialNLoop"],
    [344, "SpecialNCancel"],
    [345, "SpecialNEnd"],
    [346, "SpecialAirNStart"],
    [347, "SpecialAirNLoop"],
    [348, "SpecialAirNLoop"],
    [349, "SpecialAirNCancel"],
    [350, "SpecialAirNEnd"],
    [351, "SpecialS"],
    [352, "SpecialAirS"],
    [353, "SpecialHiStart"],
    [354, "SpecialHiLost"],
    [355, "SpecialHi"],
    [356, "SpecialAirHiStart"],
    [357, "SpecialHiLost"],
    [358, "SpecialAirHi"],
    [359, "SpecialLw"],
    [360, "SpecialAirLw"]
  ])
}, $0 = {
  scale: 1.02,
  shieldOffset: [0, 4.828],
  // TODO
  shieldSize: 1.02 * 10.75,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "Attack11"],
    [342, "Attack11"],
    [343, "Attack100Start"],
    [344, "Attack100End"],
    [345, "AttackLw3"],
    [346, "AttackS4"],
    [347, "AttackAirN"],
    [348, "AttackAirB"],
    [349, "AttackAirHi"],
    [350, "LandingAirN"],
    [351, "LandingAirB"],
    [352, "LandingAirHi"],
    [353, "SpecialN"],
    [354, "SpecialAirN"],
    [355, "SpecialS"],
    // 1
    [356, "SpecialS"],
    // 2
    [357, "SpecialS"],
    // 3
    [358, "SpecialS"],
    // 4
    [359, "SpecialS"],
    // 5
    [360, "SpecialS"],
    // 6
    [361, "SpecialS"],
    // 7
    [362, "SpecialS"],
    // 8
    [363, "SpecialS"],
    // 9
    [364, "SpecialAirS"],
    // 1
    [365, "SpecialAirS"],
    // 2
    [366, "SpecialAirS"],
    // 3
    [367, "SpecialAirS"],
    // 4
    [368, "SpecialAirS"],
    // 5
    [369, "SpecialAirS"],
    // 6
    [370, "SpecialAirS"],
    // 7
    [371, "SpecialAirS"],
    // 8
    [372, "SpecialAirS"],
    // 9
    [373, "SpecialHi"],
    [374, "SpecialAirHi"],
    [375, "SpecialLw"],
    [376, "SpecialLwCatch"],
    [377, "SpecialLwShoot"],
    [378, "SpecialAirLw"],
    [379, "SpecialAirLwCatch"],
    [380, "SpecialAirLwShoot"]
  ])
}, e1 = {
  scale: 1,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1 * 13.75,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "AttackS4"],
    [342, "AttackHi4"],
    [343, "AttackHi4"],
    [344, "AttackHi4"],
    [345, "AttackLw4"],
    [346, "AttackLw4"],
    [347, "AttackLw4"],
    [348, "SpecialNStart"],
    [349, "SpecialNHold"],
    [350, "SpecialNEnd"],
    [351, "SpecialNEnd"],
    [352, "SpecialAirNStart"],
    [353, "SpecialAirNHold"],
    [354, "SpecialAirNEnd"],
    [355, "SpecialAirNEnd"],
    [356, "SpecialS"],
    [357, "SpecialAirS"],
    [358, "SpecialHiStart"],
    [359, "SpecialHiHold"],
    [360, "SpecialHiEnd"],
    [361, "SpecialHi"],
    [362, "SpecialAirHiStart"],
    [363, "SpecialAirHiHold"],
    [364, "SpecialAirHiEnd"],
    [365, "SpecialHi"],
    [366, "SpecialHi"],
    [367, "SpecialLwStart"],
    [368, "SpecialLwHold"],
    [369, "SpecialLwHit"],
    [370, "SpecialLwEnd"],
    [371, ""],
    [372, "SpecialAirLwStart"],
    [373, "SpecialAirLwHold"],
    [374, "SpecialAirLwHit"],
    [375, "SpecialAirLwEnd"],
    [376, ""]
  ])
}, t1 = {
  scale: 1.15,
  shieldOffset: [5 / 4.5, 34 / 4.5],
  // guess
  shieldSize: 1.15 * 11.875,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "Fuwafuwa"],
    [342, "FallF"],
    [343, "FallB"],
    [344, "AttackAirN"],
    [345, "AttackAirF"],
    [346, "AttackAirB"],
    [347, "AttackAirHi"],
    [348, "AttackAirLw"],
    [349, "AttackS4"],
    // Golf
    [350, "AttackS4"],
    // Frying
    [351, "AttackS4"],
    // Tennis
    [352, "SpecialN"],
    [353, "SpecialAirN"],
    [354, "SpecialSStart"],
    [355, "SpecialSEnd"],
    [356, "Unsupported"],
    [357, "SpecialAirSStart"],
    [358, "SpecialAirSEnd"],
    [359, "SpecialAirS"],
    [360, "SpecialSJump"],
    [361, "SpecialHiStart"],
    [362, "SpecialHiEnd"],
    [363, "SpecialAirHiStart"],
    [364, "SpecialAirHiEnd"],
    [365, "SpecialLw"],
    [366, "SpecialLwHit"],
    [367, "SpecialAirLw"],
    [368, "SpecialAirLwHit"],
    [369, "ItemParasolOpen"],
    [370, "ItemParasolFall"]
  ])
}, r1 = {
  scale: 0.5,
  shieldOffset: [2.724, 9.003],
  // TODO
  shieldSize: 0.5 * 24.3,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialN"],
    [342, "SpecialN"],
    [343, "SpecialSStart"],
    [344, "SpecialSHold"],
    [345, "UNSUPPORTED"],
    [346, "SpecialSEnd"],
    [347, "SpecialS"],
    [348, "SpecialAirSStart"],
    [349, "SpecialAirSHold"],
    [350, "SpecialS"],
    [351, "SpecialAirSEnd"],
    [352, "SpecialS"],
    [353, "SpecialHiStart"],
    [354, "SpecialHiStart"],
    [355, "SpecialHiEnd"],
    [356, "SpecialAirHiStart"],
    [357, "SpecialAirHiStart"],
    [358, "SpecialAirHiEnd"],
    [359, "SpecialLwStart"],
    [360, "SpecialLwLoop"],
    [361, "SpecialLwEnd"],
    [362, "SpecialLwEnd"],
    [363, "SpecialAirLwStart"],
    [364, "SpecialAirLwLoop"],
    [365, "SpecialAirLwEnd"],
    [366, "SpecialAirLwEnd"]
  ])
}, a1 = {
  scale: 0.9,
  shieldOffset: [2.724, 9.003],
  // TODO
  shieldSize: 0.9 * 12,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialN"],
    [342, "SpecialN"],
    [343, "SpecialSStart"],
    [344, "SpecialSHold"],
    [345, "UNSUPPORTED"],
    [346, "SpecialSEnd"],
    [347, "SpecialS"],
    [348, "SpecialAirSStart"],
    [349, "SpecialAirSHold"],
    [350, "SpecialS"],
    [351, "SpecialAirSEnd"],
    [352, "SpecialS"],
    [353, "SpecialHiStart"],
    [354, "SpecialHiStart"],
    [355, "SpecialHiEnd"],
    [356, "SpecialAirHiStart"],
    [357, "SpecialAirHiStart"],
    [358, "SpecialAirHiEnd"],
    [359, "SpecialLwStart"],
    [360, "SpecialLwLoop"],
    [361, "SpecialLwEnd"],
    [362, "SpecialLwEnd"],
    [363, "SpecialAirLwStart"],
    [364, "SpecialAirLwLoop"],
    [365, "SpecialAirLwEnd"],
    [366, "SpecialAirLwEnd"]
  ])
}, i1 = {
  scale: 1.08,
  shieldOffset: [0.893, 7.257],
  // TODO
  shieldSize: 1.08 * 11.75,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS31"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialNStart"],
    [342, "SpecialNLoop"],
    [343, "SpecialNEnd"],
    [344, "SpecialNEnd"],
    [345, "SpecialAirNStart"],
    [346, "SpecialAirNLoop"],
    [347, "SpecialAirNEnd"],
    [348, "SpecialAirNEnd"],
    [349, "SpecialS1"],
    [350, "SpecialS2Hi"],
    [351, "SpecialS2Lw"],
    [352, "SpecialS3Hi"],
    [353, "SpecialS3S"],
    [354, "SpecialS3Lw"],
    [355, "SpecialS4Hi"],
    [356, "SpecialS4S"],
    [357, "SpecialS4Lw"],
    [358, "SpecialAirS1"],
    [359, "SpecialAirS2Hi"],
    [360, "SpecialAirS2Lw"],
    [361, "SpecialAirS3Hi"],
    [362, "SpecialAirS3S"],
    [363, "SpecialAirS3Lw"],
    [364, "SpecialAirS4Hi"],
    [365, "SpecialAirS4S"],
    [366, "SpecialAirS4Lw"],
    [367, "SpecialHi"],
    [368, "SpecialAirHi"],
    [369, "SpecialLw"],
    [370, "SpecialLwHit"],
    [371, "SpecialAirLw"],
    [372, "SpecialAirLwHit"]
  ])
}, n1 = {
  scale: 0.88,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 0.88 * 16.25,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4HiS"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4LwS"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialLw"],
    [342, "SpecialAirLw"],
    [343, "SpecialNStart"],
    [344, "SpecialNHold"],
    [345, "SpecialNCancel"],
    [346, "SpecialN"],
    [347, "SpecialAirNStart"],
    [348, "SpecialAirN"],
    [349, "SpecialS"],
    [350, "SpecialS"],
    [351, "SpecialAirS"],
    [352, "SpecialAirS"],
    [353, "SpecialHi"],
    [354, "SpecialAirHi"],
    [355, "SpecialLw"],
    [356, "SpecialAirLw"],
    [357, "AirCatch"],
    [358, "AirCatchHit"]
  ])
}, o1 = {
  scale: 1.4,
  shieldOffset: [0.541, 6.969],
  shieldSize: 1.4 * 11.625,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "Appeal"],
    ["AppealR", "Appeal"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "GuardOn"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialNStart"],
    [342, "SpecialNLoop"],
    [343, "SpecialNCansel"],
    [344, "SpecialNEnd"],
    [345, "SpecialAirNStart"],
    [346, "SpecialAirNLoop"],
    [347, "SpecialAirNCansel"],
    [348, "SpecialAirNEnd"],
    [349, "SpecialSStart"],
    [350, "SpecialS"],
    [351, "SpecialSEnd"],
    [352, "SpecialAirSStart"],
    [353, "SpecialAirS"],
    [354, "SpecialAirSEnd"],
    [355, "SpecialHiStart"],
    [356, "Unsupported"],
    // Invisible
    [357, "SpecialHi"],
    [358, "SpecialAirHiStart"],
    [359, "Unsupported"],
    // Invisible
    [360, "SpecialAirHi"],
    [361, "SpecialLw"],
    [362, "SpecialLw2"],
    [363, "SpecialAirLw"],
    [364, "SpecialAirLw2"]
  ])
}, l1 = {
  scale: 1.05,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 1.05 * 6,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "Guard"],
    [342, "Guard"],
    [343, "GuardOff"],
    [344, "GuardDamage"],
    [345, "GuardOn"],
    [346, "SpecialN1"],
    [347, "SpecialN2"],
    [348, ""],
    [349, "SpecialN2"],
    [350, ""],
    [351, "SpecialAirN1"],
    [352, "SpecialAirN2"],
    [353, ""],
    [354, "SpecialAirN2"],
    [355, ""],
    [356, "SpecialSStart"],
    [357, "SpecialSLoop"],
    [358, "SpecialSLoop"],
    [359, "SpecialSEnd"],
    [360, "SpecialAirSStart"],
    [361, "SpecialSLoop"],
    [362, "SpecialSLoop"],
    [363, "SpecialAirSEnd"],
    [364, "SpecialHi"],
    [365, "SpecialAirHi"],
    [366, "SpecialLw"],
    [367, "SpecialLwLanding"],
    [368, "SpecialAirLw"]
  ])
}, u1 = {
  scale: 0.96,
  shieldOffset: [2.724, 9.003],
  // model units // TODO
  shieldSize: 0.96 * 11.625,
  // world units
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3Hi"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3Lw"],
    ["AttackS3S", "AttackS3"],
    ["AttackS4Hi", "AttackS4Hi"],
    ["AttackS4HiS", "AttackS4Hi"],
    ["AttackS4Lw", "AttackS4Lw"],
    ["AttackS4LwS", "AttackS4Lw"],
    ["AttackS4S", "AttackS41"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "AttackS42"],
    [342, "AppealR"],
    [343, "AppealL"],
    [344, "SpecialNStart"],
    [345, "SpecialNLoop"],
    [346, "SpecialNEnd"],
    [347, "SpecialAirNStart"],
    [348, "SpecialAirNLoop"],
    [349, "SpecialAirNEnd"],
    [350, "SpecialS1"],
    [351, "SpecialS2"],
    [352, "SpecialS1"],
    [353, "SpecialAirS1"],
    [354, "SpecialAirS2"],
    [355, "SpecialAirS1"],
    [356, "SpecialHi"],
    [357, "SpecialAirHi"],
    [358, "SpecialLw"],
    [359, "SpecialAirLw"],
    [360, "AirCatch"],
    [361, "AirCatchHit"]
  ])
}, c1 = {
  scale: 1.26,
  shieldOffset: [0.541, 6.969],
  shieldSize: 1.26 * 11.875,
  animationMap: /* @__PURE__ */ new Map([
    ["AppealL", "AppealL"],
    ["AppealR", "AppealR"],
    ["AttackS3Hi", "AttackS3Hi"],
    ["AttackS3HiS", "AttackS3HiS"],
    ["AttackS3Lw", "AttackS3Lw"],
    ["AttackS3LwS", "AttackS3LwS"],
    ["AttackS3S", "AttackS3S"],
    ["AttackS4Hi", ""],
    ["AttackS4HiS", ""],
    ["AttackS4Lw", ""],
    ["AttackS4LwS", ""],
    ["AttackS4S", "AttackS4S"],
    ["BarrelWait", ""],
    ["Bury", ""],
    ["BuryJump", ""],
    ["BuryWait", ""],
    ["CaptureCaptain", ""],
    ["CaptureDamageKoopa", ""],
    ["CaptureDamageKoopaAir", ""],
    ["CaptureKirby", ""],
    ["CaptureKirbyYoshi", ""],
    ["CaptureKoopa", ""],
    ["CaptureKoopaAir", ""],
    ["CaptureMewtwo", ""],
    ["CaptureMewtwoAir", ""],
    ["CaptureWaitKirby", ""],
    ["CaptureWaitKoopa", ""],
    ["CaptureWaitKoopaAir", ""],
    ["CaptureYoshi", ""],
    ["CatchDashPull", "CatchWait"],
    ["CatchPull", "CatchWait"],
    ["DamageBind", ""],
    ["DamageIce", ""],
    ["DamageIceJump", "Fall"],
    ["DamageSong", ""],
    ["DamageSongRv", ""],
    ["DamageSongWait", ""],
    ["DeadDown", ""],
    ["DeadLeft", ""],
    ["DeadRight", ""],
    ["DeadUpFallHitCamera", ""],
    ["DeadUpFallHitCameraIce", ""],
    ["DeadUpFallIce", ""],
    ["DeadUpStar", ""],
    ["DeadUpStarIce", ""],
    ["DownReflect", ""],
    ["EntryEnd", "Entry"],
    ["EntryStart", "Entry"],
    ["Escape", "EscapeN"],
    ["FlyReflectCeil", ""],
    ["FlyReflectWall", "WallDamage"],
    ["Guard", "Guard"],
    ["GuardOff", "GuardOff"],
    ["GuardOn", "GuardOn"],
    ["GuardReflect", "Guard"],
    ["GuardSetOff", "GuardDamage"],
    ["ItemParasolDamageFall", ""],
    ["ItemParasolFall", ""],
    ["ItemParasolFallSpecial", ""],
    ["ItemParasolOpen", ""],
    ["KirbyYoshiEgg", ""],
    ["KneeBend", "Landing"],
    ["LandingFallSpecial", "Landing"],
    ["LiftTurn", ""],
    ["LiftWait", ""],
    ["LiftWalk1", ""],
    ["LiftWalk2", ""],
    ["LightThrowAirB4", "LightThrowAirB"],
    ["LightThrowAirF4", "LightThrowAirF"],
    ["LightThrowAirHi4", "LightThrowAirHi"],
    ["LightThrowAirLw4", "LightThrowAirLw"],
    ["LightThrowB4", "LightThrowB"],
    ["LightThrowF4", "LightThrowF"],
    ["LightThrowHi4", "LightThrowHi"],
    ["LightThrowLw4", "LightThrowLw"],
    ["Rebirth", "Entry"],
    ["RebirthWait", "Wait1"],
    ["ReboundStop", "Rebound"],
    ["RunDirect", ""],
    ["ShieldBreakDownD", "DownBoundD"],
    ["ShieldBreakDownU", "DownBoundU"],
    ["ShieldBreakFall", "DamageFall"],
    ["ShieldBreakFly", ""],
    ["ShieldBreakStandD", "DownStandD"],
    ["ShieldBreakStandU", "DownStandU"],
    ["ShoulderedTurn", ""],
    ["ShoulderedWait", ""],
    ["ShoulderedWalkFast", ""],
    ["ShoulderedWalkMiddle", ""],
    ["ShoulderedWalkSlow", ""],
    ["SwordSwing1", "Swing1"],
    ["SwordSwing3", "Swing3"],
    ["SwordSwing4", "Swing4"],
    ["SwordSwingDash", "SwingDash"],
    ["ThrownB", ""],
    ["ThrownCopyStar", ""],
    ["ThrownF", ""],
    ["ThrownFB", ""],
    ["ThrownFF", ""],
    ["ThrownFHi", ""],
    ["ThrownFLw", ""],
    ["ThrownHi", ""],
    ["ThrownKirby", ""],
    ["ThrownKirbyStar", ""],
    ["ThrownKoopaAirB", ""],
    ["ThrownKoopaAirF", ""],
    ["ThrownKoopaB", ""],
    ["ThrownKoopaF", ""],
    ["ThrownLw", ""],
    ["ThrownLwWomen", ""],
    ["ThrownMewtwo", ""],
    ["ThrownMewtwoAir", ""],
    ["Wait", "Wait1"],
    ["YoshiEgg", ""]
  ]),
  specialsMap: /* @__PURE__ */ new Map([
    [341, "SpecialN"],
    [342, "SpecialAirN"],
    [343, "SpecialSStart"],
    [344, "SpecialSLoop"],
    [345, "SpecialSEnd"],
    [346, "SpecialAirSStart"],
    [347, "SpecialAirSLoop"],
    [348, "SpecialAirSEnd"],
    [349, "SpecialHiStart"],
    [350, "Unsupported"],
    // invisible
    [351, "SpecialHi"],
    [352, "SpecialAirHiStart"],
    [353, "Unsupported"],
    // invisible
    [354, "SpecialAirHi"],
    [355, "SpecialLw"],
    [356, "SpecialLw2"],
    [357, "SpecialAirLw"],
    [358, "SpecialAirLw2"]
  ])
}, h1 = [
  Q0,
  Y0,
  G0,
  N0,
  q0,
  O0,
  X0,
  o1,
  e1,
  t1,
  hc,
  // Popo
  hc,
  // Nana
  a1,
  n1,
  l1,
  J0,
  j0,
  Z0,
  V0,
  c1,
  u1,
  U0,
  x0,
  r1,
  $0,
  z0,
  i1
];
function nh(n, r, i) {
  return {
    playerIndex: n.playerIndex ?? 0,
    internalCharacterId: n.internalCharacterId ?? 0,
    actionStateId: n.actionStateId ?? 0,
    actionStateFrameCounter: n.actionStateCounter ?? 0,
    xPosition: n.positionX ?? 0,
    yPosition: n.positionY ?? 0,
    facingDirection: n.facingDirection ?? 1,
    shieldSize: n.shieldSize ?? 0,
    lCancelStatus: n.lCancelStatus ?? 0,
    hurtboxCollisionState: n.hurtboxCollisionState ?? 0,
    joystickX: (r == null ? void 0 : r.joystickX) ?? void 0,
    joystickY: (r == null ? void 0 : r.joystickY) ?? void 0,
    trigger: (r == null ? void 0 : r.trigger) ?? void 0,
    frameNumber: i
  };
}
const f1 = Mi.indexOf("Zelda"), s1 = Mi.indexOf("Sheik"), p1 = So.indexOf("Zelda"), S1 = So.indexOf("Sheik");
function fo(n, r) {
  return n === f1 ? p1 : n === s1 ? S1 : r;
}
function w1(n, r, i = {}) {
  const l = h1[n.internalCharacterId];
  if (!l)
    return null;
  const u = A1(n, i) ?? n, h = t0[n.actionStateId], S = (h !== void 0 ? l.animationMap.get(h) : void 0) ?? l.specialsMap.get(n.actionStateId) ?? h ?? "", A = r[S], T = Math.floor(Math.max(0, n.actionStateFrameCounter)) % ((A == null ? void 0 : A.length) ?? 1), g = A == null ? void 0 : A[T], d = g !== void 0 && g.startsWith("frame") ? A == null ? void 0 : A[Number(g.slice(5))] : g, w = S === "DamageFlyRoll" ? m1(n, i) : L1(n) ? T1(u) : 0, L = _1(S) ? n.facingDirection : u.facingDirection, D = y1(n.playerIndex, i);
  return {
    playerState: n,
    path: d,
    innerColor: D,
    shield: g1(n, u, l, S, D),
    outerColor: u.lCancelStatus === 2 ? "red" : n.hurtboxCollisionState !== 0 ? "blue" : "black",
    transforms: [
      `translate(${n.xPosition} ${n.yPosition})`,
      `rotate(${w} 0 8)`,
      `scale(${l.scale} ${l.scale})`,
      `scale(${L} 1)`,
      "scale(.1 -.1) translate(-500 -500)"
    ],
    animationName: S,
    characterData: l,
    invulnerable: n.hurtboxCollisionState !== 0
  };
}
const d1 = ["GuardOn", "Guard", "GuardReflect", "GuardDamage"];
function g1(n, r, i, l, u) {
  if (!d1.includes(l))
    return null;
  const h = l === "GuardDamage" ? r.trigger ?? n.trigger ?? 0 : n.trigger ?? 0, A = 1 - 0.5 * ((h === 0 ? 1 : h) - 0.3) / 0.7, T = n.shieldSize * A / 60 * 0.85 + 0.15;
  return {
    cx: n.xPosition + i.shieldOffset[0] * n.facingDirection,
    cy: n.yPosition + i.shieldOffset[1],
    r: i.shieldSize * T,
    color: u
  };
}
function A1(n, r) {
  if (!r.getStateOnFrame)
    return;
  let i = n;
  for (; ; ) {
    const l = r.getStateOnFrame(n.playerIndex, i.frameNumber - 1);
    if (!l || l.actionStateId !== i.actionStateId || l.actionStateFrameCounter > i.actionStateFrameCounter)
      return i;
    i = l;
  }
}
function m1(n, r) {
  var h;
  const i = (h = r.getStateOnFrame) == null ? void 0 : h.call(r, n.playerIndex, n.frameNumber - 1);
  if (!i)
    return 0;
  const l = n.xPosition - i.xPosition, u = n.yPosition - i.yPosition;
  return Math.atan2(u, l) * 180 / Math.PI - 90;
}
function L1(n) {
  const r = Mi[n.internalCharacterId];
  return ["Fox", "Falco"].includes(r) && [355, 356].includes(n.actionStateId);
}
function T1(n) {
  const r = n.joystickX ?? 0, i = n.joystickY ?? 0;
  return (r === 0 && i === 0 ? Math.PI / 2 : Math.atan2(i, r)) * 180 / Math.PI - (n.facingDirection === -1 ? 180 : 0);
}
function _1(n) {
  return n.includes("Jump") || ["SpecialHi", "SpecialAirHi"].includes(n);
}
function y1(n, r) {
  var l;
  return r.isTeams && r.teamId !== void 0 ? ((l = [
    ["#991b1b", "#dc2626"],
    // red 800 / 600
    ["#166534", "#16a34a"],
    // green 800 / 600
    ["#1e40af", "#2563eb"]
    // blue 800 / 600
  ][r.teamId]) == null ? void 0 : l[r.teamShade ?? 0]) ?? "#000000" : ["#b91c1c", "#1d4ed8", "#eab308", "#15803d"][n] ?? "#000000";
}
const Fa = (n) => n == null || n < 0 ? null : n <= 3 ? "blast" : n <= 5 ? "star" : null, Ri = 131, fc = 0.6, k1 = 0.1, D1 = 1080;
function sc(n, r, i, l = 1) {
  const u = Math.min(1, Math.max(0, i / Ri)), h = 1 - (1 - u) * (1 - u);
  return {
    x: n.x + (r.x - n.x) * h,
    y: n.y + (r.y - n.y) * h,
    scale: fc + (k1 - fc) * h,
    // The spin keeps one speed (only the fall slows down).
    angle: D1 * u * (l < 0 ? -1 : 1)
  };
}
const F1 = 30, C1 = 0.85;
function B1(n, r) {
  const i = (r.xMin + r.xMax) / 2, l = (r.yMin + r.yMax) / 2, u = l + (r.yMax - l) * C1, S = Math.max(0, n.y - u) * Math.tan(F1 * Math.PI / 180), A = n.x > i ? Math.max(i, n.x - S) : Math.min(i, n.x + S);
  return { x: Math.min(r.xMax, Math.max(r.xMin, A)), y: u };
}
function v1(n, r) {
  const i = [];
  for (const l of r) {
    const u = Fa(l.actionStateId), h = n[l.playerIndex];
    u && h !== void 0 && !Fa(h) && i.push({ ...l, kind: u });
  }
  return i;
}
const Wi = (n, r, i) => Math.min(i, Math.max(r, n));
function b1(n, r, i, l = 0.06) {
  const u = (r.xMax - r.xMin) * l, h = (r.yMax - r.yMin) * l, S = { xMin: r.xMin + u, xMax: r.xMax - u, yMin: r.yMin + h, yMax: r.yMax - h };
  if (n.kind === "star")
    return { x: Wi(n.x, S.xMin, S.xMax), y: Wi(n.y, S.yMin, S.yMax), angle: 0 };
  const A = i ?? r;
  return { ...{ x: Wi(n.x, A.xMin, A.xMax), y: Wi(n.y, A.yMin, A.yMax) }, angle: n.actionStateId === 0 ? 90 : n.actionStateId === 1 ? 0 : n.actionStateId === 3 ? -90 : 180 };
}
const pc = { blast: 1100, star: 700 };
function W1(n) {
  so(n, "svelte-5zdrfu", ".ko-beam.svelte-5zdrfu{transform-box:fill-box;transform-origin:left center;animation:svelte-5zdrfu-ko-beam 1.1s cubic-bezier(0.2, 0.9, 0.3, 1) forwards}@keyframes svelte-5zdrfu-ko-beam{0%{transform:scale(0.05, 0.5);opacity:1}14%{transform:scale(1, 1.1);opacity:1}55%{transform:scale(1.05, 0.8);opacity:0.95}100%{transform:scale(1.1, 0.05);opacity:0}}.ko-flash.svelte-5zdrfu{transform-box:fill-box;transform-origin:center;animation:svelte-5zdrfu-ko-flash 0.55s ease-out forwards}@keyframes svelte-5zdrfu-ko-flash{0%{transform:scale(0.3);opacity:1}100%{transform:scale(1.8);opacity:0}}.ko-spark.svelte-5zdrfu{transform-box:fill-box;transform-origin:center;opacity:0;animation:svelte-5zdrfu-ko-spark 0.6s ease-out forwards}@keyframes svelte-5zdrfu-ko-spark{0%{transform:scale(0) rotate(0deg);opacity:0}30%{transform:scale(1.3) rotate(30deg);opacity:1}100%{transform:scale(0) rotate(90deg);opacity:0}}.ko-star.svelte-5zdrfu{transform-box:fill-box;transform-origin:center;animation:svelte-5zdrfu-ko-star 0.7s ease-in-out forwards}@keyframes svelte-5zdrfu-ko-star{0%{transform:scale(0) rotate(0deg);opacity:0}35%{transform:scale(1.6) rotate(25deg);opacity:1}100%{transform:scale(0) rotate(60deg);opacity:0}}.char-invuln.svelte-5zdrfu{animation:svelte-5zdrfu-invuln-blink 0.5s ease-in-out infinite}@keyframes svelte-5zdrfu-invuln-blink{0%,100%{opacity:1}50%{opacity:0.45}}.star-spin.svelte-5zdrfu{transform-box:fill-box;transform-origin:center}.viewer-stage.svelte-5zdrfu polyline{fill:none;stroke:var(--secondary-color, #888);stroke-width:1.5;opacity:0.55}.viewer-stage.svelte-5zdrfu rect{fill:none;stroke:var(--secondary-color, #888);stroke-width:0.5;opacity:0.2}");
}
function Sc(n, r, i) {
  const l = n.slice();
  return l[53] = r[i], l;
}
function wc(n, r, i) {
  const l = n.slice();
  return l[56] = r[i], l;
}
function dc(n, r, i) {
  const l = n.slice();
  return l[59] = r[i][0], l[60] = r[i][1], l[61] = r[i][2], l[62] = r[i][3], l;
}
function gc(n, r, i) {
  const l = n.slice();
  return l[65] = r[i][0], l[66] = r[i][1], l[67] = r[i][2], l;
}
function Ac(n, r, i) {
  const l = n.slice();
  return l[70] = r[i], l[72] = i, l;
}
function mc(n, r, i) {
  const l = n.slice();
  return l[73] = r[i], l;
}
function Lc(n) {
  let r, i, l, u, h = [], S = /* @__PURE__ */ new Map(), A, T = [], g = /* @__PURE__ */ new Map(), d, w = [], L = /* @__PURE__ */ new Map(), D, C = [], B = /* @__PURE__ */ new Map(), v, I = (
    /*showStage*/
    n[1] && Tc(n)
  ), fe = (
    /*renderDatas*/
    n[3]
  );
  const N = (R) => (
    /*rd*/
    R[73].playerState.playerIndex
  );
  for (let R = 0; R < fe.length; R += 1) {
    let K = mc(n, fe, R), Y = N(K);
    S.set(Y, h[R] = kc(Y, K));
  }
  let M = (
    /*items*/
    n[8]
  );
  const oe = (R) => (
    /*i*/
    R[72]
  );
  for (let R = 0; R < M.length; R += 1) {
    let K = Ac(n, M, R), Y = oe(K);
    g.set(Y, T[R] = Dc(Y, K));
  }
  let te = (
    /*effects*/
    n[2]
  );
  const V = (R) => (
    /*e*/
    R[56].id
  );
  for (let R = 0; R < te.length; R += 1) {
    let K = wc(n, te, R), Y = V(K);
    L.set(Y, w[R] = Bc(Y, K));
  }
  let x = (
    /*magnifiers*/
    n[7]
  );
  const ue = (R) => (
    /*g*/
    R[53].key
  );
  for (let R = 0; R < x.length; R += 1) {
    let K = Sc(n, x, R), Y = ue(K);
    B.set(Y, C[R] = vc(Y, K));
  }
  return {
    c() {
      r = X("svg"), i = X("g"), l = X("g"), I && I.c(), u = Ue();
      for (let R = 0; R < h.length; R += 1)
        h[R].c();
      A = Ue();
      for (let R = 0; R < T.length; R += 1)
        T[R].c();
      d = Ue();
      for (let R = 0; R < w.length; R += 1)
        w[R].c();
      D = Ue();
      for (let R = 0; R < C.length; R += 1)
        C[R].c();
      p(
        l,
        "transform",
        /*cameraTransform*/
        n[9]
      ), p(i, "class", "-scale-y-100"), p(r, "class", "w-full h-full"), p(
        r,
        "viewBox",
        /*viewBox*/
        n[5]
      ), p(
        r,
        "preserveAspectRatio",
        /*aspect*/
        n[10]
      ), p(r, "stroke", "none"), p(r, "stroke-width", "1");
    },
    m(R, K) {
      U(R, r, K), Z(r, i), Z(i, l), I && I.m(l, null), Z(l, u);
      for (let Y = 0; Y < h.length; Y += 1)
        h[Y] && h[Y].m(l, null);
      Z(l, A);
      for (let Y = 0; Y < T.length; Y += 1)
        T[Y] && T[Y].m(l, null);
      Z(l, d);
      for (let Y = 0; Y < w.length; Y += 1)
        w[Y] && w[Y].m(l, null);
      Z(l, D);
      for (let Y = 0; Y < C.length; Y += 1)
        C[Y] && C[Y].m(l, null);
      n[39](r), v = !0;
    },
    p(R, K) {
      /*showStage*/
      R[1] ? I ? (I.p(R, K), K[0] & /*showStage*/
      2 && xe(I, 1)) : (I = Tc(R), I.c(), xe(I, 1), I.m(l, u)) : I && (Ba(), ct(I, 1, 1, () => {
        I = null;
      }), va()), K[0] & /*renderDatas*/
      8 && (fe = /*renderDatas*/
      R[3], h = ya(h, K, N, 1, R, fe, S, l, Ei, kc, A, mc)), K[0] & /*items, frame*/
      257 && (M = /*items*/
      R[8], Ba(), T = ya(T, K, oe, 1, R, M, g, l, Jg, Dc, d, Ac), va()), K[0] & /*effects, SPARKS, BEAMS*/
      12292 && (te = /*effects*/
      R[2], w = ya(w, K, V, 1, R, te, L, l, Ei, Bc, D, wc)), K[0] & /*magnifiers, uid*/
      2176 && (x = /*magnifiers*/
      R[7], C = ya(C, K, ue, 1, R, x, B, l, Ei, vc, null, Sc)), (!v || K[0] & /*cameraTransform*/
      512) && p(
        l,
        "transform",
        /*cameraTransform*/
        R[9]
      ), (!v || K[0] & /*viewBox*/
      32) && p(
        r,
        "viewBox",
        /*viewBox*/
        R[5]
      ), (!v || K[0] & /*aspect*/
      1024) && p(
        r,
        "preserveAspectRatio",
        /*aspect*/
        R[10]
      );
    },
    i(R) {
      if (!v) {
        xe(I);
        for (let K = 0; K < M.length; K += 1)
          xe(T[K]);
        v = !0;
      }
    },
    o(R) {
      ct(I);
      for (let K = 0; K < T.length; K += 1)
        ct(T[K]);
      v = !1;
    },
    d(R) {
      R && G(r), I && I.d();
      for (let K = 0; K < h.length; K += 1)
        h[K].d();
      for (let K = 0; K < T.length; K += 1)
        T[K].d();
      for (let K = 0; K < w.length; K += 1)
        w[K].d();
      for (let K = 0; K < C.length; K += 1)
        C[K].d();
      n[39](null);
    }
  };
}
function Tc(n) {
  let r, i, l;
  return i = new e0({
    props: {
      stageId: (
        /*stageId*/
        n[4]
      ),
      frame: (
        /*frame*/
        n[0]
      )
    }
  }), {
    c() {
      r = X("g"), Ki(i.$$.fragment), p(r, "class", "viewer-stage svelte-5zdrfu");
    },
    m(u, h) {
      U(u, r, h), ba(i, r, null), l = !0;
    },
    p(u, h) {
      const S = {};
      h[0] & /*stageId*/
      16 && (S.stageId = /*stageId*/
      u[4]), h[0] & /*frame*/
      1 && (S.frame = /*frame*/
      u[0]), i.$set(S);
    },
    i(u) {
      l || (xe(i.$$.fragment, u), l = !0);
    },
    o(u) {
      ct(i.$$.fragment, u), l = !1;
    },
    d(u) {
      u && G(r), Wa(i);
    }
  };
}
function _c(n) {
  let r, i, l, u, h, S, A;
  return {
    c() {
      r = X("g"), i = X("ellipse"), u = X("rect"), h = X("rect"), p(i, "cx", "0"), p(i, "cy", "-1.5"), p(i, "rx", "13"), p(i, "ry", "3.2"), p(i, "fill", l = /*rd*/
      n[73].innerColor), p(i, "opacity", "0.35"), p(u, "x", "-11"), p(u, "y", "-2.6"), p(u, "width", "22"), p(u, "height", "2.6"), p(u, "rx", "1.3"), p(u, "fill", "#ffffff"), p(u, "opacity", "0.9"), p(h, "x", "-11"), p(h, "y", "-2.6"), p(h, "width", "22"), p(h, "height", "1"), p(h, "rx", "0.5"), p(h, "fill", S = /*rd*/
      n[73].innerColor), p(h, "opacity", "0.8"), p(r, "transform", A = `translate(${/*rd*/
      n[73].playerState.xPosition} ${/*rd*/
      n[73].playerState.yPosition})`);
    },
    m(T, g) {
      U(T, r, g), Z(r, i), Z(r, u), Z(r, h);
    },
    p(T, g) {
      g[0] & /*renderDatas*/
      8 && l !== (l = /*rd*/
      T[73].innerColor) && p(i, "fill", l), g[0] & /*renderDatas*/
      8 && S !== (S = /*rd*/
      T[73].innerColor) && p(h, "fill", S), g[0] & /*renderDatas*/
      8 && A !== (A = `translate(${/*rd*/
      T[73].playerState.xPosition} ${/*rd*/
      T[73].playerState.yPosition})`) && p(r, "transform", A);
    },
    d(T) {
      T && G(r);
    }
  };
}
function H1(n) {
  let r, i, l, u, h;
  return {
    c() {
      r = X("path"), p(r, "transform", i = /*rd*/
      n[73].transforms.join(" ")), p(r, "d", l = /*rd*/
      n[73].path), p(r, "fill", u = /*rd*/
      n[73].innerColor), p(r, "stroke", h = /*rd*/
      n[73].outerColor), p(r, "stroke-width", "2"), p(r, "class", "svelte-5zdrfu"), na(
        r,
        "char-invuln",
        /*rd*/
        n[73].invulnerable
      );
    },
    m(S, A) {
      U(S, r, A);
    },
    p(S, A) {
      A[0] & /*renderDatas*/
      8 && i !== (i = /*rd*/
      S[73].transforms.join(" ")) && p(r, "transform", i), A[0] & /*renderDatas*/
      8 && l !== (l = /*rd*/
      S[73].path) && p(r, "d", l), A[0] & /*renderDatas*/
      8 && u !== (u = /*rd*/
      S[73].innerColor) && p(r, "fill", u), A[0] & /*renderDatas*/
      8 && h !== (h = /*rd*/
      S[73].outerColor) && p(r, "stroke", h), A[0] & /*renderDatas*/
      8 && na(
        r,
        "char-invuln",
        /*rd*/
        S[73].invulnerable
      );
    },
    d(S) {
      S && G(r);
    }
  };
}
function E1(n) {
  let r, i, l, u, h, S, A, T, g;
  return {
    c() {
      r = X("g"), i = X("g"), l = X("path"), p(l, "transform", u = /*rd*/
      n[73].transforms.join(" ")), p(l, "d", h = /*rd*/
      n[73].path), p(l, "fill", S = /*rd*/
      n[73].innerColor), p(l, "stroke", A = /*rd*/
      n[73].outerColor), p(l, "stroke-width", "2"), p(i, "class", "star-spin svelte-5zdrfu"), p(i, "style", T = `transform: rotate(${/*rd*/
      n[73].starSpin ?? 0}deg)`), p(r, "transform", g = /*rd*/
      n[73].starPlace);
    },
    m(d, w) {
      U(d, r, w), Z(r, i), Z(i, l);
    },
    p(d, w) {
      w[0] & /*renderDatas*/
      8 && u !== (u = /*rd*/
      d[73].transforms.join(" ")) && p(l, "transform", u), w[0] & /*renderDatas*/
      8 && h !== (h = /*rd*/
      d[73].path) && p(l, "d", h), w[0] & /*renderDatas*/
      8 && S !== (S = /*rd*/
      d[73].innerColor) && p(l, "fill", S), w[0] & /*renderDatas*/
      8 && A !== (A = /*rd*/
      d[73].outerColor) && p(l, "stroke", A), w[0] & /*renderDatas*/
      8 && T !== (T = `transform: rotate(${/*rd*/
      d[73].starSpin ?? 0}deg)`) && p(i, "style", T), w[0] & /*renderDatas*/
      8 && g !== (g = /*rd*/
      d[73].starPlace) && p(r, "transform", g);
    },
    d(d) {
      d && G(r);
    }
  };
}
function yc(n) {
  let r, i, l, u, h;
  return {
    c() {
      r = X("circle"), p(r, "cx", i = /*rd*/
      n[73].shield.cx), p(r, "cy", l = /*rd*/
      n[73].shield.cy), p(r, "r", u = /*rd*/
      n[73].shield.r), p(r, "fill", h = /*rd*/
      n[73].shield.color), p(r, "opacity", "0.6");
    },
    m(S, A) {
      U(S, r, A);
    },
    p(S, A) {
      A[0] & /*renderDatas*/
      8 && i !== (i = /*rd*/
      S[73].shield.cx) && p(r, "cx", i), A[0] & /*renderDatas*/
      8 && l !== (l = /*rd*/
      S[73].shield.cy) && p(r, "cy", l), A[0] & /*renderDatas*/
      8 && u !== (u = /*rd*/
      S[73].shield.r) && p(r, "r", u), A[0] & /*renderDatas*/
      8 && h !== (h = /*rd*/
      S[73].shield.color) && p(r, "fill", h);
    },
    d(S) {
      S && G(r);
    }
  };
}
function kc(n, r) {
  let i, l, u, h, S = (
    /*rd*/
    (r[73].playerState.actionStateId === 12 || /*rd*/
    r[73].playerState.actionStateId === 13) && _c(r)
  );
  function A(w, L) {
    if (
      /*rd*/
      w[73].path && /*rd*/
      w[73].starPlace
    )
      return E1;
    if (
      /*rd*/
      w[73].path
    )
      return H1;
  }
  let T = A(r), g = T && T(r), d = (
    /*rd*/
    r[73].shield && yc(r)
  );
  return {
    key: n,
    first: null,
    c() {
      i = Ue(), S && S.c(), l = Ue(), g && g.c(), u = Ue(), d && d.c(), h = Ue(), this.first = i;
    },
    m(w, L) {
      U(w, i, L), S && S.m(w, L), U(w, l, L), g && g.m(w, L), U(w, u, L), d && d.m(w, L), U(w, h, L);
    },
    p(w, L) {
      r = w, /*rd*/
      r[73].playerState.actionStateId === 12 || /*rd*/
      r[73].playerState.actionStateId === 13 ? S ? S.p(r, L) : (S = _c(r), S.c(), S.m(l.parentNode, l)) : S && (S.d(1), S = null), T === (T = A(r)) && g ? g.p(r, L) : (g && g.d(1), g = T && T(r), g && (g.c(), g.m(u.parentNode, u))), /*rd*/
      r[73].shield ? d ? d.p(r, L) : (d = yc(r), d.c(), d.m(h.parentNode, h)) : d && (d.d(1), d = null);
    },
    d(w) {
      w && G(i), S && S.d(w), w && G(l), g && g.d(w), w && G(u), d && d.d(w), w && G(h);
    }
  };
}
function Dc(n, r) {
  var h, S, A, T, g, d, w, L, D, C, B, v;
  let i, l, u;
  return l = new g0({
    props: {
      item: (
        /*item*/
        r[70]
      ),
      ownerX: (
        /*item*/
        r[70].owner != null ? (
          /*frame*/
          ((T = (A = (S = (h = r[0]) == null ? void 0 : h.players) == null ? void 0 : S[
            /*item*/
            r[70].owner
          ]) == null ? void 0 : A.post) == null ? void 0 : T.positionX) ?? null
        ) : null
      ),
      ownerY: (
        /*item*/
        r[70].owner != null ? (
          /*frame*/
          ((L = (w = (d = (g = r[0]) == null ? void 0 : g.players) == null ? void 0 : d[
            /*item*/
            r[70].owner
          ]) == null ? void 0 : w.post) == null ? void 0 : L.positionY) ?? null
        ) : null
      ),
      ownerFacing: (
        /*item*/
        (r[70].owner != null ? (
          /*frame*/
          (v = (B = (C = (D = r[0]) == null ? void 0 : D.players) == null ? void 0 : C[
            /*item*/
            r[70].owner
          ]) == null ? void 0 : B.post) == null ? void 0 : v.facingDirection
        ) : 1) ?? 1
      )
    }
  }), {
    key: n,
    first: null,
    c() {
      i = Ue(), Ki(l.$$.fragment), this.first = i;
    },
    m(I, fe) {
      U(I, i, fe), ba(l, I, fe), u = !0;
    },
    p(I, fe) {
      var M, oe, te, V, x, ue, R, K, Y, _e, Be, Ye;
      r = I;
      const N = {};
      fe[0] & /*items*/
      256 && (N.item = /*item*/
      r[70]), fe[0] & /*items, frame*/
      257 && (N.ownerX = /*item*/
      r[70].owner != null ? (
        /*frame*/
        ((V = (te = (oe = (M = r[0]) == null ? void 0 : M.players) == null ? void 0 : oe[
          /*item*/
          r[70].owner
        ]) == null ? void 0 : te.post) == null ? void 0 : V.positionX) ?? null
      ) : null), fe[0] & /*items, frame*/
      257 && (N.ownerY = /*item*/
      r[70].owner != null ? (
        /*frame*/
        ((K = (R = (ue = (x = r[0]) == null ? void 0 : x.players) == null ? void 0 : ue[
          /*item*/
          r[70].owner
        ]) == null ? void 0 : R.post) == null ? void 0 : K.positionY) ?? null
      ) : null), fe[0] & /*items, frame*/
      257 && (N.ownerFacing = /*item*/
      (r[70].owner != null ? (
        /*frame*/
        (Ye = (Be = (_e = (Y = r[0]) == null ? void 0 : Y.players) == null ? void 0 : _e[
          /*item*/
          r[70].owner
        ]) == null ? void 0 : Be.post) == null ? void 0 : Ye.facingDirection
      ) : 1) ?? 1), l.$set(N);
    },
    i(I) {
      u || (xe(l.$$.fragment, I), u = !0);
    },
    o(I) {
      ct(l.$$.fragment, I), u = !1;
    },
    d(I) {
      I && G(i), Wa(l, I);
    }
  };
}
function R1(n) {
  let r, i, l, u, h;
  return {
    c() {
      r = X("g"), i = X("circle"), l = X("path"), u = X("circle"), p(i, "r", "22"), p(i, "fill", "#fff7cc"), p(i, "opacity", "0.35"), p(l, "d", "M0 -18 L4 -4 L18 0 L4 4 L0 18 L-4 4 L-18 0 L-4 -4 Z"), p(l, "fill", "#ffffff"), p(u, "r", "4"), p(u, "fill", h = /*e*/
      n[56].color), p(r, "class", "ko-star svelte-5zdrfu");
    },
    m(S, A) {
      U(S, r, A), Z(r, i), Z(r, l), Z(r, u);
    },
    p(S, A) {
      A[0] & /*effects*/
      4 && h !== (h = /*e*/
      S[56].color) && p(u, "fill", h);
    },
    d(S) {
      S && G(r);
    }
  };
}
function I1(n) {
  let r, i, l, u, h, S = (
    /*BEAMS*/
    n[12]
  ), A = [];
  for (let d = 0; d < S.length; d += 1)
    A[d] = Fc(gc(n, S, d));
  let T = (
    /*SPARKS*/
    n[13]
  ), g = [];
  for (let d = 0; d < T.length; d += 1)
    g[d] = Cc(dc(n, T, d));
  return {
    c() {
      for (let d = 0; d < A.length; d += 1)
        A[d].c();
      r = X("g"), i = X("circle"), u = X("circle");
      for (let d = 0; d < g.length; d += 1)
        g[d].c();
      h = Ue(), p(i, "r", "46"), p(i, "fill", l = /*e*/
      n[56].color), p(i, "opacity", "0.6"), p(u, "r", "26"), p(u, "fill", "#ffffff"), p(r, "class", "ko-flash svelte-5zdrfu");
    },
    m(d, w) {
      for (let L = 0; L < A.length; L += 1)
        A[L] && A[L].m(d, w);
      U(d, r, w), Z(r, i), Z(r, u);
      for (let L = 0; L < g.length; L += 1)
        g[L] && g[L].m(d, w);
      U(d, h, w);
    },
    p(d, w) {
      if (w[0] & /*BEAMS, effects*/
      4100) {
        S = /*BEAMS*/
        d[12];
        let L;
        for (L = 0; L < S.length; L += 1) {
          const D = gc(d, S, L);
          A[L] ? A[L].p(D, w) : (A[L] = Fc(D), A[L].c(), A[L].m(r.parentNode, r));
        }
        for (; L < A.length; L += 1)
          A[L].d(1);
        A.length = S.length;
      }
      if (w[0] & /*effects*/
      4 && l !== (l = /*e*/
      d[56].color) && p(i, "fill", l), w[0] & /*SPARKS*/
      8192) {
        T = /*SPARKS*/
        d[13];
        let L;
        for (L = 0; L < T.length; L += 1) {
          const D = dc(d, T, L);
          g[L] ? g[L].p(D, w) : (g[L] = Cc(D), g[L].c(), g[L].m(h.parentNode, h));
        }
        for (; L < g.length; L += 1)
          g[L].d(1);
        g.length = T.length;
      }
    },
    d(d) {
      ia(A, d), d && G(r), ia(g, d), d && G(h);
    }
  };
}
function Fc(n) {
  let r, i, l, u, h, S, A;
  return {
    c() {
      r = X("g"), i = X("g"), l = X("path"), h = X("path"), A = X("path"), p(l, "d", "M0 -74 Q-26 0 0 74 Q60 64 340 3 L340 -3 Q60 -64 0 -74 Z"), p(l, "fill", u = /*e*/
      n[56].color), p(l, "opacity", "0.55"), p(h, "d", "M0 -46 Q-16 0 0 46 Q50 38 310 2 L310 -2 Q50 -38 0 -46 Z"), p(h, "fill", S = /*e*/
      n[56].color), p(A, "d", "M0 -18 Q-7 0 0 18 Q40 14 270 1 L270 -1 Q40 -14 0 -18 Z"), p(A, "fill", "#ffffff"), p(A, "opacity", "0.95"), p(i, "class", "ko-beam svelte-5zdrfu"), p(r, "transform", `rotate(${/*tilt*/
      n[65]}) scale(${/*scale*/
      n[66]})`), p(
        r,
        "opacity",
        /*opacity*/
        n[67]
      );
    },
    m(T, g) {
      U(T, r, g), Z(r, i), Z(i, l), Z(i, h), Z(i, A);
    },
    p(T, g) {
      g[0] & /*effects*/
      4 && u !== (u = /*e*/
      T[56].color) && p(l, "fill", u), g[0] & /*effects*/
      4 && S !== (S = /*e*/
      T[56].color) && p(h, "fill", S);
    },
    d(T) {
      T && G(r);
    }
  };
}
function Cc(n) {
  let r, i;
  return {
    c() {
      r = X("g"), i = X("path"), p(i, "class", "ko-spark svelte-5zdrfu"), p(i, "style", `animation-delay: ${/*delay*/
      n[61]}ms`), p(i, "d", `M0 ${-/*r*/
      n[62] * 2} L${/*r*/
      n[62] * 0.5} ${-/*r*/
      n[62] * 0.5} L${/*r*/
      n[62] * 2} 0 L${/*r*/
      n[62] * 0.5} ${/*r*/
      n[62] * 0.5} L0 ${/*r*/
      n[62] * 2} L${-/*r*/
      n[62] * 0.5} ${/*r*/
      n[62] * 0.5} L${-/*r*/
      n[62] * 2} 0 L${-/*r*/
      n[62] * 0.5} ${-/*r*/
      n[62] * 0.5} Z`), p(i, "fill", "#ffffff"), p(r, "transform", `translate(${/*x*/
      n[59]} ${/*y*/
      n[60]})`);
    },
    m(l, u) {
      U(l, r, u), Z(r, i);
    },
    p: Xe,
    d(l) {
      l && G(r);
    }
  };
}
function Bc(n, r) {
  let i, l;
  function u(A, T) {
    return (
      /*e*/
      A[56].kind === "blast" ? I1 : R1
    );
  }
  let h = u(r), S = h(r);
  return {
    key: n,
    first: null,
    c() {
      i = X("g"), S.c(), p(i, "transform", l = `translate(${/*e*/
      r[56].x} ${/*e*/
      r[56].y}) rotate(${/*e*/
      r[56].angle}) scale(${/*e*/
      r[56].size})`), this.first = i;
    },
    m(A, T) {
      U(A, i, T), S.m(i, null);
    },
    p(A, T) {
      r = A, h === (h = u(r)) && S ? S.p(r, T) : (S.d(1), S = h(r), S && (S.c(), S.m(i, null))), T[0] & /*effects*/
      4 && l !== (l = `translate(${/*e*/
      r[56].x} ${/*e*/
      r[56].y}) rotate(${/*e*/
      r[56].angle}) scale(${/*e*/
      r[56].size})`) && p(i, "transform", l);
    },
    d(A) {
      A && G(i), S.d();
    }
  };
}
function vc(n, r) {
  let i, l, u, h, S, A, T, g, d, w, L, D, C, B, v, I, fe, N, M, oe, te, V, x, ue, R, K, Y, _e, Be;
  return {
    key: n,
    first: null,
    c() {
      i = X("g"), l = X("clipPath"), u = X("circle"), g = X("circle"), D = X("g"), C = X("g"), B = X("path"), te = X("circle"), K = X("g"), Y = X("path"), p(u, "cx", h = /*g*/
      r[53].bx), p(u, "cy", S = /*g*/
      r[53].by), p(u, "r", A = /*g*/
      r[53].r), p(l, "id", T = `mag-${/*uid*/
      r[11]}-${/*g*/
      r[53].key}`), p(g, "cx", d = /*g*/
      r[53].bx), p(g, "cy", w = /*g*/
      r[53].by), p(g, "r", L = /*g*/
      r[53].r), p(g, "fill", "#0b1220"), p(g, "opacity", "0.55"), p(B, "transform", v = /*g*/
      r[53].rd.transforms.join(" ")), p(B, "d", I = /*g*/
      r[53].rd.path), p(B, "fill", fe = /*g*/
      r[53].rd.innerColor), p(B, "stroke", N = /*g*/
      r[53].rd.outerColor), p(B, "stroke-width", "2"), p(C, "transform", M = `translate(${/*g*/
      r[53].bx} ${/*g*/
      r[53].by}) scale(${/*g*/
      r[53].m}) translate(${-/*g*/
      r[53].cx} ${-/*g*/
      r[53].cy})`), p(D, "clip-path", oe = `url(#mag-${/*uid*/
      r[11]}-${/*g*/
      r[53].key})`), p(te, "cx", V = /*g*/
      r[53].bx), p(te, "cy", x = /*g*/
      r[53].by), p(te, "r", ue = /*g*/
      r[53].r), p(te, "fill", "none"), p(te, "stroke", "#ffffff"), p(te, "stroke-width", R = /*g*/
      r[53].r * 0.09), p(Y, "d", _e = `M${/*g*/
      r[53].r * 0.96} ${-/*g*/
      r[53].r * 0.28} L${/*g*/
      r[53].r * 1.32} 0 L${/*g*/
      r[53].r * 0.96} ${/*g*/
      r[53].r * 0.28} Z`), p(Y, "fill", "#ffffff"), p(K, "transform", Be = `translate(${/*g*/
      r[53].bx} ${/*g*/
      r[53].by}) rotate(${/*g*/
      r[53].angle})`), p(i, "class", "magnifier"), this.first = i;
    },
    m(Ye, Se) {
      U(Ye, i, Se), Z(i, l), Z(l, u), Z(i, g), Z(i, D), Z(D, C), Z(C, B), Z(i, te), Z(i, K), Z(K, Y);
    },
    p(Ye, Se) {
      r = Ye, Se[0] & /*magnifiers*/
      128 && h !== (h = /*g*/
      r[53].bx) && p(u, "cx", h), Se[0] & /*magnifiers*/
      128 && S !== (S = /*g*/
      r[53].by) && p(u, "cy", S), Se[0] & /*magnifiers*/
      128 && A !== (A = /*g*/
      r[53].r) && p(u, "r", A), Se[0] & /*magnifiers*/
      128 && T !== (T = `mag-${/*uid*/
      r[11]}-${/*g*/
      r[53].key}`) && p(l, "id", T), Se[0] & /*magnifiers*/
      128 && d !== (d = /*g*/
      r[53].bx) && p(g, "cx", d), Se[0] & /*magnifiers*/
      128 && w !== (w = /*g*/
      r[53].by) && p(g, "cy", w), Se[0] & /*magnifiers*/
      128 && L !== (L = /*g*/
      r[53].r) && p(g, "r", L), Se[0] & /*magnifiers*/
      128 && v !== (v = /*g*/
      r[53].rd.transforms.join(" ")) && p(B, "transform", v), Se[0] & /*magnifiers*/
      128 && I !== (I = /*g*/
      r[53].rd.path) && p(B, "d", I), Se[0] & /*magnifiers*/
      128 && fe !== (fe = /*g*/
      r[53].rd.innerColor) && p(B, "fill", fe), Se[0] & /*magnifiers*/
      128 && N !== (N = /*g*/
      r[53].rd.outerColor) && p(B, "stroke", N), Se[0] & /*magnifiers*/
      128 && M !== (M = `translate(${/*g*/
      r[53].bx} ${/*g*/
      r[53].by}) scale(${/*g*/
      r[53].m}) translate(${-/*g*/
      r[53].cx} ${-/*g*/
      r[53].cy})`) && p(C, "transform", M), Se[0] & /*magnifiers*/
      128 && oe !== (oe = `url(#mag-${/*uid*/
      r[11]}-${/*g*/
      r[53].key})`) && p(D, "clip-path", oe), Se[0] & /*magnifiers*/
      128 && V !== (V = /*g*/
      r[53].bx) && p(te, "cx", V), Se[0] & /*magnifiers*/
      128 && x !== (x = /*g*/
      r[53].by) && p(te, "cy", x), Se[0] & /*magnifiers*/
      128 && ue !== (ue = /*g*/
      r[53].r) && p(te, "r", ue), Se[0] & /*magnifiers*/
      128 && R !== (R = /*g*/
      r[53].r * 0.09) && p(te, "stroke-width", R), Se[0] & /*magnifiers*/
      128 && _e !== (_e = `M${/*g*/
      r[53].r * 0.96} ${-/*g*/
      r[53].r * 0.28} L${/*g*/
      r[53].r * 1.32} 0 L${/*g*/
      r[53].r * 0.96} ${/*g*/
      r[53].r * 0.28} Z`) && p(Y, "d", _e), Se[0] & /*magnifiers*/
      128 && Be !== (Be = `translate(${/*g*/
      r[53].bx} ${/*g*/
      r[53].by}) rotate(${/*g*/
      r[53].angle})`) && p(K, "transform", Be);
    },
    d(Ye) {
      Ye && G(i);
    }
  };
}
function K1(n) {
  let r, i, l = (
    /*stageId*/
    n[4] != null && Lc(n)
  );
  return {
    c() {
      l && l.c(), r = Ue();
    },
    m(u, h) {
      l && l.m(u, h), U(u, r, h), i = !0;
    },
    p(u, h) {
      /*stageId*/
      u[4] != null ? l ? (l.p(u, h), h[0] & /*stageId*/
      16 && xe(l, 1)) : (l = Lc(u), l.c(), xe(l, 1), l.m(r.parentNode, r)) : l && (Ba(), ct(l, 1, 1, () => {
        l = null;
      }), va());
    },
    i(u) {
      i || (xe(l), i = !0);
    },
    o(u) {
      ct(l), i = !1;
    },
    d(u) {
      l && l.d(u), u && G(r);
    }
  };
}
const bc = 0.025, Wc = 0.82, M1 = 34;
function P1(n, r, i) {
  let l, u, h, S, A, T, g, d, w, L, D, C, { settings: B } = r, { frame: v } = r, { showStage: I = !0 } = r, { getStateOnFrame: fe = void 0 } = r, { camera: N = "static" } = r, { zoom: M = 1 } = r, { fit: oe = "contain" } = r, te, V = 0, x = 0;
  Jc(() => {
    const Q = new ResizeObserver(([me]) => (i(22, V = me.contentRect.width), i(23, x = me.contentRect.height))), z = () => te && Q.observe(te);
    z();
    const re = setInterval(() => te && (z(), clearInterval(re)), 200);
    return () => (Q.disconnect(), clearInterval(re));
  });
  const ue = (Q, z, re) => Q + (z - Q) * re, R = (Q) => Q != null && Q >= 0 && Q <= 10, K = Math.ceil(pc.star / 1e3 * 60);
  let Y = null, _e = null, Be = [0, 0], Ye = null, Se = {}, Ze = {};
  function ht(Q) {
    const z = Mi[Q], re = So.indexOf(z);
    return re >= 0 ? re : 0;
  }
  function _t(Q, z, re) {
    const me = re ?? ht(z), J = fo(z, me);
    Ze[Q] !== J && (Ze = {
      ...Ze,
      [Q]: J
    }, ih(J).then((ae) => {
      i(28, Se = {
        ...Se,
        [Q]: ae
      });
    }).catch(() => {
    }));
  }
  function sr(Q) {
    var re;
    const z = (re = B == null ? void 0 : B.players) == null ? void 0 : re.find((me) => (me == null ? void 0 : me.playerIndex) === Q);
    return (z == null ? void 0 : z.characterId) ?? void 0;
  }
  let { koEffects: Qe = !0 } = r, { lastFrame: zt = null } = r, { twinkling: yt = !1 } = r, It = [], $e = 0, kt = {};
  const Jt = {};
  let Kt = {};
  const qt = (Q) => {
    const z = Kt[Q.playerIndex];
    return z != null && Q.stocks != null && Q.stocks < z;
  }, Xt = {}, Zt = (Q) => Xt[Q];
  let Dt = {};
  const tr = /* @__PURE__ */ new Set();
  qc(() => tr.forEach(clearTimeout));
  const ft = ["#b91c1c", "#1d4ed8", "#eab308", "#15803d"], Mt = { halfWidth: 10, height: 22 }, Pi = Math.random().toString(36).slice(2, 8), Pt = [[-17, 0.6, 0.6], [17, 0.6, 0.6], [0, 1, 1]], Ia = [
    [50, -44, 60, 7],
    [100, 30, 120, 6],
    [150, -18, 180, 8],
    [200, 12, 240, 5],
    [250, -6, 300, 6],
    [80, -58, 90, 5]
  ];
  function Oi(Q) {
    ao[Q ? "unshift" : "push"](() => {
      te = Q, i(6, te);
    });
  }
  return n.$$set = (Q) => {
    "settings" in Q && i(15, B = Q.settings), "frame" in Q && i(0, v = Q.frame), "showStage" in Q && i(1, I = Q.showStage), "getStateOnFrame" in Q && i(16, fe = Q.getStateOnFrame), "camera" in Q && i(17, N = Q.camera), "zoom" in Q && i(18, M = Q.zoom), "fit" in Q && i(19, oe = Q.fit), "koEffects" in Q && i(20, Qe = Q.koEffects), "lastFrame" in Q && i(21, zt = Q.lastFrame), "twinkling" in Q && i(14, yt = Q.twinkling);
  }, n.$$.update = () => {
    var Q;
    if (n.$$.dirty[0] & /*camera, fit*/
    655360 && i(10, l = N === "live" || oe === "contain" ? "xMidYMid meet" : "xMidYMid slice"), n.$$.dirty[0] & /*settings*/
    32768 && i(4, u = (B == null ? void 0 : B.stageId) ?? null), n.$$.dirty[0] & /*stageId*/
    16 && i(37, h = u != null ? po[u] : void 0), n.$$.dirty[0] & /*camera*/
    131072 | n.$$.dirty[1] & /*stageData*/
    64 && i(5, S = N === "live" ? "-365 -300 730 600" : (h == null ? void 0 : h.viewbox) ?? "-365 -300 730 600"), n.$$.dirty[0] & /*camera, frame, camStageId, stageId, zoom, camScale, camCenter, camVelocity*/
    252051473 && N === "live" && v) {
      Ye !== (u ?? null) && (i(27, Ye = u ?? null), i(24, Y = null), i(25, _e = null), i(26, Be = [0, 0]));
      const z = 0.04, re = 25, me = 100, J = [], ae = [];
      for (const [Le, de] of Object.entries(v.players ?? {})) {
        if (!(de != null && de.post))
          continue;
        const Ee = de.post.actionStateId;
        let We = de.post.positionX ?? 0, De = de.post.positionY ?? 0;
        if (Fa(Ee) === "star") {
          const Pe = Zt(Number(Le)), et = (v.frame ?? 0) - ((Pe == null ? void 0 : Pe.frame) ?? 0);
          if (!Pe || et > Ri + K)
            continue;
          const st = sc(Pe, Pe.end, et);
          We = st.x, De = st.y;
        } else if (R(Ee))
          continue;
        J.push(We), ae.push(De);
      }
      if (J.length) {
        const Le = Math.min(...J) - re, de = Math.max(...J) + re, Ee = Math.min(...ae) - re, We = Math.max(...ae) + re, De = (Le + de) / 2, Pe = (Ee + We) / 2, et = Math.max(de - Le, me), st = Math.max(We - Ee, me), it = Math.min(640 / et, 480 / st);
        i(25, _e = M * ue(_e ?? 5, it, z));
        let Me = null;
        const pr = u != null ? oo(u) : void 0;
        if (pr) {
          const [[rr, Qt], [Fr, Ka]] = pr;
          i(25, _e = Math.max(_e, 730 / (Fr - rr), 600 / (Ka - Qt)));
          const Ma = 365 / _e, Pa = 300 / _e;
          Me = {
            x: [rr + Ma, Fr - Ma],
            y: [Qt + Pa, Ka - Pa]
          };
        }
        const pt = (rr, [Qt, Fr]) => Math.min(Fr, Math.max(Qt, rr)), oa = Me ? [pt(De, Me.x), pt(Pe, Me.y)] : [De, Pe], Pr = Y ?? oa;
        if (i(26, Be = [
          Be[0] * Wc + (oa[0] - Pr[0]) * bc,
          Be[1] * Wc + (oa[1] - Pr[1]) * bc
        ]), i(24, Y = [Pr[0] + Be[0], Pr[1] + Be[1]]), Me) {
          const [rr, Qt] = Y;
          i(24, Y = [pt(rr, Me.x), pt(Qt, Me.y)]), Y[0] !== rr && i(26, Be[0] = 0, Be), Y[1] !== Qt && i(26, Be[1] = 0, Be);
        }
      }
    }
    if (n.$$.dirty[0] & /*camera, camCenter, camScale*/
    50462720 && i(9, A = N === "live" && Y && _e != null ? `scale(${_e}) translate(${-Y[0]} ${-Y[1]})` : ""), n.$$.dirty[0] & /*settings*/
    32768 && B != null && B.players && ah(B.players.filter(Boolean).map((z) => fo(z.characterId ?? 0, z.characterId ?? 0))), n.$$.dirty[0] & /*frame*/
    1 && v)
      for (const [z, re] of Object.entries(v.players ?? {}))
        re != null && re.post && _t(Number(z), re.post.internalCharacterId ?? 0, sr(Number(z)));
    if (n.$$.dirty[0] & /*settings, getStateOnFrame*/
    98304 && i(38, T = {
      isTeams: (B == null ? void 0 : B.isTeams) ?? !1,
      getStateOnFrame: fe
    }), n.$$.dirty[0] & /*frame, animationsByPlayer, settings*/
    268468225 | n.$$.dirty[1] & /*renderOptions*/
    128 && i(3, g = (() => {
      var re, me;
      if (!v)
        return [];
      const z = [];
      for (const [J, ae] of Object.entries(v.players ?? {})) {
        if (!(ae != null && ae.post))
          continue;
        const Le = Number(J), de = Se[Le];
        if (!de)
          continue;
        const Ee = ((me = (re = B == null ? void 0 : B.players) == null ? void 0 : re.find((Me) => (Me == null ? void 0 : Me.playerIndex) === Le)) == null ? void 0 : me.teamId) ?? void 0, We = Fa(ae.post.actionStateId) === "star", De = Zt(Le), Pe = (v.frame ?? 0) - ((De == null ? void 0 : De.frame) ?? 0);
        if (We && (!De || Pe >= Ri))
          continue;
        const et = nh(ae.post, ae.pre ?? void 0, v.frame ?? 0), st = We ? {
          ...et,
          actionStateId: 88,
          actionStateFrameCounter: 0
        } : et, it = w1(st, de, {
          ...T,
          teamId: Ee ?? void 0
        });
        if (it && We && De) {
          const Me = ae.post.positionX ?? 0, pr = ae.post.positionY ?? 0, pt = sc(De, De.end, Pe, et.facingDirection);
          it.starPlace = `translate(${pt.x} ${pt.y}) scale(${pt.scale}) translate(${-Me} ${-pr})`, it.starSpin = pt.angle;
        }
        it && z.push(it);
      }
      return z;
    })()), n.$$.dirty[0] & /*frame*/
    1 && i(8, d = (v == null ? void 0 : v.items) ?? []), n.$$.dirty[0] & /*viewBox*/
    32 && i(36, L = S.split(" ").map(Number)), n.$$.dirty[0] & /*camera, camCenter, camScale, boxW, boxH*/
    63045632 | n.$$.dirty[1] & /*viewNumbers*/
    32 && i(34, D = (() => {
      if (N === "live" && Y && _e) {
        const ae = V && x ? Math.min(V / 730, x / 600) : 1, Le = (V && x ? V / ae / 2 : 365) / _e, de = (V && x ? x / ae / 2 : 300) / _e;
        return {
          xMin: Y[0] - Le,
          xMax: Y[0] + Le,
          yMin: Y[1] - de,
          yMax: Y[1] + de
        };
      }
      const [z, re, me, J] = L;
      return {
        xMin: z,
        xMax: z + me,
        yMin: -(re + J),
        yMax: -re
      };
    })()), n.$$.dirty[1] & /*stageData*/
    64 && i(35, w = ((z) => z ? {
      xMin: z[0][0],
      yMin: z[0][1],
      xMax: z[1][0],
      yMax: z[1][1]
    } : null)(h == null ? void 0 : h.blastZones)), n.$$.dirty[0] & /*frame, koEffects, prevActions, stageId, lastFrame, renderDatas, effectId, effects*/
    1613758493 | n.$$.dirty[1] & /*prevPositions, visible, starStarts, blastZone, lastColors*/
    31 && v && Qe) {
      const z = Object.entries(v.players ?? {}).filter(([, J]) => J == null ? void 0 : J.post).map(([J, ae]) => ({
        playerIndex: Number(J),
        actionStateId: ae.post.actionStateId ?? -1,
        x: ae.post.positionX ?? 0,
        y: ae.post.positionY ?? 0,
        stocks: ae.post.stocksRemaining ?? null
      })), re = v.frame ?? 0, me = [];
      for (const J of v1(kt, z))
        if (J.kind === "star") {
          const ae = Dt[J.playerIndex] ?? { x: J.x, y: J.y }, Le = u != null ? oo(u) : void 0, de = Le ? {
            xMin: Le[0][0],
            yMin: Le[0][1],
            xMax: Le[1][0],
            yMax: Le[1][1]
          } : D;
          i(
            32,
            Xt[J.playerIndex] = {
              frame: re,
              ...ae,
              end: B1(ae, de)
            },
            Xt
          );
        } else
          me.push({
            ...J,
            ...Dt[J.playerIndex] ?? {}
          });
      for (const [J, ae] of Object.entries(Xt)) {
        const Le = z.find((We) => We.playerIndex === Number(J)), de = !!Le && Fa(Le.actionStateId) === "star", Ee = () => {
          ae.twinkled = !0, me.push({
            playerIndex: Number(J),
            actionStateId: 4,
            ...ae.end,
            kind: "star"
          });
        };
        re < ae.frame || !de ? (re >= ae.frame && !ae.twinkled && Ee(), delete Xt[Number(J)]) : !ae.twinkled && (qt(Le) || re - ae.frame >= Ri || zt != null && re >= zt) && Ee();
      }
      for (const J of me) {
        const ae = b1(J, D, w), Le = ((Q = g.find((De) => De.playerState.playerIndex === J.playerIndex)) == null ? void 0 : Q.innerColor) ?? Jt[J.playerIndex] ?? ft[J.playerIndex] ?? "#ffffff", de = J.kind === "blast" ? 0.65 : (D.xMax - D.xMin) / 700 * 0.64, Ee = {
          id: i(29, ++$e),
          kind: J.kind,
          ...ae,
          color: Le,
          size: de
        };
        i(2, It = [...It, Ee]);
        const We = setTimeout(
          () => {
            tr.delete(We), i(2, It = It.filter((De) => De.id !== Ee.id));
          },
          pc[J.kind]
        );
        tr.add(We);
      }
      for (const J of g)
        J.innerColor && !J.starPlace && i(31, Jt[J.playerState.playerIndex] = J.innerColor, Jt);
      i(30, kt = Object.fromEntries(z.map((J) => [J.playerIndex, J.actionStateId]))), Kt = Object.fromEntries(z.map((J) => [J.playerIndex, J.stocks])), i(33, Dt = Object.fromEntries(z.map((J) => [J.playerIndex, { x: J.x, y: J.y }])));
    }
    n.$$.dirty[0] & /*effects*/
    4 && i(14, yt = It.some((z) => z.kind === "star")), n.$$.dirty[0] & /*camera, camScale, renderDatas, frame*/
    33685513 | n.$$.dirty[1] & /*visible*/
    8 && i(7, C = (() => {
      if (N !== "live" || !_e)
        return [];
      const z = M1 / _e, re = z * 1.25;
      return g.flatMap((me) => {
        var st, it, Me;
        const J = me.playerState, ae = (Me = (it = (st = v == null ? void 0 : v.players) == null ? void 0 : st[J.playerIndex]) == null ? void 0 : it.post) == null ? void 0 : Me.actionStateId;
        if (!me.path || R(ae) || ae === 12 || ae === 13)
          return [];
        const Le = J.xPosition, de = J.yPosition;
        if (!(Le + Mt.halfWidth < D.xMin || Le - Mt.halfWidth > D.xMax || de + Mt.height < D.yMin || de > D.yMax))
          return [];
        const We = Le, De = de + Mt.height / 2, Pe = Math.min(D.xMax - re, Math.max(D.xMin + re, We)), et = Math.min(D.yMax - re, Math.max(D.yMin + re, De));
        return [
          {
            rd: me,
            key: J.playerIndex,
            bx: Pe,
            by: et,
            r: z,
            m: z * 1.3 / Mt.height,
            cx: We,
            cy: De,
            angle: Math.atan2(De - et, We - Pe) * 180 / Math.PI
          }
        ];
      });
    })());
  }, [
    v,
    I,
    It,
    g,
    u,
    S,
    te,
    C,
    d,
    A,
    l,
    Pi,
    Pt,
    Ia,
    yt,
    B,
    fe,
    N,
    M,
    oe,
    Qe,
    zt,
    V,
    x,
    Y,
    _e,
    Be,
    Ye,
    Se,
    $e,
    kt,
    Jt,
    Xt,
    Dt,
    D,
    w,
    L,
    h,
    T,
    Oi
  ];
}
class O1 extends Ea {
  constructor(r) {
    super(), Ha(
      this,
      r,
      P1,
      K1,
      Dr,
      {
        settings: 15,
        frame: 0,
        showStage: 1,
        getStateOnFrame: 16,
        camera: 17,
        zoom: 18,
        fit: 19,
        koEffects: 20,
        lastFrame: 21,
        twinkling: 14
      },
      W1,
      [-1, -1, -1]
    );
  }
}
function G1(n) {
  so(n, "svelte-18ufg7b", ".live-hud-container.svelte-18ufg7b{position:absolute;inset:0;container-type:size;pointer-events:none;-webkit-text-stroke:0}.hud-top.svelte-18ufg7b{position:absolute;top:2cqmin;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:0.3cqmin;font-family:'Rajdhani', system-ui, sans-serif}.hud-bottom.svelte-18ufg7b{position:absolute;left:50%;transform:translateX(-50%);width:min(100cqw, calc(100cqh * 73 / 60));bottom:2.5cqmin;height:15cqmin;font-family:'Rajdhani', system-ui, sans-serif}.hud-player.svelte-18ufg7b{position:absolute;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:0.4cqmin}.hud-name.svelte-18ufg7b{font-size:2cqmin;font-weight:800;color:var(--c);letter-spacing:0.02em;text-shadow:0 0 0.9cqmin rgba(0,0,0,0.6), 0 0.3cqmin 0.6cqmin rgba(0,0,0,0.45);max-width:22cqmin;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hud-percent.svelte-18ufg7b{font-size:6cqmin;font-weight:800;color:#fff;line-height:1;text-shadow:0 0 0.6cqmin var(--c), 0 0.3cqmin 0.8cqmin rgba(0,0,0,0.6);display:inline-block;transform-origin:center;animation:svelte-18ufg7b-pct-pop 0.32s ease-out}.hud-pct-sign.svelte-18ufg7b{font-size:3cqmin;opacity:0.75}.hud-stocks.svelte-18ufg7b{display:flex;gap:0.5cqmin}.stock-icon.svelte-18ufg7b{width:2.6cqmin;height:2.6cqmin;object-fit:contain}.stock-icon--lost.svelte-18ufg7b{opacity:0.2;filter:grayscale(1)}.stock-dot.svelte-18ufg7b{width:1.4cqmin;height:1.4cqmin;border-radius:50%;background:rgba(255,255,255,0.15)}.stock-dot--on.svelte-18ufg7b{background:var(--c);box-shadow:0 0 1.2cqmin var(--c)}.hud-timer.svelte-18ufg7b{font-size:4cqmin;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 0 0.9cqmin rgba(0,0,0,0.6), 0 0.3cqmin 0.6cqmin rgba(0,0,0,0.45)}.hud-score.svelte-18ufg7b{font-size:2.6cqmin;font-weight:700;opacity:0.95;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:0.08em;text-shadow:0 0 0.8cqmin rgba(0,0,0,0.6)}.hud-countdown.svelte-18ufg7b{position:absolute;left:50%;top:42%;transform:translate(-50%, -50%);font-family:'Rajdhani', system-ui, sans-serif;font-size:18cqmin;font-weight:800;color:#fff;line-height:1;text-shadow:0 0 2cqmin rgba(0,0,0,0.6), 0 0.6cqmin 1.2cqmin rgba(0,0,0,0.5);animation:svelte-18ufg7b-countdown-pop 1s ease-out forwards}@keyframes svelte-18ufg7b-countdown-pop{0%{transform:translate(-50%, -50%) scale(1.5);opacity:0}15%{transform:translate(-50%, -50%) scale(1);opacity:1}80%{opacity:1}100%{transform:translate(-50%, -50%) scale(0.9);opacity:0}}@keyframes svelte-18ufg7b-pct-pop{0%{transform:scale(1)}25%{transform:scale(1.28) translateX(-0.5cqmin)}50%{transform:scale(1.16) translateX(0.5cqmin)}75%{transform:scale(1.08) translateX(-0.3cqmin)}100%{transform:scale(1)}}");
}
function Hc(n, r, i) {
  const l = n.slice();
  return l[17] = r[i], l[19] = i, l;
}
function Ec(n, r, i) {
  const l = n.slice();
  return l[20] = r[i], l[19] = i, l;
}
function Rc(n) {
  var A, T;
  let r, i = (
    /*score*/
    (((A = n[0]) == null ? void 0 : A[0]) ?? 0) + ""
  ), l, u, h = (
    /*score*/
    (((T = n[0]) == null ? void 0 : T[1]) ?? 0) + ""
  ), S;
  return {
    c() {
      r = Ke("div"), l = Yt(i), u = Yt(" – "), S = Yt(h), p(r, "class", "hud-score svelte-18ufg7b");
    },
    m(g, d) {
      U(g, r, d), Z(r, l), Z(r, u), Z(r, S);
    },
    p(g, d) {
      var w, L;
      d & /*score*/
      1 && i !== (i = /*score*/
      (((w = g[0]) == null ? void 0 : w[0]) ?? 0) + "") && kr(l, i), d & /*score*/
      1 && h !== (h = /*score*/
      (((L = g[0]) == null ? void 0 : L[1]) ?? 0) + "") && kr(S, h);
    },
    d(g) {
      g && G(r);
    }
  };
}
function Ic(n) {
  let r = (
    /*countdown*/
    n[3]
  ), i, l = Kc(n);
  return {
    c() {
      l.c(), i = Ue();
    },
    m(u, h) {
      l.m(u, h), U(u, i, h);
    },
    p(u, h) {
      h & /*countdown*/
      8 && Dr(r, r = /*countdown*/
      u[3]) ? (l.d(1), l = Kc(u), l.c(), l.m(i.parentNode, i)) : l.p(u, h);
    },
    d(u) {
      u && G(i), l.d(u);
    }
  };
}
function Kc(n) {
  let r, i;
  return {
    c() {
      r = Ke("div"), i = Yt(
        /*countdown*/
        n[3]
      ), p(r, "class", "hud-countdown svelte-18ufg7b");
    },
    m(l, u) {
      U(l, r, u), Z(r, i);
    },
    p(l, u) {
      u & /*countdown*/
      8 && kr(
        i,
        /*countdown*/
        l[3]
      );
    },
    d(l) {
      l && G(r);
    }
  };
}
function U1(n) {
  let r;
  return {
    c() {
      r = Ke("span"), p(r, "class", "stock-dot svelte-18ufg7b"), na(
        r,
        "stock-dot--on",
        /*i*/
        n[19] < /*stocks*/
        n[7](
          /*p*/
          n[17].post
        )
      );
    },
    m(i, l) {
      U(i, r, l);
    },
    p(i, l) {
      l & /*stocks, players*/
      160 && na(
        r,
        "stock-dot--on",
        /*i*/
        i[19] < /*stocks*/
        i[7](
          /*p*/
          i[17].post
        )
      );
    },
    d(i) {
      i && G(r);
    }
  };
}
function N1(n) {
  let r, i;
  return {
    c() {
      r = Ke("img"), p(r, "class", "stock-icon svelte-18ufg7b"), zu(r.src, i = co(`/image/characters/${/*p*/
      n[17].characterId}/0/stock.png`)) || p(r, "src", i), p(r, "alt", ""), na(
        r,
        "stock-icon--lost",
        /*i*/
        n[19] >= /*stocks*/
        n[7](
          /*p*/
          n[17].post
        )
      );
    },
    m(l, u) {
      U(l, r, u);
    },
    p(l, u) {
      u & /*players*/
      32 && !zu(r.src, i = co(`/image/characters/${/*p*/
      l[17].characterId}/0/stock.png`)) && p(r, "src", i), u & /*stocks, players*/
      160 && na(
        r,
        "stock-icon--lost",
        /*i*/
        l[19] >= /*stocks*/
        l[7](
          /*p*/
          l[17].post
        )
      );
    },
    d(l) {
      l && G(r);
    }
  };
}
function Mc(n) {
  let r;
  function i(h, S) {
    return (
      /*p*/
      h[17].characterId != null ? N1 : U1
    );
  }
  let l = i(n), u = l(n);
  return {
    c() {
      u.c(), r = Ue();
    },
    m(h, S) {
      u.m(h, S), U(h, r, S);
    },
    p(h, S) {
      l === (l = i(h)) && u ? u.p(h, S) : (u.d(1), u = l(h), u && (u.c(), u.m(r.parentNode, r)));
    },
    d(h) {
      u.d(h), h && G(r);
    }
  };
}
function Pc(n) {
  let r, i = (
    /*pct*/
    n[6](
      /*p*/
      n[17].post
    ) + ""
  ), l, u;
  return {
    c() {
      r = Ke("span"), l = Yt(i), u = Ke("span"), u.textContent = "%", p(u, "class", "hud-pct-sign svelte-18ufg7b"), p(r, "class", "hud-percent svelte-18ufg7b");
    },
    m(h, S) {
      U(h, r, S), Z(r, l), Z(r, u);
    },
    p(h, S) {
      S & /*players*/
      32 && i !== (i = /*pct*/
      h[6](
        /*p*/
        h[17].post
      ) + "") && kr(l, i);
    },
    d(h) {
      h && G(r);
    }
  };
}
function Oc(n) {
  let r, i = (
    /*p*/
    n[17].name + ""
  ), l;
  return {
    c() {
      r = Ke("span"), l = Yt(i), p(r, "class", "hud-name svelte-18ufg7b");
    },
    m(u, h) {
      U(u, r, h), Z(r, l);
    },
    p(u, h) {
      h & /*players*/
      32 && i !== (i = /*p*/
      u[17].name + "") && kr(l, i);
    },
    d(u) {
      u && G(r);
    }
  };
}
function Gc(n, r) {
  let i, l, u, h = (
    /*pct*/
    r[6](
      /*p*/
      r[17].post
    )
  ), S, A, T = Array(4), g = [];
  for (let L = 0; L < T.length; L += 1)
    g[L] = Mc(Ec(r, T, L));
  let d = Pc(r), w = (
    /*showNames*/
    r[2] && Oc(r)
  );
  return {
    key: n,
    first: null,
    c() {
      i = Ke("div"), l = Ke("span");
      for (let L = 0; L < g.length; L += 1)
        g[L].c();
      u = qe(), d.c(), S = qe(), w && w.c(), A = qe(), p(l, "class", "hud-stocks svelte-18ufg7b"), p(i, "class", "hud-player svelte-18ufg7b"), vi(i, "left", 50 + /*i*/
      (r[19] - /*players*/
      (r[5].length - 1) / 2) * 22 + "%"), vi(
        i,
        "--c",
        /*p*/
        r[17].color
      ), this.first = i;
    },
    m(L, D) {
      U(L, i, D), Z(i, l);
      for (let C = 0; C < g.length; C += 1)
        g[C] && g[C].m(l, null);
      Z(i, u), d.m(i, null), Z(i, S), w && w.m(i, null), Z(i, A);
    },
    p(L, D) {
      if (r = L, D & /*viewerAsset, players, stocks*/
      160) {
        T = Array(4);
        let C;
        for (C = 0; C < T.length; C += 1) {
          const B = Ec(r, T, C);
          g[C] ? g[C].p(B, D) : (g[C] = Mc(B), g[C].c(), g[C].m(l, null));
        }
        for (; C < g.length; C += 1)
          g[C].d(1);
        g.length = T.length;
      }
      D & /*players*/
      32 && Dr(h, h = /*pct*/
      r[6](
        /*p*/
        r[17].post
      )) ? (d.d(1), d = Pc(r), d.c(), d.m(i, S)) : d.p(r, D), /*showNames*/
      r[2] ? w ? w.p(r, D) : (w = Oc(r), w.c(), w.m(i, A)) : w && (w.d(1), w = null), D & /*players*/
      32 && vi(i, "left", 50 + /*i*/
      (r[19] - /*players*/
      (r[5].length - 1) / 2) * 22 + "%"), D & /*players*/
      32 && vi(
        i,
        "--c",
        /*p*/
        r[17].color
      );
    },
    d(L) {
      L && G(i), ia(g, L), d.d(L), w && w.d();
    }
  };
}
function x1(n) {
  let r, i, l, u, h, S, A, T, g = [], d = /* @__PURE__ */ new Map(), w = (
    /*showScore*/
    n[1] && Rc(n)
  ), L = (
    /*countdown*/
    n[3] && Ic(n)
  ), D = (
    /*players*/
    n[5]
  );
  const C = (B) => (
    /*p*/
    B[17].playerIndex
  );
  for (let B = 0; B < D.length; B += 1) {
    let v = Hc(n, D, B), I = C(v);
    d.set(I, g[B] = Gc(I, v));
  }
  return {
    c() {
      r = Ke("div"), i = Ke("div"), l = Ke("div"), u = Yt(
        /*clockText*/
        n[4]
      ), h = qe(), w && w.c(), S = qe(), L && L.c(), A = qe(), T = Ke("div");
      for (let B = 0; B < g.length; B += 1)
        g[B].c();
      p(l, "class", "hud-timer svelte-18ufg7b"), p(i, "class", "hud-top svelte-18ufg7b"), p(T, "class", "hud-bottom svelte-18ufg7b"), p(r, "class", "live-hud-container svelte-18ufg7b");
    },
    m(B, v) {
      U(B, r, v), Z(r, i), Z(i, l), Z(l, u), Z(i, h), w && w.m(i, null), Z(r, S), L && L.m(r, null), Z(r, A), Z(r, T);
      for (let I = 0; I < g.length; I += 1)
        g[I] && g[I].m(T, null);
    },
    p(B, [v]) {
      v & /*clockText*/
      16 && kr(
        u,
        /*clockText*/
        B[4]
      ), /*showScore*/
      B[1] ? w ? w.p(B, v) : (w = Rc(B), w.c(), w.m(i, null)) : w && (w.d(1), w = null), /*countdown*/
      B[3] ? L ? L.p(B, v) : (L = Ic(B), L.c(), L.m(r, A)) : L && (L.d(1), L = null), v & /*players, showNames, pct, Array, viewerAsset, stocks*/
      228 && (D = /*players*/
      B[5], g = ya(g, v, C, 1, B, D, d, T, Ei, Gc, null, Hc));
    },
    i: Xe,
    o: Xe,
    d(B) {
      B && G(r), w && w.d(), L && L.d();
      for (let v = 0; v < g.length; v += 1)
        g[v].d();
    }
  };
}
function Y1(n, r) {
  return n ? !r || r <= 0 ? n : Math.max(0, n - r / 60) : 480;
}
function z1(n, r, i) {
  let l, u, h, S, { settings: A } = r, { frame: T } = r, { p1Name: g = "Player 1" } = r, { p2Name: d = "Player 2" } = r, { p1Index: w = 0 } = r, { p2Index: L = 1 } = r, { score: D = [0, 0] } = r, { showScore: C = !0 } = r, { showNames: B = !0 } = r;
  const v = ["#ef4444", "#3b82f6", "#facc15", "#22c55e"], I = ["#ef4444", "#3b82f6", "#22c55e"], fe = (M) => (M == null ? void 0 : M.percent) != null ? Math.floor(M.percent) : 0, N = (M) => Math.max(0, (M == null ? void 0 : M.stocksRemaining) ?? 0);
  return n.$$set = (M) => {
    "settings" in M && i(8, A = M.settings), "frame" in M && i(9, T = M.frame), "p1Name" in M && i(10, g = M.p1Name), "p2Name" in M && i(11, d = M.p2Name), "p1Index" in M && i(12, w = M.p1Index), "p2Index" in M && i(13, L = M.p2Index), "score" in M && i(0, D = M.score), "showScore" in M && i(1, C = M.showScore), "showNames" in M && i(2, B = M.showNames);
  }, n.$$.update = () => {
    n.$$.dirty & /*settings, p1Index, p1Name, p2Index, p2Name, frame*/
    16128 && i(5, l = ((A == null ? void 0 : A.players) ?? []).filter((M) => (M == null ? void 0 : M.playerIndex) != null).map((M) => {
      var oe, te;
      return {
        ...M,
        port: M.playerIndex + 1,
        name: M.playerIndex === w ? g : M.playerIndex === L ? d : `P${M.playerIndex + 1}`,
        color: A != null && A.isTeams && M.teamId != null ? I[M.teamId] ?? "#fff" : v[M.playerIndex] ?? "#fff",
        post: (te = (oe = T == null ? void 0 : T.players) == null ? void 0 : oe[M.playerIndex]) == null ? void 0 : te.post
      };
    }).sort((M, oe) => M.playerIndex - oe.playerIndex)), n.$$.dirty & /*settings, frame*/
    768 && i(14, u = Y1(A == null ? void 0 : A.startingTimerSeconds, T == null ? void 0 : T.frame)), n.$$.dirty & /*clock*/
    16384 && i(4, h = `${Math.floor(u / 60)}:${String(Math.floor(u % 60)).padStart(2, "0")}`), n.$$.dirty & /*settings, clock*/
    16640 && i(3, S = A != null && A.startingTimerSeconds && u > 0 && u <= 5 ? Math.ceil(u) : null);
  }, [
    D,
    C,
    B,
    S,
    h,
    l,
    fe,
    N,
    A,
    T,
    g,
    d,
    w,
    L,
    u
  ];
}
class J1 extends Ea {
  constructor(r) {
    super(), Ha(
      this,
      r,
      z1,
      x1,
      Dr,
      {
        settings: 8,
        frame: 9,
        p1Name: 10,
        p2Name: 11,
        p1Index: 12,
        p2Index: 13,
        score: 0,
        showScore: 1,
        showNames: 2
      },
      G1
    );
  }
}
function q1(n) {
  so(n, "svelte-nt3crq", ".replay-demo.svelte-nt3crq{display:flex;flex-direction:column;gap:0.6rem;width:100%;height:100%}.replay-stage.svelte-nt3crq{position:relative;flex:1;min-height:0}.replay-loading.svelte-nt3crq{display:flex;align-items:center;justify-content:center;width:100%;height:100%;opacity:0.5;font-size:0.85rem}.replay-controls.svelte-nt3crq{display:flex;align-items:center;gap:0.75rem}.replay-scrub.svelte-nt3crq{flex:1}.replay-frame.svelte-nt3crq{font-size:0.75rem;opacity:0.5;min-width:3rem;text-align:right}");
}
function X1(n) {
  let r;
  return {
    c() {
      r = Ke("div"), r.textContent = "Loading demo…", p(r, "class", "replay-loading svelte-nt3crq");
    },
    m(i, l) {
      U(i, r, l);
    },
    p: Xe,
    i: Xe,
    o: Xe,
    d(i) {
      i && G(r);
    }
  };
}
function Z1(n) {
  let r, i, l, u;
  r = new O1({
    props: {
      settings: (
        /*data*/
        n[3].settings
      ),
      frame: (
        /*current*/
        n[6]
      ),
      getStateOnFrame: (
        /*getStateOnFrame*/
        n[7]
      ),
      camera: (
        /*camera*/
        n[1]
      )
    }
  });
  let h = (
    /*hud*/
    n[2] && Uc(n)
  );
  return {
    c() {
      Ki(r.$$.fragment), i = qe(), h && h.c(), l = Ue();
    },
    m(S, A) {
      ba(r, S, A), U(S, i, A), h && h.m(S, A), U(S, l, A), u = !0;
    },
    p(S, A) {
      const T = {};
      A & /*data*/
      8 && (T.settings = /*data*/
      S[3].settings), A & /*current*/
      64 && (T.frame = /*current*/
      S[6]), A & /*camera*/
      2 && (T.camera = /*camera*/
      S[1]), r.$set(T), /*hud*/
      S[2] ? h ? (h.p(S, A), A & /*hud*/
      4 && xe(h, 1)) : (h = Uc(S), h.c(), xe(h, 1), h.m(l.parentNode, l)) : h && (Ba(), ct(h, 1, 1, () => {
        h = null;
      }), va());
    },
    i(S) {
      u || (xe(r.$$.fragment, S), xe(h), u = !0);
    },
    o(S) {
      ct(r.$$.fragment, S), ct(h), u = !1;
    },
    d(S) {
      Wa(r, S), S && G(i), h && h.d(S), S && G(l);
    }
  };
}
function Uc(n) {
  var l, u, h, S;
  let r, i;
  return r = new J1({
    props: {
      settings: (
        /*data*/
        n[3].settings
      ),
      frame: (
        /*current*/
        n[6]
      ),
      p1Index: (
        /*data*/
        ((u = (l = n[3].settings.players) == null ? void 0 : l[0]) == null ? void 0 : u.playerIndex) ?? 0
      ),
      p2Index: (
        /*data*/
        ((S = (h = n[3].settings.players) == null ? void 0 : h[1]) == null ? void 0 : S.playerIndex) ?? 1
      )
    }
  }), {
    c() {
      Ki(r.$$.fragment);
    },
    m(A, T) {
      ba(r, A, T), i = !0;
    },
    p(A, T) {
      var d, w, L, D;
      const g = {};
      T & /*data*/
      8 && (g.settings = /*data*/
      A[3].settings), T & /*current*/
      64 && (g.frame = /*current*/
      A[6]), T & /*data*/
      8 && (g.p1Index = /*data*/
      ((w = (d = A[3].settings.players) == null ? void 0 : d[0]) == null ? void 0 : w.playerIndex) ?? 0), T & /*data*/
      8 && (g.p2Index = /*data*/
      ((D = (L = A[3].settings.players) == null ? void 0 : L[1]) == null ? void 0 : D.playerIndex) ?? 1), r.$set(g);
    },
    i(A) {
      i || (xe(r.$$.fragment, A), i = !0);
    },
    o(A) {
      ct(r.$$.fragment, A), i = !1;
    },
    d(A) {
      Wa(r, A);
    }
  };
}
function Nc(n) {
  var C;
  let r, i, l = (
    /*playing*/
    n[5] ? "Pause" : "Play"
  ), u, h, S, A, T, g, d = (
    /*current*/
    (((C = n[6]) == null ? void 0 : C.frame) ?? 0) + ""
  ), w, L, D;
  return {
    c() {
      r = Ke("div"), i = Ke("button"), u = Yt(l), h = qe(), S = Ke("input"), T = qe(), g = Ke("span"), w = Yt(d), p(i, "class", "btn text-sm h-8 px-4 border-secondary rounded"), p(S, "type", "range"), p(S, "min", "0"), p(S, "max", A = /*data*/
      n[3].frames.length - 1), p(S, "class", "replay-scrub svelte-nt3crq"), p(g, "class", "replay-frame svelte-nt3crq"), p(r, "class", "replay-controls svelte-nt3crq");
    },
    m(B, v) {
      U(B, r, v), Z(r, i), Z(i, u), Z(r, h), Z(r, S), Ju(
        S,
        /*index*/
        n[4]
      ), Z(r, T), Z(r, g), Z(g, w), L || (D = [
        Bi(
          i,
          "click",
          /*toggle*/
          n[9]
        ),
        Bi(
          S,
          "change",
          /*input_change_input_handler*/
          n[13]
        ),
        Bi(
          S,
          "input",
          /*input_change_input_handler*/
          n[13]
        ),
        Bi(
          S,
          "input",
          /*stop*/
          n[8]
        )
      ], L = !0);
    },
    p(B, v) {
      var I;
      v & /*playing*/
      32 && l !== (l = /*playing*/
      B[5] ? "Pause" : "Play") && kr(u, l), v & /*data*/
      8 && A !== (A = /*data*/
      B[3].frames.length - 1) && p(S, "max", A), v & /*index*/
      16 && Ju(
        S,
        /*index*/
        B[4]
      ), v & /*current*/
      64 && d !== (d = /*current*/
      (((I = B[6]) == null ? void 0 : I.frame) ?? 0) + "") && kr(w, d);
    },
    d(B) {
      B && G(r), L = !1, Mr(D);
    }
  };
}
function Q1(n) {
  let r, i, l, u, h, S;
  const A = [Z1, X1], T = [];
  function g(w, L) {
    return (
      /*data*/
      w[3] && /*current*/
      w[6] ? 0 : 1
    );
  }
  l = g(n), u = T[l] = A[l](n);
  let d = (
    /*controls*/
    n[0] && /*data*/
    n[3] && Nc(n)
  );
  return {
    c() {
      r = Ke("div"), i = Ke("div"), u.c(), h = qe(), d && d.c(), p(i, "class", "replay-stage svelte-nt3crq"), p(r, "class", "replay-demo svelte-nt3crq");
    },
    m(w, L) {
      U(w, r, L), Z(r, i), T[l].m(i, null), Z(r, h), d && d.m(r, null), S = !0;
    },
    p(w, [L]) {
      let D = l;
      l = g(w), l === D ? T[l].p(w, L) : (Ba(), ct(T[D], 1, 1, () => {
        T[D] = null;
      }), va(), u = T[l], u ? u.p(w, L) : (u = T[l] = A[l](w), u.c()), xe(u, 1), u.m(i, null)), /*controls*/
      w[0] && /*data*/
      w[3] ? d ? d.p(w, L) : (d = Nc(w), d.c(), d.m(r, null)) : d && (d.d(1), d = null);
    },
    i(w) {
      S || (xe(u), S = !0);
    },
    o(w) {
      ct(u), S = !1;
    },
    d(w) {
      w && G(r), T[l].d(), d && d.d();
    }
  };
}
function V1(n, r, i) {
  let l, { src: u = "/demo/sample-game.json" } = r, { autoplay: h = !0 } = r, { loop: S = !0 } = r, { controls: A = !1 } = r, { camera: T = "static" } = r, { hud: g = !1 } = r, d = null, w = 0, L = !1, D = /* @__PURE__ */ new Map(), C = null, B = 0, v = 0;
  const I = 1e3 / 60, fe = (x, ue) => {
    const R = D.get(ue), K = R == null ? void 0 : R.players[x];
    return K != null && K.post ? nh(K.post, K.pre ?? void 0, ue) : void 0;
  };
  function N(x) {
    if (d) {
      for (B || (B = x), v += x - B, B = x; v >= I; )
        if (v -= I, i(4, w++, w), w >= d.frames.length)
          if (S)
            i(4, w = 0);
          else {
            i(4, w = d.frames.length - 1), oe();
            return;
          }
      C = requestAnimationFrame(N);
    }
  }
  function M() {
    L || !d || (i(5, L = !0), B = 0, v = 0, C = requestAnimationFrame(N));
  }
  function oe() {
    i(5, L = !1), C != null && cancelAnimationFrame(C), C = null;
  }
  function te() {
    L ? oe() : M();
  }
  Jc(async () => {
    try {
      const ue = await (await fetch(u)).json();
      D = new Map(ue.frames.map((R) => [R.frame ?? 0, R])), i(3, d = ue), ah(ue.settings.players.filter(Boolean).map((R) => fo(R.characterId ?? 0, R.characterId ?? 0))), h && M();
    } catch (x) {
      console.warn("[ReplayDemo] failed to load", u, x);
    }
  }), qc(oe);
  function V() {
    w = Gg(this.value), i(4, w);
  }
  return n.$$set = (x) => {
    "src" in x && i(10, u = x.src), "autoplay" in x && i(11, h = x.autoplay), "loop" in x && i(12, S = x.loop), "controls" in x && i(0, A = x.controls), "camera" in x && i(1, T = x.camera), "hud" in x && i(2, g = x.hud);
  }, n.$$.update = () => {
    n.$$.dirty & /*data, index*/
    24 && i(6, l = d == null ? void 0 : d.frames[w]);
  }, [
    A,
    T,
    g,
    d,
    w,
    L,
    l,
    fe,
    oe,
    te,
    u,
    h,
    S,
    V
  ];
}
class j1 extends Ea {
  constructor(r) {
    super(), Ha(
      this,
      r,
      V1,
      Q1,
      Dr,
      {
        src: 10,
        autoplay: 11,
        loop: 12,
        controls: 0,
        camera: 1,
        hud: 2
      },
      q1
    );
  }
}
const oh = import.meta.url.replace(/[^/]*$/, "");
K0(oh);
document.querySelectorAll("[data-froggi-viewer]").forEach((n) => {
  new j1({ target: n, props: { src: `${oh}sample-game.json`, hud: !0, camera: "live", controls: !1 } });
});
