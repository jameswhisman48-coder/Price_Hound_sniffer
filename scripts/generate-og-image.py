"""Generate the PriceHound Open Graph share card (1200x630) dependency-free.

Pure Python stdlib only — no PIL, no fontTools, no network deps. It parses a
system TrueType font directly (TrueType `glyf` outlines + `cmap` format 4),
rasterizes glyphs with 4x supersampled scanline fills for smooth antialiased
text, and writes a PNG via zlib — the same approach as scripts/generate-icons.py.

Design (mirrors the site brand):
  * Emerald (#059669) background with a subtle vertical depth gradient
  * The PriceHound price-tag/paw mark (same 64-unit geometry as the icons
    script) as a white chip with an emerald paw
  * "PriceHound" wordmark in white bold (Liberation Sans Bold)
  * Tagline "Find lower grocery prices near you" in emerald-100 (regular weight)

NO sample data prices/deals appear on the card (the demo data is fictional).

Usage:  python3 scripts/generate-og-image.py
Writes: public/og-image.png (1200x630) and public/og-image-large.png (1800x945).
"""

import math
import os
import struct
import sys
import zlib

# ---------------------------------------------------------------------------
# Configuration (1200x630 is the requirement; large variant scales proportionally)
# ---------------------------------------------------------------------------
CARD_W = 1200
CARD_H = 630

# Brand colors
EMERALD = (5, 150, 105)        # #059669  (chip paw + base background)
EMERALD_DARK = (4, 120, 87)    # #047857  (bottom of background gradient)
EMERALD_GLOW = (16, 185, 129)  # #10b981  (subtle radial highlight)
EMERALD_100 = (209, 250, 229)  # #d1fae5  (tagline)
WHITE = (255, 255, 255)

# Layout (in 1200x630 units; scaled by s = W/1200 for other sizes)
MARK_SIZE = 220        # price-tag chip side, px
MARK_X = 92            # chip left edge
MARK_Y = (CARD_H - MARK_SIZE) // 2  # vertically centered
MARK_GAP = 60          # gap between chip and wordmark
WORD_SIZE = 106        # wordmark font size, px
TAG_SIZE = 39          # tagline font size, px
TAG_GAP = 40           # gap below the wordmark ink
EDGE = 92              # right padding target for autofit
SS = 4                 # supersampling factor (4x -> box-downsampled AA)

# Fonts (system, metric-compatible with the brand's clean sans look)
BOLD_FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
REG_FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


# ---------------------------------------------------------------------------
# Minimal TrueType parser (TrueType outlines only)
# ---------------------------------------------------------------------------
class Font:
    def __init__(self, path):
        data = open(path, "rb").read()
        tag = data[0:4]
        if tag not in (b"\x00\x01\x00\x00", b"true"):
            raise SystemExit(f"unsupported font format {tag!r} in {path}")
        num_tables = struct.unpack(">H", data[4:6])[0]
        tables = {}
        for i in range(num_tables):
            off = 12 + i * 16
            t = data[off : off + 4].decode("latin1")
            tables[t] = struct.unpack(">II", data[off + 8 : off + 16])
        get = lambda t: data[tables[t][0] : tables[t][0] + tables[t][1]]

        head = get("head")
        self.units_per_em = struct.unpack(">H", head[18:20])[0]
        index_to_loc = struct.unpack(">h", head[50:52])[0]

        maxp = get("maxp")
        self.num_glyphs = struct.unpack(">H", maxp[4:6])[0]

        hhea = get("hhea")
        self.ascent = struct.unpack(">h", hhea[4:6])[0]
        self.descent = struct.unpack(">h", hhea[6:8])[0]
        num_hmetrics = struct.unpack(">H", hhea[34:36])[0]

        loca = get("loca")
        if index_to_loc == 0:
            self.locs = [
                struct.unpack(">H", loca[i * 2 : i * 2 + 2])[0] * 2
                for i in range(self.num_glyphs + 1)
            ]
        else:
            self.locs = [
                struct.unpack(">I", loca[i * 4 : i * 4 + 4])[0]
                for i in range(self.num_glyphs + 1)
            ]
        self.glyf = get("glyf")

        hmtx = get("hmtx")
        advances = []
        for i in range(self.num_glyphs):
            if i < num_hmetrics:
                advances.append(struct.unpack(">H", hmtx[i * 4 : i * 4 + 2])[0])
            else:
                advances.append(advances[num_hmetrics - 1])
        self.advances = advances

        cmap = get("cmap")
        n = struct.unpack(">H", cmap[2:4])[0]
        subt = None
        for i in range(n):
            rec = 4 + i * 8
            pid, eid, off = struct.unpack(">HHI", cmap[rec : rec + 8])
            if (pid, eid) == (3, 1):
                subt = cmap[off:]
                break
        if subt is None:  # fall back to any platform 0/3 format-4 table
            for i in range(n):
                rec = 4 + i * 8
                pid, eid, off = struct.unpack(">HHI", cmap[rec : rec + 8])
                if pid in (0, 3) and cmap[off : off + 2] == b"\x00\x04":
                    subt = cmap[off:]
                    break
        if subt is None or struct.unpack(">H", subt[0:2])[0] != 4:
            raise SystemExit(f"no cmap format 4 in {path}")
        seg_x2 = struct.unpack(">H", subt[6:8])[0]
        seg = seg_x2 // 2
        self._end = [struct.unpack(">H", subt[14 + i * 2 : 16 + i * 2])[0] for i in range(seg)]
        self._start = [struct.unpack(">H", subt[16 + seg_x2 + i * 2 : 18 + seg_x2 + i * 2])[0] for i in range(seg)]
        self._delta = [struct.unpack(">h", subt[16 + seg_x2 * 2 + i * 2 : 18 + seg_x2 * 2 + i * 2])[0] for i in range(seg)]
        self._roff = [struct.unpack(">H", subt[16 + seg_x2 * 3 + i * 2 : 18 + seg_x2 * 3 + i * 2])[0] for i in range(seg)]
        self._ga_off = 16 + seg_x2 * 4
        self._sub = subt

    def glyph_id(self, char):
        c = ord(char)
        for i in range(len(self._start)):
            if self._start[i] <= c <= self._end[i]:
                if self._roff[i] == 0:
                    return (c + self._delta[i]) & 0xFFFF
                pos = self._ga_off + self._roff[i] + (c - self._start[i]) * 2
                gi = struct.unpack(">H", self._sub[pos : pos + 2])[0]
                return (gi + self._delta[i]) & 0xFFFF if gi else 0
        return 0

    def contours(self, gid):
        """Return glyph contours as lists of (x, y, on_curve) in font units (y-up)."""
        off0, off1 = self.locs[gid], self.locs[gid + 1]
        if off1 - off0 < 12:
            return []
        g = self.glyf[off0:off1]
        n = struct.unpack(">h", g[0:2])[0]
        if n < 0:
            return []  # composite glyph (not needed for our ASCII strings)
        ends = [struct.unpack(">H", g[10 + i * 2 : 12 + i * 2])[0] for i in range(n)]
        ilen = struct.unpack(">H", g[10 + n * 2 : 12 + n * 2])[0]
        p = 12 + n * 2 + ilen
        flags = []
        while len(flags) <= ends[-1]:
            f = g[p]
            p += 1
            flags.append(f)
            if f & 0x08:
                rep = g[p]
                p += 1
                flags.extend([f] * rep)
        xs = []
        x = 0
        for f in flags:
            if f & 0x02:
                dx = g[p]
                p += 1
                x += -dx if not (f & 0x10) else dx
            elif not (f & 0x10):
                x += struct.unpack(">h", g[p : p + 2])[0]
                p += 2
            xs.append(x)
        ys = []
        y = 0
        for f in flags:
            if f & 0x04:
                dy = g[p]
                p += 1
                y += -dy if not (f & 0x20) else dy
            elif not (f & 0x20):
                y += struct.unpack(">h", g[p : p + 2])[0]
                p += 2
            ys.append(y)
        out = []
        start = 0
        for e in ends:
            pts = [(xs[i], ys[i], bool(flags[i] & 1)) for i in range(start, e + 1)]
            if len(pts) >= 2:
                out.append(pts)
            start = e + 1
        return out

    def advance(self, char):
        return self.advances[self.glyph_id(char)] if char != "" else 0


# ---------------------------------------------------------------------------
# Glyph outline -> flat polygons (with implied on-curve midpoints, quad flatten)
# ---------------------------------------------------------------------------
def flatten(p0, ctrl, p1, poly, tol):
    x0, y0 = p0
    xc, yc = ctrl
    x1, y1 = p1
    chord = math.hypot(x1 - x0, y1 - y0)
    if chord < 1e-6:
        return
    d = abs((x1 - x0) * (y0 - yc) - (x0 - xc) * (y1 - y0)) / chord
    if d <= tol:
        poly.append((x1, y1))
        return
    hx, hy = (x0 + xc) / 2, (y0 + yc) / 2
    gx, gy = (xc + x1) / 2, (yc + y1) / 2
    qx, qy = (hx + gx) / 2, (hy + gy) / 2
    flatten(p0, (hx, hy), (qx, qy), poly, tol)
    flatten((qx, qy), (gx, gy), p1, poly, tol)


def glyph_polygons(contours, scale, tol=0.35):
    """Scale font-unit contours to pixels and return closed polylines (y-up)."""
    polys = []
    for pts in contours:
        n = len(pts)
        start = 0
        for i in range(n):
            if pts[i][2]:
                start = i
                break
        arr = pts[start:] + pts[:start]
        if not arr[0][2]:
            arr[0] = (arr[0][0], arr[0][1], True)
        poly = []
        i = 0
        cur = arr[0]
        while True:
            offs = []
            j = i
            while True:
                j = (j + 1) % len(arr)
                if arr[j][2]:
                    break
                offs.append(arr[j])
            nxt = arr[j]
            chain = [cur] + offs + [nxt]
            cpts = []
            for k in range(len(chain)):
                cpts.append(chain[k])
                if k + 1 < len(chain) and not chain[k][2] and not chain[k + 1][2]:
                    cpts.append(
                        ((chain[k][0] + chain[k + 1][0]) / 2,
                         (chain[k][1] + chain[k + 1][1]) / 2, True)
                    )
            p0 = cpts[0]
            poly.append((p0[0] * scale, p0[1] * scale))
            k = 1
            while k < len(cpts) - 1:
                ctrl = cpts[k]
                p2 = cpts[k + 1]
                flatten((p0[0] * scale, p0[1] * scale),
                        (ctrl[0] * scale, ctrl[1] * scale),
                        (p2[0] * scale, p2[1] * scale), poly, tol)
                p0 = p2
                k += 2
            if j == 0:
                break
            i = j
            cur = nxt
        if len(poly) >= 3:
            polys.append(poly)
    return polys


# ---------------------------------------------------------------------------
# Scanline fill of a polygon into a flat supersampled mask (even-odd rule)
# ---------------------------------------------------------------------------
def fill_polygon(mask, mw, mh, poly, ox, oy):
    """poly is in 1x card coords (y-down); ox, oy translate to mask coords (x4)."""
    pts = [(px * SS + ox, py * SS + oy) for px, py in poly]
    ys = [y for _, y in pts]
    ymin = max(0, int(math.floor(min(ys))))
    ymax = min(mh - 1, int(math.ceil(max(ys))))
    if ymin > ymax:
        return
    edges = []
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        if y0 == y1:
            continue
        if y0 > y1:
            x0, y0, x1, y1 = x1, y1, x0, y0
        edges.append((y0, y1, x0, x1))
    if not edges:
        return
    for y in range(ymin, ymax + 1):
        yc = y + 0.5
        xs = []
        for y0, y1, x0, x1 in edges:
            if y0 <= yc < y1:
                t = (yc - y0) / (y1 - y0)
                xs.append(x0 + t * (x1 - x0))
        xs.sort()
        for k in range(0, len(xs) - 1, 2):
            a = max(0, int(math.floor(xs[k])))
            b = min(mw - 1, int(math.ceil(xs[k + 1])))
            if b >= a:
                mask[y * mw + a : y * mw + b + 1] = b"\x01" * (b - a + 1)


# ---------------------------------------------------------------------------
# Text run: measure + render into a mask at a given baseline
# ---------------------------------------------------------------------------
def text_metrics(font, text, size):
    """Ink bbox (x0,y0,x1,y1 in 1x px, y-up from baseline=0) + total advance."""
    scale = size / font.units_per_em
    x0 = y0 = 1e9
    x1 = y1 = -1e9
    pen = 0
    for ch in text:
        gid = font.glyph_id(ch)
        if gid == 0:
            pen += font.advances[0] * scale
            continue
        adv = font.advances[gid] * scale
        for cont in font.contours(gid):
            for x, y, _ in cont:
                px = pen + x * scale
                py = y * scale
                if px < x0: x0 = px
                if px > x1: x1 = px
                if py < y0: y0 = py
                if py > y1: y1 = py
        pen += adv
    if x0 > x1:
        return (0, 0, 0, 0, pen)
    return (x0, y0, x1, y1, pen)


def render_text(mask, mw, mh, font, text, size, baseline_y, pen_x=0.0):
    """Rasterize text so its baseline sits at card row baseline_y (y-down),
    starting at card x = pen_x."""
    scale = size / font.units_per_em
    pen = pen_x
    for ch in text:
        gid = font.glyph_id(ch)
        if gid == 0:
            pen += font.advances[0] * scale
            continue
        adv = font.advances[gid] * scale
        for poly in glyph_polygons(font.contours(gid), scale):
            # font coords are y-up; flip to card y-down around the baseline
            flipped = [(px + pen, baseline_y - py) for px, py in poly]
            fill_polygon(mask, mw, mh, flipped, 0, 0)
        pen += adv
    return pen


# ---------------------------------------------------------------------------
# PNG writer (RGB, like a flattened render)
# ---------------------------------------------------------------------------
def write_png(path, w, h, rgb_rows):
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    raw = b"".join(b"\0" + row for row in rgb_rows)
    data = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(data)


# ---------------------------------------------------------------------------
# Card builder
# ---------------------------------------------------------------------------
def draw_chip_and_paw(white_mask, paw_mask, mw, mh, s, cx0, cy0):
    """White price-tag chip + emerald paw into the white/emerald masks (4x).

    s = pixel scale of the 64-unit icon design (already x4 supersampled).
    cx0, cy0 = chip top-left in 1x card coords.
    """
    def setpx(m, x, y, v):
        if 0 <= x < mw and 0 <= y < mh:
            m[y * mw + x] = v

    def rounded_rect(m, x0, y0, x1, y1, r, v):
        for y in range(y0, y1):
            for x in range(x0, x1):
                dx = max(x0 + r - x, 0, x - (x1 - r - 1))
                dy = max(y0 + r - y, 0, y - (y1 - r - 1))
                if dx * dx + dy * dy <= r * r:
                    setpx(m, x, y, v)

    def ellipse(m, cx, cy, rx, ry, v, angle=0):
        ca, sa = math.cos(angle), math.sin(angle)
        for y in range(int(cy - ry - 2), int(cy + ry + 3)):
            for x in range(int(cx - rx - 2), int(cx + rx + 3)):
                a, b = (x - cx) * ca + (y - cy) * sa, -(x - cx) * sa + (y - cy) * ca
                if (a / rx) ** 2 + (b / ry) ** 2 <= 1:
                    setpx(m, x, y, v)

    ox = int(round(cx0 * SS))
    oy = int(round(cy0 * SS))
    rounded_rect(white_mask, ox + round(4 * s), oy + round(4 * s), ox + round(60 * s),
                 oy + round(60 * s), round(16 * s), 1)
    # paw (emerald): main pad + toes, same geometry as generate-icons.py
    ellipse(paw_mask, ox + 46 * s, oy + 17 * s, 5.5 * s, 5.5 * s, 1)
    ellipse(paw_mask, ox + 29 * s, oy + 40 * s, 10 * s, 8.5 * s, 1)
    ellipse(paw_mask, ox + 18 * s, oy + 30.5 * s, 3.6 * s, 4.9 * s, 1, math.radians(-24))
    ellipse(paw_mask, ox + 25.5 * s, oy + 26 * s, 3.5 * s, 4.9 * s, 1)
    ellipse(paw_mask, ox + 33 * s, oy + 26 * s, 3.5 * s, 4.9 * s, 1)
    ellipse(paw_mask, ox + 40 * s, oy + 30.5 * s, 3.6 * s, 4.9 * s, 1, math.radians(24))


def build_card(w, h, out_path):
    s = w / CARD_W  # proportional scale for alternate sizes
    mw, mh = w * SS, h * SS
    white_mask = bytearray(mw * mh)
    paw_mask = bytearray(mw * mh)
    tag_mask = bytearray(mw * mh)

    bold = Font(BOLD_FONT)
    reg = Font(REG_FONT)

    # --- layout -------------------------------------------------------------
    mark_size = MARK_SIZE * s
    mark_x = MARK_X * s
    mark_y = (h - mark_size) / 2
    word_size = WORD_SIZE * s
    tag_size = TAG_SIZE * s
    tag_gap = TAG_GAP * s
    edge = EDGE * s

    # wordmark ink bbox (y-up)
    wx0, wy0, wx1, wy1, _ = text_metrics(bold, "PriceHound", word_size)
    # autofit: keep within right margin
    max_x = w - edge
    word_x = mark_x + mark_size + MARK_GAP * s
    if word_x + wx1 > max_x:
        word_size *= (max_x - word_x) / wx1
        wx0, wy0, wx1, wy1, _ = text_metrics(bold, "PriceHound", word_size)
    ink_top_w = wy1          # pixels above baseline (y-up)
    ink_bot_w = -wy0
    word_baseline = h / 2 + (ink_top_w - ink_bot_w) / 2  # vertical center on mark

    # tagline below the wordmark ink
    tx0, ty0, tx1, ty1, _ = text_metrics(reg, "Find lower grocery prices near you", tag_size)
    if word_x + tx1 > max_x:
        tag_size *= (max_x - word_x) / tx1
        tx0, ty0, tx1, ty1, _ = text_metrics(reg, "Find lower grocery prices near you", tag_size)
    tag_baseline = word_baseline + ink_bot_w + tag_gap + ty1

    # --- draw (into 4x masks) ----------------------------------------------
    s4 = SS * mark_size / 64.0  # 64-unit design scale in mask px (4x supersampled)
    draw_chip_and_paw(white_mask, paw_mask, mw, mh, s4, mark_x, mark_y)
    render_text(white_mask, mw, mh, bold, "PriceHound", word_size, word_baseline, word_x)
    render_text(tag_mask, mw, mh, reg, "Find lower grocery prices near you", tag_size, tag_baseline, word_x)

    # --- composite at 1x -----------------------------------------------------
    rows = []
    glow_cx, glow_cy, glow_r = 240 * s, 150 * s, 640 * s
    for y in range(h):
        t = y / (h - 1)
        r0 = EMERALD[0] + (EMERALD_DARK[0] - EMERALD[0]) * t
        g0 = EMERALD[1] + (EMERALD_DARK[1] - EMERALD[1]) * t
        b0 = EMERALD[2] + (EMERALD_DARK[2] - EMERALD[2]) * t
        row = bytearray(w * 3)
        row4 = y * SS
        for x in range(w):
            dx = x - glow_cx
            dy = y - glow_cy
            dist = math.hypot(dx, dy)
            glow = max(0.0, 1.0 - dist / glow_r) * 0.38
            r = r0 + (EMERALD_GLOW[0] - r0) * glow
            g = g0 + (EMERALD_GLOW[1] - g0) * glow
            b = b0 + (EMERALD_GLOW[2] - b0) * glow
            col4 = x * SS
            # coverage per mask (0..16)
            cw = 0
            cp = 0
            ct = 0
            for dy4 in range(SS):
                base4 = (row4 + dy4) * mw + col4
                cw += white_mask[base4] + white_mask[base4 + 1] + white_mask[base4 + 2] + white_mask[base4 + 3]
                cp += paw_mask[base4] + paw_mask[base4 + 1] + paw_mask[base4 + 2] + paw_mask[base4 + 3]
                ct += tag_mask[base4] + tag_mask[base4 + 1] + tag_mask[base4 + 2] + tag_mask[base4 + 3]
            if ct > 0:
                f = ct / 16.0
                r = r + (EMERALD_100[0] - r) * f
                g = g + (EMERALD_100[1] - g) * f
                b = b + (EMERALD_100[2] - b) * f
            elif cp > 0:
                f = cp / 16.0
                r = r + (EMERALD[0] - r) * f
                g = g + (EMERALD[1] - g) * f
                b = b + (EMERALD[2] - b) * f
            elif cw > 0:
                f = cw / 16.0
                r = r + (WHITE[0] - r) * f
                g = g + (WHITE[1] - g) * f
                b = b + (WHITE[2] - b) * f
            i = x * 3
            row[i] = int(r + 0.5)
            row[i + 1] = int(g + 0.5)
            row[i + 2] = int(b + 0.5)
        rows.append(bytes(row))
    write_png(out_path, w, h, rows)

    # diagnostics
    print(f"  {out_path}: {w}x{h}, wordmark size={word_size:.1f}px tagline={tag_size:.1f}px")
    print(f"    wordmark ink x:[{word_x:.0f},{word_x+wx1:.0f}] baselines y={word_baseline:.0f}/{tag_baseline:.0f}")
    return out_path


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public")
    build_card(1200, 630, os.path.join(out_dir, "og-image.png"))
    build_card(1800, 945, os.path.join(out_dir, "og-image-large.png"))
    print("done")
