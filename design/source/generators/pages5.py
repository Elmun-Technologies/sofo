from lib import *

OUT = {}
OR = '#FF5A1F'
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;family=Nunito:wght@900&amp;'
         'family=Archivo:wdth,wght@62..125,900&amp;family=Poppins:wght@700;800&amp;family=Inter:wght@500;600;800&amp;display=swap">')


def badge_logo(s, bg=OR, fg='#FFFFFF'):
    return (f'<span style="display: inline-flex; align-items: center; justify-content: center; padding: {s * 0.10:.0f}px {s * 0.28:.0f}px {s * 0.16:.0f}px; border-radius: {s * 0.32:.0f}px; background: {bg}; '
            f'font-family: Nunito; font-weight: 900; font-size: {s}px; line-height: 1; letter-spacing: -0.03em; color: {fg}">sofo</span>')


def flix_logo(s, col=OR):
    return f'<span style="font-family: Archivo; font-stretch: 112%; font-weight: 900; font-size: {s}px; line-height: 1; letter-spacing: -0.02em; color: {col}">SOFO</span>'


def hbo_o(s, col):
    return (f'<span style="display: inline-flex; align-items: center; justify-content: center; width: {s * 0.74:.0f}px; height: {s * 0.74:.0f}px; border: {s * 0.15:.0f}px solid {col}; border-radius: 99px; box-sizing: border-box; margin: 0 {s * 0.02:.0f}px; vertical-align: {-s * 0.005:.0f}px">'
            f'<span style="width: {s * 0.14:.0f}px; height: {s * 0.14:.0f}px; border-radius: 99px; background: {col}"></span></span>')


def hbo_logo(s, col='#FFFFFF'):
    return f'<span style="font-family: Poppins; font-weight: 800; font-size: {s}px; line-height: 1; color: {col}; white-space: nowrap; display: inline-flex; align-items: center">S{hbo_o(s, col)}F{hbo_o(s, col)}</span>'


def route_icon(s, bg=OR):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="{bg}"></circle>'
            '<path d="M66 30 H44 a12 12 0 0 0 0 24 h12 a12 12 0 0 1 0 24 H32" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"></path>'
            '<circle cx="66" cy="30" r="7" fill="#FFFFFF"></circle></svg>')


def spot_logo(s, bg=OR, col='#FFFFFF'):
    return f'<span style="display: inline-flex; align-items: center; gap: {s * 0.22:.0f}px">{route_icon(s * 1.1, bg)}<span style="font-family: Inter; font-weight: 800; font-size: {s}px; line-height: 1; letter-spacing: -0.04em; color: {col}">sofo</span></span>'


def screen_icon(s, col):
    return (f'<svg width="{s}" height="{s * 0.8:.0f}" viewBox="0 0 100 80" aria-hidden="true"><rect x="5" y="5" width="90" height="62" rx="16" fill="none" stroke="{col}" stroke-width="9"></rect>'
            f'<path d="M43 24 L62 36 L43 48 Z" fill="{col}"></path><rect x="34" y="72" width="32" height="7" rx="3.5" fill="{col}"></rect></svg>')


def tv_logo(s, col='#FFFFFF', acc=OR):
    return f'<span style="display: inline-flex; align-items: center; gap: {s * 0.2:.0f}px">{screen_icon(s * 1.05, acc)}<span style="font-family: Inter; font-weight: 600; font-size: {s}px; line-height: 1; letter-spacing: -0.03em; color: {col}">sofo</span></span>'


def app_logo(s, bg=OR, col='#FFFFFF'):
    sq = s * 1.15
    return (f'<span style="display: inline-flex; align-items: center; gap: {s * 0.24:.0f}px"><span style="width: {sq:.0f}px; height: {sq:.0f}px; border-radius: {sq * 0.26:.0f}px; background: {bg}; display: inline-flex; align-items: center; justify-content: center; '
            f'font-family: Nunito; font-weight: 900; font-size: {s * 0.95:.0f}px; color: #FFFFFF; line-height: 1; padding-bottom: {s * 0.08:.0f}px; box-sizing: border-box">s</span>'
            f'<span style="font-family: Nunito; font-weight: 900; font-size: {s}px; line-height: 1; letter-spacing: -0.03em; color: {col}">sofo</span></span>')


V = [
    ('1 · IVI USLUBI', 'Plashka ichida nom', 'Rangli yumaloq plashka, ichida qalin kichik harf. Saytda, ilovada va reklamada bir xil — eng tanib olinadigan.',
     lambda s, d: badge_logo(s), lambda: badge_logo(30), lambda c: badge_logo(30, c)),
    ('2 · NETFLIX USLUBI', 'Faqat harflar, bitta rang', 'Keng, juda qalin “SOFO”, bitta kuchli rang. Afishada, YouTube intro’da kuchli ko‘rinadi.',
     lambda s, d: flix_logo(s * 1.05), lambda: flix_logo(22), lambda c: flix_logo(30, c)),
    ('3 · HBO USLUBI', '“O” — obyektiv', 'Ikki “O” — kamera obyektivi (markazida nuqta). Oq-qora, klassik va premium.',
     lambda s, d: hbo_logo(s, '#0A0A0D' if d else '#FFFFFF'), lambda: hbo_logo(30), lambda c: hbo_logo(30, c)),
    ('4 · SPOTIFY USLUBI', 'Doira-belgi + nom', 'Doira ichida “S” yo‘l-marshrut: kinodan servisga olib boradigan yo‘l. Belgi alohida ham ishlaydi.',
     lambda s, d: spot_logo(s * 0.9, OR, '#0A0A0D' if d else '#FFFFFF'), lambda: route_icon(64), lambda c: spot_logo(26, c)),
    ('5 · APPLE TV USLUBI', 'Ekran-belgi + nom', 'Ekran ichida play + yengil “sofo”. Toza, texnik, Apple TV kabi tinch.',
     lambda s, d: tv_logo(s * 0.9, '#0A0A0D' if d else '#FFFFFF'), lambda: screen_icon(60, OR), lambda c: tv_logo(26, '#FFFFFF', c)),
    ('6 · IVI ILOVA USLUBI', 'Ilova ikonasi + nom', 'Kvadrat ikonka ichida “s” va yonida nom. Ilova do‘konida va brauzer tab’ida darrov tanilinadi.',
     lambda s, d: app_logo(s * 0.85, OR, '#0A0A0D' if d else '#FFFFFF'), lambda: '<span style="width: 64px; height: 64px; border-radius: 17px; background: #FF5A1F; display: inline-flex; align-items: center; justify-content: center; font-family: Nunito; font-weight: 900; font-size: 52px; color: #FFFFFF; line-height: 1; padding-bottom: 5px; box-sizing: border-box">s</span>', lambda c: app_logo(26, c)),
]


def card(i, v):
    tag, name, desc, big, ic, col = v
    alts = ''.join(f'<span style="display: flex; align-items: center; justify-content: center; flex: 1; height: 64px; border-radius: 12px; background: #0A0A0D">{col(c)}</span>' for c in ['#1FD1A5', '#7C5CFF'])
    return f'''<div style="display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: 24px; background: #121217; border: 1px solid #1E1E26">
<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.08em">{tag}</span>
<div style="height: 170px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: #0A0A0D">{big(72, False)}</div>
<div style="height: 110px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: #F4F4F6">{big(48, True)}</div>
<div style="display: flex; gap: 14px; align-items: center"><span style="width: 96px; height: 96px; flex: 0 0 96px; border-radius: 24px; background: #0A0A0D; border: 1px solid #26262F; display: flex; align-items: center; justify-content: center; overflow: hidden">{ic()}</span>
<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 18px; font-weight: 800">{name}</span><span style="font-size: 13px; line-height: 1.5; color: #A1A1AD">{desc}</span></div></div>
<span style="font-size: 11px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">BOSHQA RANGLARDA</span><div style="display: flex; gap: 8px">{alts}</div></div>'''


subs = [('cinema', 'Filmlar'), ('serial', 'Seriallar'), ('toons', 'Multfilmlar'), ('kids', 'Bolalar'), ('anime', 'Anime')]
subH = ''.join(f'<div style="flex: 1; display: flex; align-items: center; gap: 10px; padding: 16px; border-radius: 16px; background: #121217">{badge_logo(24)}<span style="font-family: Nunito; font-weight: 900; font-size: 24px; color: #FFFFFF; letter-spacing: -0.02em">{s}</span></div>' for s, _ in subs)

brand = f'''<div style="padding: 48px; display: flex; flex-direction: column; gap: 28px">
<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 14px; font-weight: 800; color: {OR}; letter-spacing: 0.08em">SOFO · LOGO v3 · IVI + NETFLIX/HBO + SPOTIFY/APPLE TV USLUBLARI</span>
<span style="font-size: 48px; font-weight: 800; letter-spacing: -0.03em">Siz tanlagan 3 uslub asosida — 6 variant</span>
<span style="font-size: 16px; color: #A1A1AD; max-width: 980px; line-height: 1.5">Asosiy rang — <b style="color: {OR}">Sofo Orange {OR}</b>: popcorn va kino zali issiqligi. Netflix qizili va IVI pushti-qizilidan aniq farq qiladi, “qayerda ko‘rish” saytlari orasida bunday rang yo‘q. Har variant pastida yalpiz va binafsha rangda ham ko‘rsatilgan.</span></div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">{"".join(card(i, v) for i, v in enumerate(V))}</div>
<div style="display: flex; flex-direction: column; gap: 12px"><span style="font-size: 20px; font-weight: 800">Sub-brendlar — 1-variant (IVI uslubi) misolida</span><div style="display: flex; gap: 12px">{subH}</div></div>
</div>'''
html = page('Sofo — logo v3', brand, chrome=False, lang='uz')
html = html.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;display=swap">', FONTS)
OUT['Brand'] = ('Sofo — logo v3', html, 1440)
