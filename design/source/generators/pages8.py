from lib import *
from pages5 import app_logo, FONTS

OUT = {}
OR = '#FF5A1F'
LBL = lambda t: f'<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.08em">{t}</span>'


def box(inner, pad=22, bg='#121217', gap=12, extra=''):
    return f'<div style="display: flex; flex-direction: column; gap: {gap}px; padding: {pad}px; border-radius: 20px; background: {bg}; border: 1px solid #1E1E26; {extra}">{inner}</div>'


def head(tag, title, sub=''):
    s = f'<span style="font-size: 16px; color: #A1A1AD; max-width: 980px; line-height: 1.5">{sub}</span>' if sub else ''
    return f'<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 14px; font-weight: 800; color: {OR}; letter-spacing: 0.08em">{tag}</span><span style="font-size: 44px; font-weight: 800; letter-spacing: -0.03em">{title}</span>{s}</div>'


def wrap(inner):
    return f'<div style="padding: 48px; display: flex; flex-direction: column; gap: 28px">{inner}</div>'


# ───────────── Responsive spec ─────────────
bps = [('xs', '360–479', 'Telefon', '3', '12', '16', 'Pastki tab bar, qidiruv ikonka'), ('sm', '480–767', 'Katta telefon', '4', '12', '20', 'Pastki tab bar'),
       ('md', '768–1023', 'Planshet', '5', '16', '24', 'Header: logo + qidiruv + ikonkalar; nav — chip qatori'), ('lg', '1024–1279', 'Noutbuk', '6', '16', '28', 'To\'liq header'),
       ('xl', '1280+', 'Desktop', '6–7', '16–20', '28 · max 1360', 'To\'liq header, sticky')]
bpH = ''.join(f'<tr style="border-top: 1px solid #1E1E26"><td style="padding: 12px; font-family: ui-monospace, monospace; font-weight: 800; color: {OR}">{a}</td><td style="padding: 12px; font-weight: 700">{b}</td><td style="padding: 12px; color: #A1A1AD">{c}</td><td style="padding: 12px; text-align: center; font-weight: 800">{d}</td><td style="padding: 12px; text-align: center">{e}</td><td style="padding: 12px; text-align: center">{f}</td><td style="padding: 12px; color: #D4D4DC">{g}</td></tr>' for a, b, c, d, e, f, g in bps)
bpT = f'<table style="width: 100%; border-collapse: collapse; font-size: 14px"><thead><tr style="font-size: 12px; color: #6E6E7A; text-align: left"><th style="padding: 8px 12px">NOMI</th><th style="padding: 8px 12px">KENGLIK, PX</th><th style="padding: 8px 12px">QURILMA</th><th style="padding: 8px 12px; text-align: center">POSTER / QATOR</th><th style="padding: 8px 12px; text-align: center">GUTTER</th><th style="padding: 8px 12px; text-align: center">CHETDAN</th><th style="padding: 8px 12px">NAVIGATSIYA</th></tr></thead><tbody>{bpH}</tbody></table>'


def wf(w, h, inner):
    return f'<div style="width: {w}px; height: {h}px; border-radius: 14px; background: #0A0A0D; border: 2px solid #3A3A45; padding: 8px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; overflow: hidden">{inner}</div>'


bl = lambda h, c='#26262F', w='100%', t='': f'<span style="display: flex; align-items: center; justify-content: center; width: {w}; height: {h}px; border-radius: 6px; background: {c}; font-size: 10px; font-weight: 800; color: #0A0A0D; flex: 0 0 auto">{t}</span>'
row = lambda *a: f'<div style="display: flex; gap: 6px">{"".join(a)}</div>'
mob = wf(180, 360, bl(18, '#3A3A45', '100%', '') + bl(56, OR, '100%', 'QISQA JAVOB') + row(bl(70, '#3A3A45', '40%', 'poster'), bl(70, '#26262F', '60%', 'nom · til')) + bl(28, '#1F3B66', '100%', '<span style="color:#fff">servislar</span>') + bl(28, '#1F3B66', '100%', '') + bl(40, '#26262F', '100%', 'tarix (vertikal)') + bl(30, '#26262F', '100%', 'qismlar') + '<span style="flex: 1"></span>' + bl(26, OR, '100%', 'STICKY CTA') + bl(16, '#3A3A45'))
tab = wf(300, 360, bl(18, '#3A3A45') + bl(14, '#26262F', '100%', 'nav chips') + bl(60, OR, '100%', 'QISQA JAVOB') + row(bl(110, '#3A3A45', '34%', 'poster'), f'<div style="flex: 1; display: flex; flex-direction: column; gap: 6px">{bl(30, "#26262F", "100%", "nom · til")}{bl(74, "#1F3B66", "100%", "<span style=color:#fff>servislar</span>")}</div>') + row(bl(60, '#26262F', '50%', 'til jadvali'), bl(60, '#26262F', '50%', 'tarix')) + bl(40, '#26262F', '100%', 'treylerlar — 2 ustun'))
desk = wf(520, 360, bl(18, '#3A3A45') + row(bl(150, '#3A3A45', '22%', 'poster'), bl(150, OR, '48%', 'QISQA JAVOB + HERO'), bl(150, '#1F3B66', '30%', '<span style=color:#fff>servislar</span>')) + row(bl(80, '#26262F', '60%', 'tarix — yo\'laklar'), bl(80, '#26262F', '40%', 'change log')) + bl(60, '#26262F', '100%', 'cast · o\'xshash · FAQ'))
rules = [('Header', 'xl/lg: logo · nav · qidiruv maydoni · edition · bell · My list. md: nav chip qatoriga tushadi. xs/sm: logo · qidiruv ikonka · edition · bell; pastda 4 tabli bar (Home, Search, New, My list).'),
         ('Qisqa javob', 'Hamma o\'lchamda birinchi blok. xs: poster pastga tushadi, CTA pastda sticky (50 px).'),
         ('Servislar / til jadvali', 'xl: yonma-yon jadval. xs: har servis — alohida karta, tillar chip bo\'lib.'),
         ('Mavjudlik tarixi', 'xl: gorizontal yo\'laklar. xs: vertikal ro\'yxat (rangli nuqta + sana).'),
         ('Katalog filtrlari', 'lg+: chap sidebar 260 px. md va kichik: "Filters · N" tugmasi → pastdan chiqadigan oyna, "Show N movies" sticky.'),
         ('Yangi va ketayotganlar', 'lg+: 7 ustunli kalendar. xs/md: kun chip\'lari + tanlangan kun ro\'yxati.'),
         ('Posterlar qatori', 'Grid: 3 / 4 / 5 / 6 / 7. Gorizontal qatorlar telefonda scroll-snap, 116 px kartochka.'),
         ('Oynalar (modal)', 'lg+: markazda 420–480 px. xs/sm: pastdan chiqadigan sheet, tepada tutqich.'),
         ('Shrift o\'lchami', 'H1: 56 → 44 → 28. H2: 24 → 22 → 18. Matn: 16 → 15 → 14. Belgi (badge): 11 → 10.'),
         ('Teginish', 'Har bosiladigan element ≥ 44×44 px. Chiplar 32 px, lekin teginish zonasi 44 px.')]
ruH = ''.join(f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 14px; background: #0F0F14"><span style="font-size: 15px; font-weight: 800">{a}</span><span style="font-size: 13px; line-height: 1.55; color: #D4D4DC">{b}</span></div>' for a, b in rules)
resp = wrap(head('RESPONSIVLIK · v1 · 2026-11-04', 'Bitta shablon — 5 o‘lcham', 'Mobil alohida sayt emas: har sahifa shu qoidalar bilan moslashadi. Google sahifani telefon versiyasi bo‘yicha baholaydi (mobile-first indexing).') +
            box(LBL('BREAKPOINTLAR VA GRID') + bpT, 20) +
            box(LBL('FILM SAHIFASI — 3 O‘LCHAMDA') + f'<div style="display: flex; gap: 28px; align-items: flex-end">{mob}{tab}{desk}</div>', 22) +
            f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">{ruH}</div>')
OUT['Responsive'] = ('Responsivlik qoidalari', resp)

# ───────────── Design system v2 ─────────────
ty = [('Display', '56 / 1.0 / 800 / −3%', 56), ('H1', '44 / 1.05 / 800', 44), ('H2', '24 / 1.2 / 800', 24), ('Title', '17 / 1.3 / 800', 17), ('Body', '15 / 1.55 / 500', 15), ('Small', '13 / 1.5 / 600', 13), ('Badge', '11 / 1 / 800', 11)]
tyH = ''.join(f'<div style="display: flex; align-items: baseline; gap: 18px; padding: 8px 0; border-top: 1px solid #1E1E26"><span style="width: 90px; font-size: 12px; color: #6E6E7A; font-weight: 700">{n}</span><span style="flex: 1; font-size: {s}px; font-weight: {800 if s > 15 else 600}; line-height: 1.1; white-space: nowrap; overflow: hidden">Arcane — türkçe dublaj</span><span style="font-family: ui-monospace, monospace; font-size: 12px; color: #A1A1AD">{d}</span></div>' for n, d, s in ty)
sp = [4, 8, 12, 16, 20, 24, 32, 40, 56]
spH = ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 6px"><span style="width: {s}px; height: {s}px; background: {OR}; border-radius: 3px"></span><span style="font-size: 11px; color: #A1A1AD; font-family: ui-monospace, monospace">{s}</span></div>' for s in sp)
rd = [('chip', 999), ('badge', 999), ('input', 12), ('button', 12), ('poster', 12), ('card', 16), ('panel', 20), ('hero', 24), ('icon', '27%')]
rdH = ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 6px"><span style="width: 56px; height: 56px; background: #26262F; border: 2px solid {OR}; border-radius: {r if isinstance(r, str) else str(min(r, 28)) + "px"}"></span><span style="font-size: 11px; color: #A1A1AD">{n} · {r}</span></div>' for n, r in rd)
btns = (f'<a href="#" style="height: 44px; padding: 0 18px; display: inline-flex; align-items: center; border-radius: 12px; background: {OR}; color: #0A0A0D; font-size: 14px; font-weight: 800">Watch on Netflix ↗</a>'
        '<a href="#" style="height: 44px; padding: 0 18px; display: inline-flex; align-items: center; border-radius: 12px; background: #1C1C24; font-size: 14px; font-weight: 800">+ My list</a>'
        '<a href="#" style="height: 44px; padding: 0 18px; display: inline-flex; align-items: center; border-radius: 12px; border: 1px solid #2E2E38; font-size: 14px; font-weight: 800">▶ Trailer</a>'
        '<a href="#" style="height: 44px; padding: 0 18px; display: inline-flex; align-items: center; border-radius: 12px; background: #229ED9; font-size: 14px; font-weight: 800">Connect Telegram</a>'
        f'<a href="#" style="height: 44px; padding: 0 18px; display: inline-flex; align-items: center; border-radius: 12px; background: {OR}; color: #0A0A0D; font-size: 14px; font-weight: 800; opacity: 0.4">Disabled</a>')
bdg = ''.join(badge(t, k, 12) for t, k in [('türkçe dublaj', 'dub'), ('türkçe altyazı', 'sub'), ('NEW DUB', 'new'), ('LEAVING NOV 30', 'leave'), ('FREE WITH ADS', 'free'), ('On Netflix ✓', 'ok'), ('Not confirmed', 'n')])
inp = f'<div style="display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 10px 0 16px; border-radius: 16px; background: #15151B; border: 1px solid {OR}">{SEARCH_ICON}<span style="flex: 1; font-size: 15px; color: #6E6E7A">Search movies, series, people…</span><span style="height: 38px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: 10px; background: #1C1C24; font-size: 13px; font-weight: 700">Audio: Türkçe ▾</span></div>'
st = ''.join(f'<div style="display: flex; flex-direction: column; gap: 6px; align-items: center"><span style="height: 44px; padding: 0 16px; display: inline-flex; align-items: center; border-radius: 12px; font-size: 13px; font-weight: 800; {s}">Button</span><span style="font-size: 11px; color: #A1A1AD">{n}</span></div>' for n, s in [('default', f'background: {OR}; color: #0A0A0D'), ('hover', 'background: #FF7A47; color: #0A0A0D'), ('focus', f'background: {OR}; color: #0A0A0D; box-shadow: 0 0 0 3px #0A0A0D, 0 0 0 5px #FFD5C7'), ('pressed', 'background: #E04A12; color: #0A0A0D')])
mob_cmp = f'''<div style="display: flex; gap: 16px; align-items: flex-end">
<div style="width: 300px; border-radius: 18px 18px 0 0; background: #15151B; padding: 10px 14px 16px; display: flex; flex-direction: column; gap: 10px"><span style="align-self: center; width: 36px; height: 4px; border-radius: 99px; background: #3A3A45"></span><span style="font-size: 15px; font-weight: 800">Bottom sheet</span><span style="height: 40px; border-radius: 10px; background: #0F0F14"></span><span style="height: 44px; border-radius: 12px; background: {OR}"></span></div>
<div style="width: 300px; display: flex; justify-content: space-around; padding: 10px 0 18px; background: #0A0A0D; border-top: 1px solid #18181E; border-radius: 12px">{"".join(f'<span style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; font-weight: 700; color: {OR if t == "Home" else "#A1A1AD"}"><span style="font-size: 18px">{i}</span>{t}</span>' for t, i in [("Home", "⌂"), ("Search", "⌕"), ("New", "◷"), ("My list", "♡")])}</div>
<div style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 14px; background: #2A150D; border: 1px solid #5A2A17; font-size: 14px; font-weight: 700">✓ Added to My list <span style="color: {OR}">Undo</span></div></div>'''
pal = [('Sofo Orange', OR), ('Hover', '#FF7A47'), ('Pressed', '#E04A12'), ('Tint', '#FFD5C7'), ('Deep', '#2A150D'), ('Ink', '#0A0A0D'), ('Surface', '#15151B'), ('Surface 2', '#1C1C24'), ('Line', '#26262F'), ('Text', '#FFFFFF'), ('Text 2', '#A1A1AD'), ('Text 3', '#6E6E7A'), ('Dub', '#3B82F6'), ('Available', '#4ADE80'), ('Leaving', '#FBBF24'), ('Free', '#A78BFA')]
palH = ''.join(f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="height: 48px; border-radius: 10px; background: {c}; border: 1px solid #26262F"></span><span style="font-size: 12px; font-weight: 800">{n}</span><span style="font-size: 11px; color: #A1A1AD; font-family: ui-monospace, monospace">{c}</span></div>' for n, c in pal)
a11y = '<span style="font-size: 13px; line-height: 1.7; color: #D4D4DC">Kontrast (WCAG AA): qora matn #0A0A0D to‘q sariqda — 6,4:1 ✓ · to‘q sariq matn qora fonda — 6,4:1 ✓ · <b style="color:#FFD5C7">oq matn to‘q sariqda — 3,1:1, faqat ≥ 18 px qalin yoki logo</b> · #A1A1AD qora fonda — 7,7:1 ✓ · Fokus halqasi har doim ko‘rinadi.</span>'
ds = wrap(head('DIZAYN TIZIMI v2 · SOFO ORANGE · 2026-11-04', 'Tokenlar va komponentlar', 'Shrift: interfeys — Manrope 500–800, logo — Nunito Black. Dark-only. Barcha sahifalar shu tokenlardan yig‘iladi.') +
          f'<div style="display: flex; gap: 20px">{box(LBL("LOGO") + f"<div style=\'display:flex;gap:28px;align-items:center\'>{app_logo(48)}{app_logo(28)}</div>", extra="flex: 0 0 420px")}{box(LBL("RANG") + f"<div style=\'display:grid;grid-template-columns:repeat(8,1fr);gap:10px\'>{palH}</div>", extra="flex: 1")}</div>' +
          f'<div style="display: flex; gap: 20px">{box(LBL("SHRIFT SHKALASI") + tyH, extra="flex: 1.3")}<div style="flex: 1; display: flex; flex-direction: column; gap: 20px">{box(LBL("BO‘SHLIQ (4 px qadam)") + f"<div style=\'display:flex;gap:14px;align-items:flex-end\'>{spH}</div>")}{box(LBL("RADIUS") + f"<div style=\'display:flex;gap:14px;flex-wrap:wrap\'>{rdH}</div>")}</div></div>' +
          box(LBL('TUGMALAR') + f'<div style="display: flex; gap: 10px; flex-wrap: wrap">{btns}</div><div style="display: flex; gap: 22px; margin-top: 6px">{st}</div>') +
          f'<div style="display: flex; gap: 20px">{box(LBL("BELGILAR (BADGE)") + f"<div style=\'display:flex;gap:6px;flex-wrap:wrap\'>{bdg}</div>", extra="flex: 1")}{box(LBL("QIDIRUV MAYDONI") + inp, extra="flex: 1")}</div>' +
          f'<div style="display: flex; gap: 20px">{box(LBL("OFFER QATORI") + offer("Netflix", "Subscription · TR audio ✓ · TR subtitles ✓ · 4K", "Watch on Netflix ↗", True) + offer("Prime", "Buy ₺149 / season · TR subtitles only", "Buy ↗"), extra="flex: 1")}{box(LBL("POSTER KARTOCHKA") + "<div style=\'display:grid;grid-template-columns:repeat(3,1fr);gap:14px\'>" + poster("arcane") + poster("moana", None, (("NEW DUB", "new"),)) + poster("encanto", "Leaves Nov 8", (("LEAVING", "leave"),)) + "</div>", extra="flex: 1")}</div>' +
          box(LBL('MOBIL KOMPONENTLAR') + mob_cmp) + box(LBL('KIRISH IMKONIYATI') + a11y))
OUT['DS2'] = ('Dizayn tizimi v2', ds)

# ───────────── Alerts: Telegram + email ─────────────
def tg_msg(img, text, btns):
    b = ''.join(f'<span style="flex: 1; height: 36px; border-radius: 10px; background: #2B5278; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700">{x}</span>' for x in btns)
    return f'''<div style="display: flex; flex-direction: column; gap: 4px; max-width: 290px"><div style="border-radius: 14px 14px 14px 4px; background: #182533; overflow: hidden">
<img src="{img}" alt="" style="width: 100%; height: 130px; object-fit: cover"><div style="padding: 10px 12px; font-size: 13px; line-height: 1.5; color: #E8EEF4">{text}<div style="text-align: right; font-size: 10px; color: #6D7F8F">09:40</div></div></div><div style="display: flex; gap: 4px">{b}</div></div>'''


tg = f'''<div style="width: 340px; border-radius: 30px; border: 6px solid #1C1C24; overflow: hidden; background: #0E1621; display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #17212B"><span style="width: 36px; height: 36px; border-radius: 99px; background: {OR}; display: flex; align-items: center; justify-content: center; font-family: Nunito; font-weight: 900; font-size: 22px; padding-bottom: 3px; box-sizing: border-box">s</span><span style="display: flex; flex-direction: column"><span style="font-size: 14px; font-weight: 700">Sofo</span><span style="font-size: 11px; color: #6D7F8F">bot</span></span></div>
<div style="padding: 12px; display: flex; flex-direction: column; gap: 12px">
{tg_msg(B(BD['arcane']), '🔊 <b>Arcane — Season 2</b> is now in <b>Turkish</b> on Netflix.<br>All 9 episodes · türkçe dublaj ✓', ['Watch on Netflix ↗', 'Mute'])}
{tg_msg(B(BD['encanto']), '⏳ <b>Encanto</b> leaves <b>Disney+</b> on Nov 8 — 5 days left.<br>Turkish dub ✓', ['Watch now ↗', 'Remind in 3 days'])}
{tg_msg(B(BD['spider']), '📅 <b>Your Friday list</b><br>• 4 new Turkish dubs<br>• 3 titles leaving your services<br>• 1 title from your list is now free', ['Open list ↗'])}
</div></div>'''
ln = lambda k, t, m: f'<tr><td style="padding: 8px 0; width: 60px"><img src="{B(P[k])}" alt="" style="width: 48px; height: 72px; object-fit: cover; border-radius: 6px"></td><td style="padding: 8px 12px"><div style="font-size: 15px; font-weight: 800; color: #0A0A0D">{t}</div><div style="font-size: 13px; color: #5A5A66">{m}</div></td></tr>'
email = f'''<div style="width: 600px; border-radius: 10px; overflow: hidden; background: #F4F4F6; color: #0A0A0D">
<div style="padding: 18px 28px; background: #0A0A0D">{app_logo(22)}</div>
<div style="padding: 28px; display: flex; flex-direction: column; gap: 16px; background: #FFFFFF">
<span style="font-size: 12px; font-weight: 800; color: {OR}; letter-spacing: 0.08em">FRIDAY · NOV 6, 2026 · TÜRKİYE</span>
<span style="font-size: 26px; font-weight: 800; letter-spacing: -0.02em">4 new Turkish dubs, 3 leaving soon</span>
<span style="font-size: 15px; font-weight: 800">New in Turkish</span><table style="border-collapse: collapse">{ln('spider', 'Spider-Man: Across the Spider-Verse', 'Netflix · türkçe dublaj')}{ln('moana', 'Moana 2', 'Disney+ · türkçe dublaj')}</table>
<span style="font-size: 15px; font-weight: 800">Leaving your services</span><table style="border-collapse: collapse">{ln('encanto', 'Encanto', 'Disney+ · leaves Nov 8')}</table>
<a href="#" style="align-self: flex-start; height: 44px; padding: 0 20px; display: inline-flex; align-items: center; border-radius: 10px; background: {OR}; color: #0A0A0D; font-size: 14px; font-weight: 800">See everything on sofo.tv</a></div>
<div style="padding: 18px 28px; font-size: 11px; line-height: 1.6; color: #6E6E7A">You get this because you follow Turkish dubs on Sofo. <u>Change alerts</u> · <u>Unsubscribe</u> · Sofo never hosts video. KVKK: we store only your email and alert settings.</div></div>'''
rules2 = '<span style="font-size: 13px; line-height: 1.8; color: #D4D4DC">• Bitta xabar — bitta hodisa, ≤ 24 soatda · • Haftalik dayjest — juma 18:00 (mahalliy vaqt) · • Kuniga max 3 Telegram xabar, qolganlari dayjestga · • Har xabarda “Mute / Unsubscribe” · • Havolalar UTM bilan: utm_source=telegram|email</span>'
al = wrap(head('ESLATMALAR · TELEGRAM + EMAIL', 'Alert shablonlari', '“Dublaj chiqdi”, “ketyapti”, haftalik dayjest. Telegram — asosiy kanal, email — haftalik.') + f'<div style="display: flex; gap: 32px; align-items: flex-start">{tg}{email}</div>' + box(LBL('QOIDALAR') + rules2))
OUT['Alerts'] = ('Eslatma shablonlari', al)

# ───────────── Admin ─────────────
def side(on):
    items = [('Dashboard', '▦'), ('Data QA', '⚑'), ('Unmatched', '⇄'), ('Lists', '☰'), ('Pages & SEO', '⌖'), ('Releases', '◷'), ('Users', '◉')]
    li = ''.join(f'<span style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; font-size: 14px; font-weight: 700; {"background: #1C1C24; color: #FFFFFF" if n == on else "color: #A1A1AD"}"><span style="width: 18px; text-align: center">{i}</span>{n}</span>' for n, i in items)
    return f'<aside style="flex: 0 0 220px; padding: 18px 12px; border-right: 1px solid #18181E; display: flex; flex-direction: column; gap: 4px"><div style="padding: 4px 12px 16px; display: flex; align-items: center; gap: 8px">{app_logo(20)}<span style="font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: #26262F">ADMIN</span></div>{li}</aside>'


def adm(on, title, inner):
    return f'<div style="display: flex; min-height: 900px">{side(on)}<main style="flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 22px"><div style="display: flex; align-items: center; gap: 12px"><span style="font-size: 26px; font-weight: 800">{title}</span><span style="margin-left: auto; font-size: 13px; color: #A1A1AD">Edition: Türkiye ▾ · founder@sofo.tv</span></div>{inner}</main></div>'


kpi = ''.join(box(f'<span style="font-size: 12px; color: #A1A1AD; font-weight: 700">{a}</span><span style="font-size: 30px; font-weight: 800; color: {c}">{b}</span><span style="font-size: 12px; color: #6E6E7A">{d}</span>', 18, gap=4, extra='flex: 1') for a, b, c, d in [
    ('Titles (TR)', '512', '#FFFFFF', '+12 this week'), ('Active offers', '3 940', '#FFFFFF', '8 services'), ('Checked ≤ 48 h', '98.6%', '#4ADE80', 'target 99%'), ('Indexable pages', '431 / 512', '#FFFFFF', '81 noindex'), ('Open reports', '7', '#FBBF24', 'oldest 19 h')])
runs = [('Nov 4 06:00', 'streaming_availability · TR', '✓', '3 940 offers · 42 events', '11 m'), ('Nov 4 05:30', 'tmdb_metadata', '✓', '512 titles · 3 new', '4 m'),
        ('Nov 3 06:00', 'streaming_availability · TR', '!', 'Netflix: 214 timeouts → retried', '18 m'), ('Nov 3 05:30', 'tmdb_metadata', '✓', '509 titles', '4 m')]
runH = ''.join(f'<tr style="border-top: 1px solid #1E1E26"><td style="padding: 10px 12px; color: #A1A1AD">{a}</td><td style="padding: 10px 12px; font-weight: 700">{b}</td><td style="padding: 10px 12px; font-weight: 800; color: {"#4ADE80" if c == "✓" else "#FBBF24"}">{c}</td><td style="padding: 10px 12px; color: #D4D4DC">{d}</td><td style="padding: 10px 12px; color: #A1A1AD">{e}</td></tr>' for a, b, c, d, e in runs)
ev = ''.join(f'<div style="display: flex; gap: 10px; align-items: center; padding: 8px 0; border-top: 1px solid #1E1E26">{badge(t, k)}<span style="flex: 1; font-size: 13px">{x}</span><span style="font-size: 12px; color: #6E6E7A">{d}</span></div>' for t, k, x, d in [('added', 'new', 'Moana 2 → Disney+', '06:11'), ('audio_added', 'dub', 'Spider-Verse · Netflix · tr', '06:09'), ('leaving', 'leave', 'Encanto · Disney+ · Nov 8', '06:04'), ('removed', 'n', 'The Wild Robot · Netflix', 'Nov 3')])
dash = adm('Dashboard', 'Dashboard', f'<div style="display: flex; gap: 14px">{kpi}</div><div style="display: flex; gap: 18px; align-items: flex-start">{box(LBL("INGEST RUNS") + f"<table style=\'width:100%;border-collapse:collapse;font-size:13px\'>{runH}</table>", 18, extra="flex: 1.5")}{box(LBL("LATEST EVENTS") + ev, 18, extra="flex: 1")}</div>')
OUT['AdminDash'] = ('Admin — Dashboard', dash)

rq = [('robot', 'The Wild Robot', 'Prime Video', 'Turkish dub is wrong', 'open', '19 h'), ('aot', 'Attack on Titan', 'Prime Video', 'Not on this service anymore', 'rechecking', '6 h'),
      ('mario', 'The Super Mario Bros. Movie', 'Netflix', 'Price is wrong', 'open', '3 h'), ('coco', 'Coco', 'Disney+', 'Link doesn’t open the title', 'fixed', '1 d')]
stc = {'open': 'leave', 'rechecking': 'dub', 'fixed': 'ok'}
rqH = ''.join(f'<tr style="border-top: 1px solid #1E1E26"><td style="padding: 10px 12px"><div style="display: flex; gap: 10px; align-items: center"><img src="{B(P[k])}" alt="" style="width: 30px; height: 45px; object-fit: cover; border-radius: 4px"><span style="font-weight: 800">{t}</span></div></td><td style="padding: 10px 12px; color: #D4D4DC">{s}</td><td style="padding: 10px 12px">{q}</td><td style="padding: 10px 12px">{badge(st_, stc[st_])}</td><td style="padding: 10px 12px; color: #A1A1AD">{a}</td><td style="padding: 10px 12px"><span style="display: flex; gap: 6px"><span style="height: 32px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: 8px; background: {OR}; color: #0A0A0D; font-size: 12px; font-weight: 800">Recheck</span><span style="height: 32px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: 8px; background: #1C1C24; font-size: 12px; font-weight: 800">Edit offer</span></span></td></tr>' for k, t, s, q, st_, a in rq)
um = ''.join(f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid #1E1E26"><span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 14px; font-weight: 800">“{q}”</span><span style="font-size: 12px; color: #A1A1AD">{m}</span></span><span style="font-size: 12px; color: #D4D4DC">{c}</span><span style="height: 32px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: 8px; background: #1C1C24; font-size: 12px; font-weight: 800">Link TMDB ID</span></div>' for q, m, c in [('Legend', 'Service title · 4 TMDB candidates', 'Netflix TR'), ('Obsession', 'Service title · 2 candidates (2023 / 2025)', 'Prime TR'), ('Ben Bu Cihana Sığmazam', 'Turkish title · no TMDB match', 'tabii')])
qa = adm('Data QA', 'Data QA', box(LBL('“SOMETHING WRONG?” REPORTS — SLA 24 H') + f"<table style='width:100%;border-collapse:collapse;font-size:13px'><thead><tr style='font-size:11px;color:#6E6E7A;text-align:left'><th style='padding:6px 12px'>TITLE</th><th style='padding:6px 12px'>SERVICE</th><th style='padding:6px 12px'>ISSUE</th><th style='padding:6px 12px'>STATUS</th><th style='padding:6px 12px'>AGE</th><th></th></tr></thead><tbody>{rqH}</tbody></table>", 18) +
         box(LBL('UNMATCHED TITLES — ENTITY RESOLUTION') + um, 18))
OUT['AdminQA'] = ('Admin — Data QA', qa)

li = [('spirited', 'Spirited Away', 'A girl stuck in a spirit world takes a job in a bathhouse to free her parents.'), ('coco', 'Coco', 'A boy who dreams of music crosses into the Land of the Dead.'), ('spider', 'Spider-Man: Across the Spider-Verse', 'Miles Morales jumps between universes.')]
liH = ''.join(f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 12px; background: #0F0F14"><span style="color: #6E6E7A; font-size: 16px">⋮⋮</span><span style="width: 22px; font-weight: 800; color: #6E6E7A">{i+1}</span><img src="{B(P[k])}" alt="" style="width: 36px; height: 54px; object-fit: cover; border-radius: 5px"><span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 14px; font-weight: 800">{t}</span><span style="font-size: 12px; color: #A1A1AD">{d}</span></span>{badge("TR dub ✓ · 3 services", "ok")}</div>' for i, (k, t, d) in enumerate(li))
fld = lambda l, v, h=44: f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: #A1A1AD">{l}</span><div style="min-height: {h}px; padding: 12px 14px; border-radius: 12px; background: #0A0A0D; border: 1px solid #26262F; font-size: 14px; line-height: 1.5; box-sizing: border-box">{v}</div></div>'
ed = adm('Lists', 'List editor', f'''<div style="display: flex; gap: 18px; align-items: flex-start">
{box(fld("Title (TR edition)", "The 20 best animated movies with Turkish dub") + fld("Slug", "/tr/liste/en-iyi-dublajli-animasyonlar") + fld("Intro — human-written", "Movies the whole family can watch in Turkish tonight. We only list titles where a service in Türkiye confirms Turkish audio…", 90) + LBL("ITEMS · 20") + liH + '<span style="height: 40px; border-radius: 10px; border: 1px dashed #3A3A45; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #A1A1AD">+ Add title (search)</span>', 20, extra="flex: 1.6")}
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px">{box(LBL("PUBLISH") + '<span style="display: flex; justify-content: space-between; font-size: 14px">Status ' + badge("Draft", "n", 12) + '</span><span style="display: flex; justify-content: space-between; font-size: 14px">Quality gate ' + badge("19 / 20 pass", "ok", 12) + '</span><span style="font-size: 12px; color: #FBBF24">1 title has no confirmed offer in TR — will be hidden</span>' + btn("Publish", "pri", 44) + btn("Preview", "sec", 44))}
{box(LBL("SEO") + '<span style="font-size: 13px; line-height: 1.7; color: #D4D4DC">Index: <b>index</b> · hreflang: tr, en (pending)<br>Target query: “türkçe dublaj animasyon filmleri” · volume: Keyword Planner</span>')}</div></div>''')
OUT['AdminLists'] = ('Admin — List editor', ed)

for k in list(OUT):
    t, inner = OUT[k]
    html = page(t, inner, chrome=False, lang='uz').replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;family=Nunito:wght@900&amp;display=swap">', FONTS)
    OUT[k] = (t, html, 1440)
