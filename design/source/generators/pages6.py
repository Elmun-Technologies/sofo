from lib import *
from pages5 import app_logo, FONTS

OUT = {}
OR = '#FF5A1F'


def sq(s, bg=OR):
    return (f'<span style="width: {s}px; height: {s}px; border-radius: {s * 0.27:.0f}px; background: {bg}; display: inline-flex; align-items: center; justify-content: center; '
            f'font-family: Nunito; font-weight: 900; font-size: {s * 0.82:.0f}px; color: #FFFFFF; line-height: 1; padding-bottom: {s * 0.07:.0f}px; box-sizing: border-box">s</span>')


subs = [('cinema', 'Filmlar'), ('serial', 'Seriallar'), ('toons', 'Multfilmlar'), ('kids', 'Bolalar'), ('anime', 'Anime')]
subH = ''.join(f'<div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 18px; background: #121217"><span style="display: inline-flex; align-items: center; gap: 8px; white-space: nowrap">{app_logo(24)}<span style="font-family: Nunito; font-weight: 900; font-size: 24px; color: {OR}; letter-spacing: -0.02em">{s}</span></span><span style="font-size: 12px; color: #A1A1AD">{d} · sofo.tv/{s} · sofo{s}.com</span></div>' for s, d in subs)
pal = [('Sofo Orange', OR, 'Asosiy: logo, CTA, aktiv holat'), ('Orange tint', '#FFD5C7', 'Hover, och fon matni'), ('Orange deep', '#2A150D', 'Aksent kartalar foni'),
       ('Ink', '#0A0A0D', 'Sahifa foni'), ('Surface', '#15151B', 'Kartalar'), ('Line', '#26262F', 'Chegara'), ('Text 2', '#A1A1AD', 'Ikkilamchi matn'),
       ('Dub — blue', '#3B82F6', 'türkçe dublaj belgisi'), ('Available — green', '#4ADE80', '“Bor” holati'), ('Leaving — yellow', '#FBBF24', 'Ketayotganlar'), ('Free — violet', '#A78BFA', 'Bepul / reklamali')]
palH = ''.join(f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="height: 64px; border-radius: 14px; background: {c}; border: 1px solid #26262F"></span><span style="font-size: 13px; font-weight: 800">{n}</span><span style="font-family: ui-monospace, monospace; font-size: 12px; color: #A1A1AD">{c}</span><span style="font-size: 11px; color: #6E6E7A">{u}</span></div>' for n, c, u in pal)
sheet = f'''<div style="padding: 48px; display: flex; flex-direction: column; gap: 30px">
<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 14px; font-weight: 800; color: {OR}; letter-spacing: 0.08em">SOFO · BREND · TASDIQLANDI 2026-11-03</span>
<span style="font-size: 48px; font-weight: 800; letter-spacing: -0.03em">Logo: ilova ikonasi + nom, Sofo Orange</span></div>
<div style="display: flex; gap: 20px">
<div style="flex: 1.4; height: 300px; border-radius: 24px; background: #0A0A0D; border: 1px solid #1E1E26; display: flex; align-items: center; justify-content: center">{app_logo(96)}</div>
<div style="flex: 1; height: 300px; border-radius: 24px; background: #F4F4F6; display: flex; align-items: center; justify-content: center">{app_logo(64, OR, '#0A0A0D')}</div>
<div style="flex: 0.7; height: 300px; border-radius: 24px; background: {OR}; display: flex; align-items: center; justify-content: center"><span style="font-family: Nunito; font-weight: 900; font-size: 64px; color: #FFFFFF; letter-spacing: -0.03em">sofo</span></div></div>
<div style="display: flex; gap: 20px; align-items: stretch">
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 22px; border-radius: 20px; background: #121217"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.08em">IKONKA · 1024 / 180 / 64 / 32 / 16</span>
<div style="display: flex; gap: 18px; align-items: flex-end">{sq(120)}{sq(72)}{sq(48)}{sq(32)}{sq(16)}</div><span style="font-size: 13px; color: #A1A1AD">Ilova, favicon, Telegram/Instagram avatar — bitta belgi.</span></div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 22px; border-radius: 20px; background: #121217"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.08em">HEADER VA STORY KARTA</span>
<div style="display: flex; align-items: center; gap: 18px; padding: 12px 16px; border-radius: 14px; background: #0A0A0D; border: 1px solid #18181E">{app_logo(22)}<span style="font-size: 13px; font-weight: 700">Home</span><span style="font-size: 13px; color: #A1A1AD">Movies</span><span style="font-size: 13px; color: #A1A1AD">Series</span><span style="flex: 1; height: 36px; border-radius: 10px; background: #15151B; border: 1px solid #26262F"></span></div>
<div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 14px; background: linear-gradient(180deg, #2A150D, #0A0A0D)">{app_logo(20)}<span style="font-size: 13px; color: #D4D4DC">sofo.tv/arcane</span></div></div></div>
<div style="display: flex; flex-direction: column; gap: 12px"><span style="font-size: 20px; font-weight: 800">Sub-brendlar</span><div style="display: flex; gap: 12px">{subH}</div></div>
<div style="display: flex; flex-direction: column; gap: 12px"><span style="font-size: 20px; font-weight: 800">Ranglar</span><div style="display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: 12px">{palH}</div></div>
<div style="padding: 18px 20px; border-radius: 16px; background: #121217; font-size: 14px; line-height: 1.8; color: #D4D4DC">Shrift: logo — Nunito Black (900), interfeys — Manrope · Har doim kichik harf “sofo” · Ikonka burchagi 27% · Atrofida bo‘sh joy ≥ ikonka balandligining yarmi · Minimal o‘lcham: logo 20 px, ikonka 16 px · Sub-domenlar 301 → sofo.tv/{{bo‘lim}}</div>
</div>'''
html = page('Sofo — brand', sheet, chrome=False, lang='uz').replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;family=Nunito:wght@900&amp;display=swap">', FONTS)
OUT['Brand'] = ('Sofo — brend', html, 1440)
