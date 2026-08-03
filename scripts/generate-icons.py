"""Generate lightweight PNG PWA icons matching the inline PriceHound favicon mark."""
import math, os, struct, zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT, exist_ok=True)

def png(path, size):
    pixels = bytearray(size * size * 4)
    def setpx(x, y, c):
        if 0 <= x < size and 0 <= y < size:
            i = (y * size + x) * 4; pixels[i:i+4] = bytes(c)
    def rounded_rect(x0, y0, x1, y1, r, c):
        for y in range(y0, y1):
            for x in range(x0, x1):
                dx = max(x0 + r - x, 0, x - (x1-r-1)); dy = max(y0+r-y, 0, y-(y1-r-1))
                if dx*dx + dy*dy <= r*r: setpx(x, y, c)
    def ellipse(cx, cy, rx, ry, c, angle=0):
        ca, sa = math.cos(angle), math.sin(angle)
        for y in range(int(cy-ry-2), int(cy+ry+3)):
            for x in range(int(cx-rx-2), int(cx+rx+3)):
                a, b = (x-cx)*ca + (y-cy)*sa, -(x-cx)*sa + (y-cy)*ca
                if (a/rx)**2 + (b/ry)**2 <= 1: setpx(x, y, c)
    # Same geometry as FAVICON in src/routes/__root.tsx, scaled from 64.
    s = size / 64
    rounded_rect(round(4*s), round(4*s), round(60*s), round(60*s), round(16*s), (5,150,105,255))
    white = (255,255,255,255)
    ellipse(46*s,17*s,5.5*s,5.5*s,white)
    ellipse(29*s,40*s,10*s,8.5*s,white)
    ellipse(18*s,30.5*s,3.6*s,4.9*s,white,math.radians(-24))
    ellipse(25.5*s,26*s,3.5*s,4.9*s,white)
    ellipse(33*s,26*s,3.5*s,4.9*s,white)
    ellipse(40*s,30.5*s,3.6*s,4.9*s,white,math.radians(24))
    raw = b''.join(b'\0' + bytes(pixels[y*size*4:(y+1)*size*4]) for y in range(size))
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size,size,8,6,0,0,0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

for n in (180, 192, 512): png(os.path.join(OUT, f"icon-{n}.png"), n)
png(os.path.join(os.path.dirname(OUT), "apple-touch-icon.png"), 180)
