"""Génère src/theme/radix/brand.css : une échelle 12 pas « façon Radix » autour du rouge DFCO.

Principe : on reprend les luminosités (OKLCH) de l'échelle Radix `red`, on applique la teinte
de BRAND et on ajuste la saturation ; les pas 9 et 10 (aplats, survol) sont fixés sur la couleur
de marque, le pas 11 (texte) est assombri pour garder un contraste AA sur fond clair.
Usage : python frontend/scripts/generate-brand-scale.py
"""
import math
import re
from pathlib import Path
def srgb_to_lin(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def lin_to_srgb(c): return 12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
def hex2oklch(h):
    r,g,b=[srgb_to_lin(int(h[i:i+2],16)/255) for i in (1,3,5)]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b; m=0.2119034982*r+0.6806995451*g+0.1073969566*b; s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=[x**(1/3) for x in (l,m,s)]
    L=0.2104542553*l+0.7936177850*m-0.0040720468*s; a=1.9779984951*l-2.4285922050*m+0.4505937099*s; bb=0.0259040371*l+0.7827717662*m-0.8086757660*s
    return L, math.hypot(a,bb), math.degrees(math.atan2(bb,a))%360
def oklch2rgb(L,C,H):
    a=C*math.cos(math.radians(H)); b=C*math.sin(math.radians(H))
    l=(L+0.3963377774*a+0.2158037573*b)**3; m=(L-0.1055613458*a-0.0638541728*b)**3; s=(L-0.0894841775*a-1.2914855480*b)**3
    r=4.0767416621*l-3.3077115913*m+0.2309699292*s; g=-1.2684380046*l+2.6097574011*m-0.3413193965*s; bl=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    return [lin_to_srgb(x) for x in (r,g,bl)]
def ingamut(rgb): return all(-1e-4<=x<=1+1e-4 for x in rgb)
def oklch2hex(L,C,H):
    while not ingamut(oklch2rgb(L,C,H)) and C>0: C-=0.002
    return "#"+"".join(f"{round(min(1,max(0,x))*255):02x}" for x in oklch2rgb(L,C,H))
BRAND="#d40125"
bL,bC,bH=hex2oklch(BRAND)
def scale(file):
    txt=Path(file).read_text(encoding="utf-8"); vals=re.findall(r"--red-(\d+): (#[0-9a-f]{6})",txt)
    out={}
    rL,rC,rH=hex2oklch(dict(vals)["9"])
    for k,v in vals:
        L,C,H=hex2oklch(v)
        out[int(k)]=oklch2hex(L,C*bC/rC,bH)
    return out
ROOT = Path(__file__).resolve().parents[1] / "src" / "theme" / "radix"
light = scale(ROOT / "red.css")
dark = scale(ROOT / "red-dark.css")
light[9]=BRAND; light[10]=oklch2hex(bL-0.04,bC,bH); light[11]=oklch2hex(bL-0.07,bC*0.92,bH)
dark[9]=BRAND; dark[10]=oklch2hex(bL+0.05,bC,bH)
def lum(h):
    r,g,b=[srgb_to_lin(int(h[i:i+2],16)/255) for i in (1,3,5)]; return .2126*r+.7152*g+.0722*b
def cr(a,b):
    x,y=sorted([lum(a),lum(b)]); return (y+.05)/(x+.05)
print("light", light, "11 vs 1:", round(cr(light[11],light[1]),2), "12:",round(cr(light[12],light[2]),2), "white on 9:", round(cr("#ffffff",BRAND),2))
print("dark", dark, "11 vs 1:", round(cr(dark[11],dark[1]),2))
def css(sel, d, name="brand"):
    return sel+" {\n"+"".join(f"  --{name}-{k}: {d[k]};\n" for k in range(1,13))+"}\n"
(ROOT / "brand.css").write_text("/* Échelle « brand » générée façon Radix autour de #d40125 (teinte OKLCH du rouge DFCO,\n   luminosités de l'échelle Radix red). Script : frontend/scripts/generate-brand-scale.py */\n"+css(":root, .light, .light-theme", light)+"\n"+css(".app-dark, .dark, .dark-theme", dark), encoding="utf-8")
