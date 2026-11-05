from lib import *

OUT = {}
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;family=Unbounded:wght@700;900&amp;family=Fredoka:wght@600;700&amp;family=DM+Serif+Display&amp;family=Anton&amp;family=Syne:wght@800&amp;family=Space+Grotesk:wght@700&amp;display=swap">'
SOFA = lambda c, s: (f'<svg width="{s}" height="{s * 0.62:.0f}" viewBox="0 0 100 62" aria-hidden="true"><rect x="4" y="22" width="92" height="30" rx="12" fill="{c}"></rect>'
                     f'<rect x="16" y="6" width="32" height="26" rx="10" fill="{c}" opacity="0.75"></rect><rect x="52" y="6" width="32" height="26" rx="10" fill="{c}" opacity="0.75"></rect>'
                     f'<rect x="12" y="50" width="8" height="10" rx="3" fill="{c}"></rect><rect x="80" y="50" width="8" height="10" rx="3" fill="{c}"></rect></svg>')

V = [
    dict(tag='1 · WIDE TECH', name='Keng, zamonaviy', font="'Unbounded', sans-serif", w=900, case='upper', col='#FFFFFF', acc='#1FD1A5',
         mark=lambda s, c, a: f'<span style="display: inline-flex; flex-direction: column; align-items: flex-start; gap: {s * 0.08:.0f}px"><span>SOFO</span><span style="width: 100%; height: {s * 0.09:.0f}px; border-radius: 99px; background: {a}"></span></span>',
         icon=lambda a: f'<span style="font-family: \'Unbounded\'; font-weight: 900; font-size: 46px; color: {a}">S</span>', desc='Keng harflar, ostida chiziq. Texnologik, ishonchli — qidiruv xizmati kabi.'),
    dict(tag='2 · ROUNDED', name='Yumshoq, do‘stona', font="'Fredoka', sans-serif", w=700, case='lower', col='#FFFFFF', acc='#38BDF8',
         mark=lambda s, c, a: '<span style="background: linear-gradient(90deg, #1FD1A5, #38BDF8); -webkit-background-clip: text; background-clip: text; color: transparent">sofo</span>',
         icon=lambda a: '<span style="font-family: \'Fredoka\'; font-weight: 700; font-size: 52px; background: linear-gradient(135deg, #1FD1A5, #38BDF8); -webkit-background-clip: text; background-clip: text; color: transparent">s</span>', desc='Hulu va Roku ruhida: dumaloq harflar, yalpiz→ko‘k gradient. Oilaviy, yengil.'),
    dict(tag='3 · CINEMATIC SERIF', name='Kinematografik', font="'DM Serif Display', serif", w=400, case='title', col='#F3E9D2', acc='#F3E9D2',
         mark=lambda s, c, a: f'<span style="display: inline-flex; flex-direction: column; align-items: center; gap: {s * 0.06:.0f}px"><span>Sofo</span><span style="font-family: Manrope; font-size: {s * 0.14:.0f}px; font-weight: 700; letter-spacing: 0.4em; color: #A1A1AD">WHERE TO WATCH</span></span>',
         icon=lambda a: f'<span style="font-family: \'DM Serif Display\'; font-size: 60px; color: {a}">S</span>', desc='Serif, krem rang — A24 va Criterion uslubi. Premium, “kino ixlosmandlari uchun”.'),
    dict(tag='4 · BOLD CONDENSED', name='Kuchli, energiyali', font="'Anton', sans-serif", w=400, case='upper', col='#FFFFFF', acc='#FF5A4E',
         mark=lambda s, c, a: f'<span style="letter-spacing: 0.02em">SO<span style="color: {a}">FO</span></span>',
         icon=lambda a: f'<span style="font-family: \'Anton\'; font-size: 58px; color: {a}">SF</span>', desc='Tor, baland harflar, marjon-qizil aksent. Afisha va poster energiyasi.'),
    dict(tag='5 · SOFA', name='“Divan” belgisi', font="'Syne', sans-serif", w=800, case='lower', col='#FFFFFF', acc='#FBBF24',
         mark=lambda s, c, a: f'<span style="display: inline-flex; align-items: center; gap: {s * 0.18:.0f}px">{SOFA(a, s * 0.95)}<span>sofo</span></span>',
         icon=lambda a: SOFA(a, 70), desc='Belgi — divan: uyda, qulay tomosha. Nomning “sofa” ma’nosini ko‘rsatadi.'),
    dict(tag='6 · GROTESK MONO', name='Minimal, jiddiy', font="'Space Grotesk', sans-serif", w=700, case='lower', col='#FFFFFF', acc='#A78BFA',
         mark=lambda s, c, a: f'<span>sofo<span style="color: {a}">.</span></span>',
         icon=lambda a: f'<span style="font-family: \'Space Grotesk\'; font-weight: 700; font-size: 50px; color: #FFFFFF">s<span style="color: {a}">.</span></span>', desc='Minimal grotesk, binafsha nuqta. Jiddiy, media-brend ohangi.'),
]


def wm(v, s, light=False):
    col = '#0A0A0D' if light and v['col'] in ('#FFFFFF', '#F3E9D2') else v['col']
    return f'<span style="font-family: {v["font"]}; font-weight: {v["w"]}; font-size: {s}px; line-height: 1; color: {col}; letter-spacing: -0.02em; white-space: nowrap">{v["mark"](s, col, v["acc"])}</span>'


def card(v):
    sub = f'<span style="display: inline-flex; align-items: baseline; gap: 10px">{wm(v, 30)}<span style="font-family: {v["font"]}; font-size: 22px; color: {v["acc"]}; font-weight: {v["w"]}">{"CINEMA" if v["case"] == "upper" else "cinema"}</span></span>'
    return f'''<div style="display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: 24px; background: #121217; border: 1px solid #1E1E26">
<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.08em">{v["tag"]}</span>
<div style="height: 170px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: #0A0A0D">{wm(v, 76)}</div>
<div style="height: 110px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: #F4F4F6">{wm(v, 52, True)}</div>
<div style="display: flex; gap: 14px; align-items: center"><span style="width: 96px; height: 96px; flex: 0 0 96px; border-radius: 24px; background: #0A0A0D; border: 1px solid #26262F; display: flex; align-items: center; justify-content: center">{v["icon"](v["acc"])}</span>
<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 18px; font-weight: 800">{v["name"]}</span><span style="font-size: 13px; line-height: 1.5; color: #A1A1AD">{v["desc"]}</span></div></div>
<div style="padding: 14px 16px; border-radius: 14px; background: #0A0A0D">{sub}</div></div>'''


grid6 = '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">' + ''.join(card(v) for v in V) + '</div>'
brand = f'''<div style="padding: 48px; display: flex; flex-direction: column; gap: 28px">
<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 14px; font-weight: 800; color: #1FD1A5; letter-spacing: 0.08em">SOFO · LOGO YO‘NALISHLARI v2 · 2026-11-03</span>
<span style="font-size: 48px; font-weight: 800; letter-spacing: -0.03em">6 xil uslub — bittasini tanlang</span>
<span style="font-size: 16px; color: #A1A1AD; max-width: 900px; line-height: 1.5">Har biri: qora fonda, oq fonda, ilova ikonasi va sub-brend (“cinema”) ko‘rinishi. Tanlangan uslub butun saytga va sub-brendlarga (serial, toons, kids, anime) qo‘llanadi.</span></div>
{grid6}
<div style="display: flex; gap: 16px"><div style="flex: 1; padding: 18px 20px; border-radius: 16px; background: #121217; font-size: 14px; line-height: 1.7; color: #D4D4DC"><b>Domenlar (bo‘sh, RDAP 2026-11-03):</b> sofo.tv · sofocinema.com · sofoserial.com · sofotoons.com · sofokids.com · sofoanime.com · sofowatch.com · sofodub.com</div></div>
</div>'''
html = page('Sofo — logo directions', brand, chrome=False, lang='uz')
html = html.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;display=swap">', FONTS)
OUT['Brand'] = ('Sofo — logo yo‘nalishlari', html, 1440)
