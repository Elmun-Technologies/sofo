from lib import *

OUT = {}

# ---------- 0. Sitemap (internal, Uzbek) ----------
rows = [
    ('1', 'Bosh sahifa', '/tr', 'HomeFinal', '1', '3', 'Brend qidiruvi, ichki havolalar'),
    ('2', 'Qidiruv natijalari', '/tr/ara?q=…', 'SearchPage', '—', '—', 'noindex · asosiy UX'),
    ('3', 'Serial sahifasi', '/tr/dizi/arcane', 'TitleFinal', '120', '3 000', '"X nerede izlenir", "X türkçe dublaj"'),
    ('4', 'Film sahifasi', '/tr/film/vahsi-robot', 'Movie', '280', '9 000', 'Eng katta trafik manbai'),
    ('5', 'Sezon / qism', '/tr/dizi/arcane/sezon-2', 'Season', 'noindex', '12 000', '"X 2. sezon", "X 1. bölüm"'),
    ('6', 'Katalog (filtrlar)', '/tr/filmler, /tr/diziler, /tr/anime', 'Browse', '12', '150', 'Janr + servis kombinatsiyalari'),
    ('7', 'Til hubi', '/tr/turkce-dublaj', 'LangHub', '4', '40', 'Wedge: "türkçe dublaj film"'),
    ('8', "To'plam (ro'yxat)", '/tr/liste/en-iyi-dublajli-animasyonlar', 'Collection', '50', '900', '"en iyi …" long-tail'),
    ('9', 'Servis sahifasi', '/tr/netflix', 'Service', '8', '30', '"Netflix yeni", "Netflix vs Disney+"'),
    ('10', 'Yangi va ketayotganlar', '/tr/yeni-ve-kalkacak', 'NewLeaving', '9', '120', 'Haftalik qaytish sababi'),
    ('11', 'Treylerlar hubi', '/tr/fragmanlar', 'Trailers', '1', '3', '"fragman" qidiruvi'),
    ('12', 'Shaxs sahifasi', '/tr/kisi/jack-black', 'Person', 'noindex', '4 000', '"X filmleri nerede"'),
    ('13', 'sofo kids', '/tr/kids', 'Kids', '1', '15', 'Ota-onalar, multfilmlar'),
    ('14', "Mening ro'yxatim + xabarlar", '/my', 'MyList', '—', '—', 'Retention'),
    ('15', 'Onboarding (oyna)', '— (modal)', 'Onboarding', '—', '—', 'Retention, personalizatsiya'),
    ('16', 'Editionlar + bo\'sh natija + 404', '/editions', 'Editions', '1', '1', 'hreflang markazi'),
    ('17', 'Biz haqimizda / qanday ishlaydi / huquqiy', '/tr/hakkinda', 'About', '5', '15', 'Ishonch (E-E-A-T)'),
    ('18', 'Share kartalar (rasm/video)', '/og/arcane.png, /story/…', 'Share', '—', '—', 'Instagram, YouTube trafik'),
    ('19', 'Franshiza / ko\'rish tartibi', '/tr/seri/kung-fu-panda', 'Franchise', '20', '600', '"X izleme sırası", "X serisi nerede"'),
    ('20', 'Chiqish kuzatuvchisi', '/tr/yakinda-dijitalde', 'Releases', '1', '30', '"X ne zaman dijitalde"'),
    ('+', 'AI qidiruv (Ask sofo)', '/tr/sor?q=…', 'AISearch', '—', '—', 'noindex · retention, brend'),
]
tr = ''.join(
    f'<tr style="border-top: 1px solid #1E1E26"><td style="padding: 12px 10px; color: #6E6E7A; font-weight: 800">{a}</td>'
    f'<td style="padding: 12px 10px; font-weight: 800">{b}</td><td style="padding: 12px 10px; font-family: ui-monospace, monospace; font-size: 13px; color: #FFD5C7">{c}</td>'
    f'<td style="padding: 12px 10px; color: #A1A1AD">{d}</td><td style="padding: 12px 10px; text-align: right; font-weight: 800">{e}</td>'
    f'<td style="padding: 12px 10px; text-align: right; font-weight: 800; color: #FF5A1F">{f}</td><td style="padding: 12px 10px; color: #A1A1AD">{g}</td></tr>'
    for a, b, c, d, e, f, g in rows)
journey = ''.join(
    f'<div style="flex: 1 1 0; padding: 16px; border-radius: 16px; background: {bg}; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: {c}">{s}</span><span style="font-size: 16px; font-weight: 800">{t}</span><span style="font-size: 13px; color: #A1A1AD; line-height: 1.4">{d}</span></div>'
    for s, t, d, bg, c in [
        ('1 · KIRISH', 'Google', '"arcane türkçe dublaj nerede izlenir" → film/serial yoki ro\'yxat sahifasi', '#15151B', '#A1A1AD'),
        ('2 · JAVOB', 'Film sahifasi', 'Qaysi servis, qaysi til, qancha turadi — 3 soniyada', '#15151B', '#A1A1AD'),
        ('3 · CHIQISH', 'Watch on Netflix ↗', 'Outbound click — asosiy KPI', '#2A150D', '#FF5A1F'),
        ('4 · QAYTISH', "My list · Notify · Share", 'Yangi dublaj, ketayotganlar, Story kartasi', '#15151B', '#A1A1AD'),
    ])
sitemap = f'''<div style="padding: 48px; display: flex; flex-direction: column; gap: 28px">
<div style="display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px">
<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 14px; font-weight: 800; color: #FF5A1F; letter-spacing: 0.06em">SAYT XARITASI · v2 · 2026-11-03</span>
<span style="font-size: 44px; font-weight: 800; letter-spacing: -0.03em">20 xil sahifa — jami ~510 URL (MVP) → ~30 000 URL (12 oy)</span></div></div>
<div style="display: flex; gap: 14px">{journey}</div>
<table style="width: 100%; border-collapse: collapse; font-size: 14px">
<thead><tr style="color: #6E6E7A; font-size: 12px; text-align: left; letter-spacing: 0.04em"><th style="padding: 8px 10px">#</th><th style="padding: 8px 10px">SAHIFA</th><th style="padding: 8px 10px">URL (TR edition)</th><th style="padding: 8px 10px">CANVAS BOARD</th><th style="padding: 8px 10px; text-align: right">MVP · TR</th><th style="padding: 8px 10px; text-align: right">12 OY · TR+US+FR</th><th style="padding: 8px 10px">SEO / VAZIFA</th></tr></thead>
<tbody>{tr}
<tr style="border-top: 2px solid #3A3A45"><td></td><td style="padding: 14px 10px; font-weight: 800; font-size: 16px">Jami</td><td></td><td></td><td style="padding: 14px 10px; text-align: right; font-weight: 800; font-size: 16px">≈ 510</td><td style="padding: 14px 10px; text-align: right; font-weight: 800; font-size: 16px; color: #FF5A1F">≈ 30 000</td><td style="padding: 14px 10px; color: #A1A1AD">indekslanadigan URL</td></tr></tbody></table>
<div style="display: flex; gap: 14px; font-size: 14px; line-height: 1.5; color: #D4D4DC">
<div style="flex: 1; padding: 16px; border-radius: 14px; background: #15151B">Mobil versiya alohida sahifa emas — har bir shablon moslashuvchan. Canvas'da 3 ta asosiy mobil ekran: Bosh, Qidiruv, Film.</div>
<div style="flex: 1; padding: 16px; border-radius: 14px; background: #15151B">Sezon va shaxs sahifalari MVP'da noindex: sifat mezoni (tasdiqlangan availability + to'liq metadata) bajarilgach indeksga ochiladi.</div>
<div style="flex: 1; padding: 16px; border-radius: 14px; background: #15151B">Har edition o'z tilida URL oladi (/tr/film/…, /us/movie/…, /fr/film/…) + hreflang. Raqamlar — reja, NAMUNA.</div></div>
</div>'''
OUT['Sitemap'] = ('Sayt xaritasi v2', page('Sayt xaritasi v2', sitemap, chrome=False, lang='uz'), 1440)

# ---------- 5. Movie page ----------
cast = [('CS', 'Chris Sanders', 'Director, writer'), ('LN', "Lupita Nyong'o", 'Roz (voice)'), ('KC', 'Kit Connor', 'Brightbill (voice)'),
        ('PP', 'Pedro Pascal', 'Fink (voice)'), ('CO', "Catherine O'Hara", 'Pinktail (voice)'), ('BN', 'Bill Nighy', 'Longneck (voice)'), ('MH', 'Mark Hamill', 'Thorn (voice)')]
castH = ''.join(f'<a href="Person.dc.html" style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; width: 120px">{initials(i, 88)}<span style="font-size: 14px; font-weight: 800">{n}</span><span style="font-size: 12px; color: #A1A1AD; margin-top: -4px">{r}</span></a>' for i, n, r in cast)
Y_ = '<span style="color: #4ADE80; font-weight: 800">✓</span>'
N_ = '<span style="color: #4A4A55">—</span>'
mx = [('Türkçe dublaj', Y_, Y_, N_), ('Türkçe altyazı', Y_, Y_, Y_), ('English (original)', Y_, Y_, Y_), ('4K / HDR', Y_, Y_, N_), ('Audio description', N_, Y_, N_)]
mxH = ''.join(f'<tr style="border-top: 1px solid #1E1E26"><td style="padding: 10px 12px; font-weight: 700">{a}</td><td style="padding: 10px; text-align: center">{b}</td><td style="padding: 10px; text-align: center">{c}</td><td style="padding: 10px; text-align: center">{d}</td></tr>' for a, b, c, d in mx)
faq = [('Is The Wild Robot on Netflix in Türkiye?', 'No. In Türkiye it streams on Prime Video with a subscription, and you can rent or buy it on Apple TV and YouTube.'),
       ('Can I watch The Wild Robot with Turkish dub (türkçe dublaj)?', 'Yes — Prime Video and Apple TV have Turkish audio. YouTube offers Turkish subtitles only.'),
       ('Is The Wild Robot free anywhere?', 'Not right now. Turn on alerts and we will tell you when it lands on a free or ad-supported service.')]
faqH = ''.join(f'<details {"open" if i == 0 else ""} style="padding: 16px 18px; border-radius: 14px; background: #121217; border: 1px solid #1E1E26"><summary style="font-size: 16px; font-weight: 800; cursor: pointer">{q}</summary><p style="margin: 10px 0 0; font-size: 14px; line-height: 1.6; color: #D4D4DC">{a}</p></details>' for i, (q, a) in enumerate(faq))
movie = f'''
<nav style="font-size: 13px; color: #6E6E7A; font-weight: 600; margin-bottom: -20px">Home / Movies / Animation / <span style="color: #A1A1AD">The Wild Robot</span></nav>
<section style="position: relative; border-radius: 24px; overflow: hidden; background: #15151B">
<img src="{B(BD['robot'])}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 60% 30%">
<div style="position: absolute; inset: 0; background: linear-gradient(90deg, #0A0A0D 30%, rgba(10,10,13,0.55) 65%, rgba(10,10,13,0.2))"></div>
<div style="position: relative; padding: 32px; display: flex; gap: 28px; align-items: flex-end">
<img src="{B(P['robot'])}" alt="The Wild Robot poster" style="width: 220px; height: 330px; object-fit: cover; border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.5)">
<div style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 12px; max-width: 640px">
<span style="font-size: 14px; color: #D4D4DC; font-weight: 700">Vahşi Robot · Türkiye title</span>
<h1 style="margin: 0; font-size: 56px; line-height: 1; font-weight: 800; letter-spacing: -0.03em">The Wild Robot</h1>
<span style="font-size: 15px; color: #D4D4DC">Movie · 2024 · 1h 42m · Animation, Adventure, Family · 7+ · <span style="color: #FF5A1F; font-weight: 800">TMDB 8.3</span></span>
<span style="display: flex; flex-wrap: wrap; gap: 6px">{badge('türkçe dublaj', 'dub', 12)}{badge('türkçe altyazı', 'sub', 12)}{badge('4K', 'n', 12)}{badge('+ 24 audio languages', 'n', 12)}</span>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #E4E4EA">A service robot washes up on a wild island, learns to survive among the animals — and ends up raising an orphaned gosling.</p>
<div style="display: flex; flex-wrap: wrap; gap: 10px">{btn('▶ Trailer 2:24', 'ghost')}{btn('+ My list')}{btn('Alert me when it’s free')}{btn('Share to Story', 'sec', 44, 'Share.dc.html')}</div>
</div>
<div style="flex: 0 0 400px; display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: 20px; background: rgba(15,15,20,0.92); border: 1px solid #26262F">
<div style="display: flex; align-items: center; gap: 8px"><span style="font-size: 15px; font-weight: 800">Where to watch in Türkiye</span><span style="margin-left: auto; display: flex; gap: 4px">{chip('Stream', True, 30)}{chip('Rent', False, 30)}{chip('Buy', False, 30)}</span></div>
{offer('Prime', 'Subscription · TR audio ✓ · 4K', 'Watch on Prime ↗', True)}
{offer('Apple TV', 'Rent ₺89 · Buy ₺249 · TR audio ✓', 'Rent ↗')}
{offer('YouTube', 'Rent ₺79 · TR subtitles only', 'Rent ↗')}
<span style="font-size: 12px; color: #6E6E7A">Checked today 09:40 · prices are set by the service</span>
</div></div></section>

<section style="display: flex; gap: 28px; align-items: flex-start">
<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 14px">{h2('Audio &amp; subtitles by service', 'Only what the service confirms', '')}
<table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #121217; border-radius: 16px; overflow: hidden">
<thead><tr style="font-size: 13px; color: #A1A1AD"><th style="padding: 12px; text-align: left">Language</th><th style="padding: 12px">Prime Video</th><th style="padding: 12px">Apple TV</th><th style="padding: 12px">YouTube</th></tr></thead><tbody>{mxH}</tbody></table></div>
<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 14px">{h2('Trailers', '3 videos', 'All videos →')}
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
<a href="#" style="display: flex; flex-direction: column; gap: 6px"><span style="position: relative; display: block; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden"><img src="{B(BD['robot'])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; left: 8px; bottom: 8px">{badge('▶ Trailer 2:24', 'n', 12)}</span><span style="position: absolute; right: 8px; top: 8px">{badge('TR', 'dub')}</span></span><span style="font-size: 14px; font-weight: 800">Official trailer — Türkçe dublaj</span></a>
<a href="#" style="display: flex; flex-direction: column; gap: 6px"><span style="position: relative; display: block; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden"><img src="{B(BD['robot'])}" alt="" style="width: 100%; height: 100%; object-fit: cover; object-position: 10% 80%"><span style="position: absolute; left: 8px; bottom: 8px">{badge('▶ Trailer 2:31', 'n', 12)}</span><span style="position: absolute; right: 8px; top: 8px">{badge('EN', 'n')}</span></span><span style="font-size: 14px; font-weight: 800">Official trailer — English</span></a>
</div></div></section>

{section(h2('Cast &amp; crew', '', 'Full cast →') + f'<div style="display: flex; gap: 18px">{castH}</div>')}
{section(h2('If you liked The Wild Robot', 'Also with Turkish dub') + grid([poster(k) for k in ['io2', 'moana', 'elemental', 'luca', 'soul', 'panda']]))}
<section style="display: flex; gap: 28px; align-items: flex-start">
<div style="flex: 1.3 1 0; display: flex; flex-direction: column; gap: 10px">{h2('Questions people ask', '', '')}{faqH}</div>
<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 16px; background: #121217">
<span style="font-size: 15px; font-weight: 800">In other countries</span>
<span style="font-size: 14px; color: #D4D4DC; line-height: 1.9">United States — Peacock · Deutschland — Sky / WOW · France — Canal+ · España — SkyShowtime · México — Prime Video</span>
<span style="font-size: 12px; color: #6E6E7A">Travelling? Switch edition to see local services.</span></div></section>
'''
OUT['Movie'] = ('The Wild Robot — where to watch', page('The Wild Robot — where to watch in Türkiye', movie, active='Movies'), 1440)

# ---------- 6. Season / episode ----------
s2 = ['Heavy Is the Crown', 'Watch It All Burn', 'Finally Got the Name Right', 'Paint the Town Blue', 'Blisters and Bedrock',
      'The Message Hidden Within the Pattern', "Pretend Like It's the First Time", 'Killing Is a Cycle', 'The Dirt Under Your Nails']
acts = [('Act I · Nov 9, 2024', 0, 3), ('Act II · Nov 16, 2024', 3, 6), ('Act III · Nov 23, 2024', 6, 9)]
epH = ''
for an, a, b in acts:
    epH += f'<span style="font-size: 13px; font-weight: 800; color: #A1A1AD; letter-spacing: 0.04em; margin-top: 6px">{an.upper()}</span>'
    for i in range(a, b):
        sel = i == 0
        st = 'background: #1C1C24; border: 1px solid #FF5A1F' if sel else 'background: #121217; border: 1px solid #1E1E26'
        epH += (f'<a href="#" style="display: flex; gap: 14px; align-items: center; padding: 10px; border-radius: 14px; {st}">'
                f'<img src="{B(BD["arcane"])}" alt="" style="width: 150px; height: 84px; object-fit: cover; object-position: {(i*29)%100}% {(i*47)%100}%; border-radius: 10px">'
                f'<span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 700; color: #6E6E7A">E{i+1} · {39 + (i*3)%6}m</span>'
                f'<span style="font-size: 16px; font-weight: 800">{s2[i]}</span><span style="display: flex; gap: 6px">{badge("TR dub ✓", "dub")}{badge("TR sub ✓", "n")}</span></span></a>')
langs = ['Türkçe', 'English', 'Español (LatAm)', 'Español (España)', 'Deutsch', 'Français', 'Italiano', 'Português (BR)', 'Polski', 'Русский', 'Українська', '日本語', '한국어', 'العربية']
langH = ''.join(badge(l, 'dub' if l == 'Türkçe' else 'n', 12) for l in langs)
season = f'''
<nav style="font-size: 13px; color: #6E6E7A; font-weight: 600; margin-bottom: -20px">Home / Series / <a href="TitleFinal.dc.html" style="color: #A1A1AD">Arcane</a> / <span style="color: #A1A1AD">Season 2</span></nav>
<section style="display: flex; gap: 24px; align-items: center">
<img src="{B(P['arcane'])}" alt="Arcane" style="width: 120px; height: 180px; object-fit: cover; border-radius: 14px">
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px">
<h1 style="margin: 0; font-size: 44px; font-weight: 800; letter-spacing: -0.03em">Arcane — Season 2</h1>
<span style="font-size: 15px; color: #D4D4DC">2024 · 9 episodes in 3 acts · final season · <span style="color: #FF5A1F; font-weight: 800">TMDB 8.4</span></span>
<div style="display: flex; gap: 8px">{chip('Season 1')}{chip('Season 2', True)}</div></div>
<div style="flex: 0 0 380px">{offer('Netflix', 'Whole season · TR audio ✓ · TR subtitles ✓ · 4K', 'Watch S2 on Netflix ↗', True)}</div>
</section>
<section style="display: flex; gap: 28px; align-items: flex-start">
<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 10px">{epH}</div>
<aside style="flex: 0 0 560px; display: flex; flex-direction: column; gap: 16px; padding: 18px; border-radius: 22px; background: #15151B; border: 1px solid #26262F">
<span style="position: relative; display: block; aspect-ratio: 16/9; border-radius: 14px; overflow: hidden"><img src="{B(BD['arcane'])}" alt="" style="width: 100%; height: 100%; object-fit: cover; object-position: 0% 0%"><span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center"><span style="width: 60px; height: 60px; border-radius: 99px; background: #FFFFFF; display: flex; align-items: center; justify-content: center"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" fill="#0A0A0D"></path></svg></span></span><span style="position: absolute; left: 10px; bottom: 10px">{badge('Episode preview 1:02 · TR', 'n', 12)}</span></span>
<span style="font-size: 13px; font-weight: 700; color: #6E6E7A">S2.E1 · Nov 9, 2024 · 40m</span>
<span style="font-size: 26px; font-weight: 800; letter-spacing: -0.02em">Heavy Is the Crown</span>
<p style="margin: 0; font-size: 15px; line-height: 1.55; color: #D4D4DC">After the attack on the Council, Piltover and Zaun stand on the edge of war — and Vi has to choose a side.</p>
<span style="font-size: 14px; font-weight: 800">Audio in this episode <span style="color: #6E6E7A; font-weight: 600">· 14 languages</span></span>
<span style="display: flex; flex-wrap: wrap; gap: 6px">{langH}</span>
<span style="font-size: 14px; font-weight: 800">Subtitles <span style="color: #6E6E7A; font-weight: 600">· 32 languages incl. Türkçe</span></span>
{btn('Watch S2.E1 on Netflix ↗', 'pri', 48)}
<div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #A1A1AD"><span>← S1.E9 The Monster You Created</span><span>S2.E2 Watch It All Burn →</span></div>
</aside></section>
<section style="display: flex; align-items: center; gap: 16px; padding: 18px 22px; border-radius: 18px; background: #121217; border: 1px solid #1E1E26">
<span style="font-size: 15px; line-height: 1.5; flex: 1">Arcane ended with Season 2. Want to know about new series from the same studio?</span>{btn('Notify me', 'sec')}</section>
'''
OUT['Season'] = ('Arcane Season 2 — episodes', page('Arcane Season 2 — episodes, audio languages', season, active='Series'), 1440)

# ---------- 7. Browse / catalog ----------
def cb(t, on=False, right='', icon=''):
    box = '<span style="width: 18px; height: 18px; border-radius: 5px; background: #FF5A1F; display: inline-flex; align-items: center; justify-content: center; color: #0A0A0D; font-size: 12px; font-weight: 800">✓</span>' if on else '<span style="width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #3A3A45"></span>'
    return f'<label style="display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: {"#FFFFFF" if on else "#D4D4DC"}">{box}{icon}<span style="flex: 1">{t}</span><span style="font-size: 12px; color: #6E6E7A">{right}</span></label>'
def fgroup(t, inner):
    return f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 0; border-top: 1px solid #1E1E26"><span style="font-size: 13px; font-weight: 800; letter-spacing: 0.04em; color: #A1A1AD">{t}</span>{inner}</div>'
side = (fgroup('AUDIO', cb('Türkçe dublaj', True, '1 912') + cb('Türkçe altyazı', False, '2 184') + cb('Original language only', False, '640')) +
        fgroup('SERVICES', ''.join(cb(SVN.get(s, s), False, n, svc(s, 22, 5)) for s, n in [('Netflix', '612'), ('Disney', '388'), ('Prime', '540'), ('HBO Max', '210'), ('tabii', '96'), ('Exxen', '44'), ('TOD', '58'), ('Gain', '31')])) +
        fgroup('PRICE', cb('Subscription', True) + cb('Free with ads') + cb('Rent') + cb('Buy')) +
        fgroup('GENRE', '<div style="display: flex; flex-wrap: wrap; gap: 6px">' + ''.join(chip(g, g == 'Animation', 32) for g in ['Animation', 'Family', 'Adventure', 'Comedy', 'Fantasy', 'Sci-Fi', 'Drama', 'Music']) + '</div>') +
        fgroup('YEAR', '<div style="height: 4px; border-radius: 9px; background: linear-gradient(90deg, #26262F 10%, #FF5A1F 10% 100%); margin: 8px 0"></div><div style="display: flex; justify-content: space-between; font-size: 12px; color: #A1A1AD"><span>1995</span><span>2026</span></div>') +
        fgroup('MORE', cb('4K / HDR') + cb('Hide titles in My list') + cb('Leaving soon only')))
movies = ['robot', 'io2', 'moana', 'panda', 'spider', 'mario', 'elemental', 'encanto', 'soul', 'luca', 'coco', 'spirited']
browse = f'''
<section style="display: flex; flex-direction: column; gap: 14px">
<h1 style="margin: 0; font-size: 40px; font-weight: 800; letter-spacing: -0.03em">Animated movies with Turkish dub</h1>
<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px"><span style="font-size: 15px; color: #A1A1AD; margin-right: 6px">1 912 movies on 8 services in Türkiye</span>
{chip('Türkçe dublaj ×', True, 32)}{chip('Animation ×', True, 32)}{chip('Subscription ×', True, 32)}<a href="#" style="font-size: 13px; color: #A1A1AD; font-weight: 700; margin-left: 6px">Clear all</a>
<span style="margin-left: auto; display: flex; gap: 8px">{chip('Sort: Popular ▾')}{chip('▦ Grid', True)}{chip('☰ List')}</span></div>
</section>
<section style="display: flex; gap: 32px; align-items: flex-start">
<aside style="flex: 0 0 260px; display: flex; flex-direction: column">{side}</aside>
<div style="flex: 1; display: flex; flex-direction: column; gap: 24px">{grid([poster(k) for k in movies], 4, 18)}
<div style="display: flex; justify-content: center; gap: 8px">{chip('← Prev')}{chip('1', True)}{chip('2')}{chip('3')}{chip('…')}{chip('84')}{chip('Next →')}</div>
<p style="margin: 0; font-size: 14px; line-height: 1.7; color: #A1A1AD">Every animated movie you can watch with Turkish audio on a subscription in Türkiye, updated daily. Tick your services to see only what you can watch tonight. Change the filters to see subtitles, rentals or free titles.</p></div>
</section>'''
OUT['Browse'] = ('Movies — catalog with filters', page('Animated movies with Turkish dub — catalog', browse, active='Movies'), 1440)

# ---------- 8. Language hub ----------
counts = [('Netflix', '1 240'), ('Disney', '640'), ('Prime', '520'), ('HBO Max', '310'), ('tabii', '260'), ('TOD', '180'), ('Exxen', '90'), ('Gain', '70')]
cH = ''.join(f'<a href="#" style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 16px; background: #15151B; border: 1px solid #26262F">{svc(s, 40, 10)}<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; font-weight: 800">{SVN.get(s, s)}</span><span style="font-size: 13px; color: #A1A1AD">{n} titles</span></span></a>' for s, n in counts)
lists = [('Best animated movies', '20 titles', 'spirited'), ('Anime with Turkish dub', '48 titles', 'demon'), ('Family night', '30 titles', 'encanto'), ('New dubs this month', '26 titles', 'spider')]
lH = ''.join(f'<a href="Collection.dc.html" style="position: relative; height: 160px; border-radius: 18px; overflow: hidden; display: block"><img src="{B(BD[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(10,10,13,0.92), rgba(10,10,13,0.1))"></span><span style="position: absolute; left: 16px; bottom: 14px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 18px; font-weight: 800">{t}</span><span style="font-size: 13px; color: #D4D4DC">{m}</span></span></a>' for t, m, k in lists)
hubfaq = ''.join(f'<details style="padding: 16px 18px; border-radius: 14px; background: #121217; border: 1px solid #1E1E26" {o}><summary style="font-size: 16px; font-weight: 800; cursor: pointer">{q}</summary><p style="margin: 10px 0 0; font-size: 14px; line-height: 1.6; color: #D4D4DC">{a}</p></details>' for q, a, o in [
    ('Dublaj or altyazı — what’s the difference?', 'Dublaj means the voices are in Turkish. Altyazı means original voices with Turkish text on screen. We show both separately for every service.', 'open'),
    ('How do you know a title has Turkish audio?', 'We read the audio and subtitle lists the services publish for Türkiye and check them every day. If a service doesn’t confirm it, we don’t show it.', ''),
    ('Why is a dub on Netflix but not on Prime?', 'Each service licenses its own audio tracks. The same movie can have Turkish audio on one service and only subtitles on another.', '')])
hub = f'''
<section style="position: relative; border-radius: 24px; overflow: hidden; padding: 40px; background: radial-gradient(120% 140% at 100% 0%, #10314F 0%, #0F1A2E 40%, #0A0A0D 80%)">
<div style="display: flex; flex-direction: column; gap: 14px; max-width: 760px">
<span style="display: flex; gap: 8px">{chip('Türkçe dublaj', True, 34)}{chip('Türkçe altyazı', False, 34)}{chip('Original language', False, 34)}</span>
<h1 style="margin: 0; font-size: 54px; line-height: 1.02; font-weight: 800; letter-spacing: -0.03em">Watch in Turkish.<br>3 412 movies &amp; series with Turkish audio.</h1>
<span style="font-size: 16px; color: #C9D6EA">On 8 services in Türkiye · checked every day · updated 2 hours ago</span>
<form role="search" style="display: flex; align-items: center; height: 56px; padding: 0 8px 0 16px; gap: 10px; border-radius: 16px; background: #0A0A0D; border: 1px solid #3B82F6; max-width: 620px">{SEARCH_ICON}<input type="search" aria-label="Search dubbed titles" placeholder="Search only titles with Turkish dub…" style="flex: 1; height: 50px; border: 0; background: transparent; color: #FFFFFF; font-family: inherit; font-size: 16px"></form>
</div>
<div style="position: absolute; right: 40px; top: 34px; display: flex; gap: 12px; transform: rotate(-4deg)">{"".join(f'<img src="{B(P[k])}" alt="" style="width: 120px; height: 180px; object-fit: cover; border-radius: 12px; margin-top: {m}px; box-shadow: 0 20px 40px rgba(0,0,0,0.5)">' for k, m in [('moana', 30), ('arcane', 0), ('demon', 40)])}</div>
</section>
{section(h2('By service', '', '') + f'<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px">{cH}</div>')}
{section(h2('Newly dubbed into Turkish', 'Last 30 days') + grid([poster(k, None, (('NEW DUB', 'new'),)) for k in ['spider', 'moana', 'robot', 'io2', 'panda', 'mario']]))}
{section(h2('Anime — Turkish dub', '') + grid([poster(k) for k in ['demon', 'jjk', 'aot', 'onepiece', 'spirited', 'arcane']]))}
{section(h2('Lists with Turkish dub', '') + f'<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px">{lH}</div>')}
<section style="display: flex; gap: 28px; align-items: flex-start"><div style="flex: 1.3; display: flex; flex-direction: column; gap: 10px">{h2('About Turkish dub on streaming', '', '')}{hubfaq}</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 16px; background: #121217"><span style="font-size: 15px; font-weight: 800">Other languages in Türkiye</span><div style="display: flex; flex-wrap: wrap; gap: 8px">{"".join(chip(x, False, 34) for x in ['English audio', 'Español', 'Deutsch', 'Русский', 'العربية', 'Français', 'Kurdî', 'Azərbaycan'])}</div></div></section>
'''
OUT['LangHub'] = ('Türkçe dublaj — language hub', page('Türkçe dublaj — movies and series with Turkish audio', hub, active=''), 1440)

# ---------- 9. Collection ----------
items = [('spirited', 'Spirited Away', '2001 · 2h 5m', '8.5', 'A girl stuck in a spirit world takes a job in a bathhouse to free her parents. The Ghibli film to start with.', 'HBO Max', 'Subscription'),
         ('coco', 'Coco', '2017 · 1h 45m', '8.2', 'A boy who dreams of music crosses into the Land of the Dead to learn his family’s story. Bring tissues.', 'Disney', 'Subscription'),
         ('spider', 'Spider-Man: Across the Spider-Verse', '2023 · 2h 20m', '8.4', 'Miles Morales jumps between universes — the most inventive animation of the decade.', 'Netflix', 'Subscription'),
         ('robot', 'The Wild Robot', '2024 · 1h 42m', '8.3', 'A robot stranded on an island raises an orphaned gosling. Gentle, funny and huge-hearted.', 'Prime', 'Subscription'),
         ('io2', 'Inside Out 2', '2024 · 1h 36m', '7.6', 'Riley turns 13 and a new emotion — Anxiety — takes over headquarters.', 'Disney', 'Subscription'),
         ('soul', 'Soul', '2020 · 1h 41m', '8.0', 'A music teacher gets a second chance to find out what makes life worth living.', 'Disney', 'Subscription')]
iH = ''.join(f'''<article style="display: flex; gap: 20px; align-items: center; padding: 16px; border-radius: 20px; background: #121217; border: 1px solid #1E1E26">
<span style="flex: 0 0 56px; font-size: 48px; font-weight: 800; color: #3A3A45; text-align: center">{n+1}</span>
<img src="{B(P[k])}" alt="{t}" style="width: 104px; height: 156px; object-fit: cover; border-radius: 12px">
<div style="flex: 1; display: flex; flex-direction: column; gap: 8px"><a href="Movie.dc.html" style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em">{t}</a>
<span style="font-size: 13px; color: #A1A1AD">{m} · <span style="color: #FF5A1F; font-weight: 800">TMDB {r}</span></span>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: #D4D4DC; max-width: 640px">{d}</p>
<span style="display: flex; gap: 6px">{badge('türkçe dublaj', 'dub')}{badge('türkçe altyazı', 'sub')}</span></div>
<div style="flex: 0 0 240px; display: flex; flex-direction: column; gap: 8px; align-items: stretch"><span style="display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 800">{svc(s, 30, 7)}{SVN.get(s, s)}<span style="font-size: 12px; color: #A1A1AD; font-weight: 600">{p}</span></span>{btn('Watch on ' + SVN.get(s, s) + ' ↗', 'pri' if n == 0 else 'sec', 40)}</div>
</article>''' for n, (k, t, m, r, d, s, p) in enumerate(items))
coll = f'''
<nav style="font-size: 13px; color: #6E6E7A; font-weight: 600; margin-bottom: -20px">Home / Lists / <span style="color: #A1A1AD">Türkçe dublaj</span></nav>
<section style="display: flex; gap: 32px; align-items: flex-start">
<div style="flex: 1; display: flex; flex-direction: column; gap: 16px">
<h1 style="margin: 0; font-size: 46px; line-height: 1.05; font-weight: 800; letter-spacing: -0.03em">The 20 best animated movies with Turkish dub</h1>
<div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: #A1A1AD">{initials('KE', 32)}<span><b style="color: #FFFFFF">sofo editors</b> · updated Nov 3, 2026 · every title checked today</span></div>
<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #D4D4DC; max-width: 760px">Movies the whole family can watch in Turkish tonight. We only list titles where a service in Türkiye confirms Turkish audio — and show where each one streams right now.</p>
<div style="display: flex; gap: 8px">{chip('All 20', True)}{chip('On my services · 14')}{chip('Free · 3')}{chip('Under 100 min · 9')}</div>
{iH}
<button type="button" style="height: 52px; border-radius: 14px; border: 1px solid #26262F; background: #15151B; color: #FFFFFF; font-family: inherit; font-size: 15px; font-weight: 800">Show 14 more</button>
</div>
<aside style="flex: 0 0 320px; display: flex; flex-direction: column; gap: 14px">
<div style="padding: 18px; border-radius: 18px; background: #15151B; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 15px; font-weight: 800">This list in numbers</span>
<span style="font-size: 14px; color: #D4D4DC; line-height: 1.9">20 movies · 6 services<br>Disney+ 8 · Netflix 5 · Prime 3 · HBO Max 2 · tabii 2</span>
{btn('+ Save list', 'sec', 42)}{btn('Share to Story', 'sec', 42, 'Share.dc.html')}</div>
<div style="padding: 18px; border-radius: 18px; background: #15151B; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 15px; font-weight: 800">Related lists</span>
{"".join(f'<a href="#" style="font-size: 14px; font-weight: 700; color: #D4D4DC">{x} →</a>' for x in ['Anime with Turkish dub', 'Pixar movies in Turkish', 'Ghibli: where to watch', 'Leaving Disney+ this month'])}</div>
</aside></section>'''
OUT['Collection'] = ('List — best animated movies (TR dub)', page('The 20 best animated movies with Turkish dub', coll, active=''), 1440)

# ---------- 10. Service page ----------
leaving = [('mario', 'Nov 30'), ('panda', 'Dec 1'), ('rick', 'Dec 4'), ('aot', 'Dec 9'), ('spirited', 'Dec 12'), ('robot', 'Dec 15')]
cmp = [('Titles with Turkish dub', '1 240', '640', '520'), ('Cheapest plan', '₺149.99', '₺134.99', '₺69.90'), ('Ad-supported plan', '—', '—', '—'), ('4K', 'Premium', '✓', '✓'), ('Free trial', '—', '—', '30 days')]
cmpH = ''.join(f'<tr style="border-top: 1px solid #1E1E26"><td style="padding: 12px; font-weight: 700">{a}</td><td style="padding: 12px; text-align: center; font-weight: 800; color: #FF5A1F">{b}</td><td style="padding: 12px; text-align: center">{c}</td><td style="padding: 12px; text-align: center">{d}</td></tr>' for a, b, c, d in cmp)
service = f'''
<section style="display: flex; align-items: center; gap: 24px; padding: 28px; border-radius: 24px; background: linear-gradient(90deg, #2A0A0C, #15151B 60%)">
{svc('Netflix', 96, 22)}
<div style="flex: 1; display: flex; flex-direction: column; gap: 8px"><h1 style="margin: 0; font-size: 44px; font-weight: 800; letter-spacing: -0.03em">Netflix in Türkiye</h1>
<span style="font-size: 15px; color: #D4D4DC">6 840 titles · 1 240 with Turkish dub · 2 310 with Turkish subtitles · from ₺149.99 / month</span>
<span style="display: flex; gap: 8px">{chip('All', True, 34)}{chip('Türkçe dublaj only', False, 34)}{chip('Movies', False, 34)}{chip('Series', False, 34)}{chip('Anime', False, 34)}</span></div>
<div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end">{btn('Go to Netflix ↗', 'pri')}<span style="font-size: 12px; color: #A1A1AD">I have Netflix ✓ (personalises sofo)</span></div>
</section>
{section(h2('New on Netflix this week', 'Nov 2 – Nov 8') + grid([poster(k, Y[k], (('NEW', 'new'), ('TR dub', 'dub')), False) for k in ['spider', 'io2', 'moana', 'arcane', 'jjk', 'demon']]))}
{section(h2('Top 10 in Türkiye today', 'Movies &amp; series') + f'<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 22px 28px; padding-left: 24px">{"".join(poster(k, None, (), False, None, i+1) for i, k in enumerate(["arcane", "spider", "demon", "panda", "onepiece"]))}</div>')}
<section style="display: flex; flex-direction: column; gap: 16px; padding: 22px; border-radius: 22px; background: #1A1408; border: 1px solid #3A2A0A">{h2('Leaving soon', 'From Netflix in Türkiye — watch before it goes', 'All leaving →')}
{grid([poster(k, 'Leaves Netflix ' + d, (('LEAVING ' + d.upper(), 'leave'),), False) for k, d in leaving])}</section>
<section style="display: flex; gap: 28px; align-items: flex-start"><div style="flex: 1.2; display: flex; flex-direction: column; gap: 14px">{h2('Netflix vs Disney+ vs Prime Video in Türkiye', '', '')}
<table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #121217; border-radius: 16px; overflow: hidden"><thead><tr style="font-size: 13px; color: #A1A1AD"><th style="padding: 12px; text-align: left"></th><th style="padding: 12px">Netflix</th><th style="padding: 12px">Disney+</th><th style="padding: 12px">Prime Video</th></tr></thead><tbody>{cmpH}</tbody></table>
<span style="font-size: 12px; color: #6E6E7A">Prices shown are examples — checked prices go here at launch.</span></div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 18px; background: #121217"><span style="font-size: 15px; font-weight: 800">Other services in Türkiye</span>
{"".join(f'<a href="#" style="display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700">{svc(s, 30, 7)}{SVN.get(s, s)}<span style="margin-left: auto; color: #6E6E7A">→</span></a>' for s in ['Disney', 'Prime', 'HBO Max', 'tabii', 'TOD', 'Exxen', 'Gain'])}</div></section>'''
OUT['Service'] = ('Service — Netflix Türkiye', page('Netflix in Türkiye — new, top 10, leaving soon', service, active=''), 1440)
