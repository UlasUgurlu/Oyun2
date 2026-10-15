"""Create the vector OT monogram and outlined wordmark. Requires fontTools."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
OUT=Path(__file__).resolve().parents[1]/'assets'
OUT.mkdir(exist_ok=True)
DEFS='''<defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4ceff"/><stop offset=".4" stop-color="#a582f9"/><stop offset="1" stop-color="#5b57be"/></linearGradient><linearGradient id="core" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5eeff"/><stop offset=".35" stop-color="#bd9dfa"/><stop offset="1" stop-color="#7060c6"/></linearGradient><linearGradient id="orbit" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#77e7f8"/><stop offset=".55" stop-color="#4dcedc"/><stop offset="1" stop-color="#fff0ce"/></linearGradient><radialGradient id="bg"><stop stop-color="#30234e"/><stop offset="1" stop-color="#080e1c"/></radialGradient><filter id="bloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="18"/></filter></defs>'''
MARK='''<path d="M750 660 A272 272 0 1 0 357 733" fill="none" stroke="#1c2442" stroke-width="108"/><path d="M750 637 A266 266 0 1 0 357 712" fill="none" stroke="url(#ring)" stroke-width="70" stroke-linecap="round"/><path d="M326 480 A193 193 0 0 1 528 312" fill="none" stroke="#f0e4ff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/><path d="M371 349 L671 349 L671 426 L557 426 L557 640 L512 697 L467 640 L467 426 L371 426 Z" fill="#413779" transform="translate(0 14)"/><path d="M371 339 L671 339 L671 416 L557 416 L557 630 L512 687 L467 630 L467 416 L371 416 Z" fill="url(#core)"/><path d="M371 339 H671 V349 H381 V416 H371Z" fill="#f5ecff" opacity=".75"/><path d="M557 416 V630 L512 687 V601 L533 581 V416Z" fill="#635bc1" opacity=".64"/><path d="M213 674 C299 788 644 706 828 486" fill="none" stroke="#7af0ee" stroke-opacity=".35" stroke-width="21" filter="url(#bloom)"/><path d="M213 674 C299 788 644 706 828 486" fill="none" stroke="url(#orbit)" stroke-width="17" stroke-linecap="round"/><path d="M707 602 C753 568 797 521 828 486" fill="none" stroke="#e1fffc" stroke-width="4" stroke-linecap="round"/><circle cx="830" cy="484" r="18" fill="#f0ffe9"/>'''
svg=lambda body:f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}{body}</svg>'
(OUT/'logo-mark.svg').write_text(svg(MARK))
(OUT/'icon.svg').write_text(svg('<rect width="1024" height="1024" fill="url(#bg)"/><circle cx="510" cy="500" r="285" fill="#b77bff" opacity=".07" filter="url(#bloom)"/>'+MARK))
(OUT/'adaptive-icon.svg').write_text(svg('<g transform="translate(150 150) scale(.708)">'+MARK+'</g>'))
font=TTFont(OUT.parent/'node_modules/@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf')
glyphs=font.getGlyphSet();cmap=font.getBestCmap();upm=font['head'].unitsPerEm;x=405;paths=[]
for i,char in enumerate('ORBIT TIDE'):
 name=cmap[ord(char)];pen=SVGPathPen(glyphs);glyphs[name].draw(pen)
 paths.append(f'<path d="{pen.getCommands()}" transform="translate({x:.2f} 211) scale({113/upm} {-113/upm})" fill="'+('#f6f0ff' if i<5 else '#baa6e7')+'"/>')
 x+=(font['hmtx'][name][0]/upm*113)+3
(OUT/'logo-lockup.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="340" viewBox="0 0 1320 340">{DEFS}<g transform="translate(3 0) scale(.33)">{MARK}</g>'+''.join(paths)+'</svg>')
print('Vector logo and outlined wordmark created')
