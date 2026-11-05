from lib import *

OUT = {}

# ---------- 11. New & leaving ----------
days = [('Mon', '2', [('spider', 'Netflix', 'NEW DUB', 'new'), ('rick', 'HBO Max', 'NEW SEASON', 'new')]),
        ('Tue', '3', [('moana', 'Disney', 'NEW', 'new')]),
        ('Wed', '4', [('demon', 'Netflix', 'NEW DUB', 'new'), ('coco', 'Disney', 'LEAVING', 'leave')]),
        ('Thu', '5', [('robot', 'Prime', 'NEW', 'new')]),
        ('Fri', '6', [('jjk', 'Netflix', 'NEW EPISODES', 'new'), ('aot', 'Prime', 'NEW DUB', 'new'), ('mario', 'Netflix', 'LEAVING', 'leave')]),
        ('Sat', '7', [('spirited', 'HBO Max', 'NEW', 'new')]),
        ('Sun', '8', [('encanto', 'Disney', 'LEAVING', 'leave')])]
dH = ''
for d, n, its in days:
    today = n == '3'
    cards = ''.join(f'<a href="#" style="display: flex; gap: 10px; padding: 8px; border-radius: 12px; background: #15151B; border: 1px solid {"#3A2A0A" if k2 == "leave" else "#22222A"}"><img src="{B(P[k])}" alt="" style="width: 54px; height: 81px; object-fit: cover; border-radius: 8px"><span style="display: flex; flex-direction: column; gap: 5px; min-width: 0">{badge(lab, k2, 10)}<span style="font-size: 13px; font-weight: 800; line-height: 1.25">{T[k]}</span><span style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #A1A1AD">{svc(s, 16, 4)}{SVN.get(s, s)}</span></span></a>' for k, s, lab, k2 in its)
    dH += f'<div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; align-items: baseline; gap: 6px; padding: 10px 12px; border-radius: 12px; background: {"#FF5A1F" if today else "#121217"}; color: {"#0A0A0D" if today else "#FFFFFF"}"><span style="font-size: 13px; font-weight: 800">{d}</span><span style="font-size: 22px; font-weight: 800">{n}</span><span style="margin-left: auto; font-size: 11px; font-weight: 800">{"TODAY" if today else ""}</span></div>{cards}</div>'
lv = [('coco', 'Disney', 'Wed, Nov 4', '1 day'), ('mario', 'Netflix', 'Fri, Nov 6', '3 days'), ('encanto', 'Disney', 'Sun, Nov 8', '5 days'), ('panda', 'Netflix', 'Mon, Nov 30', '27 days')]
lvH = ''.join(f'<div style="display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-radius: 14px; background: #121217"><img src="{B(P[k])}" alt="" style="width: 40px; height: 60px; object-fit: cover; border-radius: 6px"><span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 800">{T[k]}</span><span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #A1A1AD">{svc(s, 16, 4)}{SVN.get(s, s)} · leaves {d}</span></span>{badge(left + " left", "leave", 12)}{btn("Remind me", "sec", 36)}</div>' for k, s, d, left in lv)
nl = f'''
<section style="display: flex; flex-direction: column; gap: 14px">
<h1 style="margin: 0; font-size: 44px; font-weight: 800; letter-spacing: -0.03em">New &amp; leaving in Türkiye</h1>
<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px">{chip('This week · Nov 2–8', True)}{chip('Next week')}{chip('November')}<span style="width: 1px; height: 24px; background: #26262F; margin: 0 6px"></span>{chip('All services', True)}{"".join(f'<span style="display: inline-flex">{svc(s, 36, 10)}</span>' for s in ['Netflix', 'Disney', 'Prime', 'HBO Max', 'tabii', 'Exxen'])}<span style="margin-left: auto">{chip('Only Turkish dub')}</span></div>
</section>
<section style="display: flex; gap: 12px; align-items: flex-start">{dH}</section>
<section style="display: flex; gap: 28px; align-items: flex-start">
<div style="flex: 1.3; display: flex; flex-direction: column; gap: 12px">{h2('Leaving soon', 'Sorted by date', 'All 38 →')}{lvH}</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 22px; border-radius: 20px; background: #2A150D"><span style="font-size: 20px; font-weight: 800">Get this every Friday</span><span style="font-size: 14px; line-height: 1.5; color: #FFD5C7">New Turkish dubs and what’s leaving your services — one short email or Telegram message.</span>
<div style="display: flex; gap: 8px"><input type="email" aria-label="Email" placeholder="you@email.com" style="flex: 1; height: 46px; border-radius: 12px; border: 1px solid #5A2A17; background: #0A0A0D; color: #FFFFFF; padding: 0 14px; font-family: inherit; font-size: 14px">{btn('Subscribe', 'pri', 46)}</div>
<a href="#" style="font-size: 13px; font-weight: 700; color: #FF5A1F">Or follow on Telegram →</a></div></section>'''
OUT['NewLeaving'] = ('New & leaving — weekly calendar', page('New and leaving in Türkiye — this week', nl, active='New &amp; leaving'), 1440)

# ---------- 12. Trailers hub ----------
vids = [('spider', 'Spider-Verse — Official trailer', 'Trailer 2:35', 'TR'), ('panda', 'Kung Fu Panda 4 — Trailer 2', 'Trailer 2:28', 'TR'),
        ('io2', 'Inside Out 2 — Official trailer', 'Trailer 2:18', 'EN'), ('demon', 'Demon Slayer — Hashira Training', 'Trailer 1:32', 'JP'),
        ('encanto', 'Encanto — Sing-along clip', 'Clip 1:05', 'TR'), ('coco', 'Coco — Remember Me (clip)', 'Clip 2:01', 'EN'),
        ('spirited', 'Spirited Away — 4K re-release', 'Trailer 1:48', 'JP'), ('robot', 'The Wild Robot — Final trailer', 'Trailer 2:24', 'TR')]
vH = ''.join(f'<a href="#" style="display: flex; flex-direction: column; gap: 8px"><span style="position: relative; display: block; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden"><img src="{B(BD[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; left: 8px; bottom: 8px">{badge("▶ " + d, "n", 12)}</span><span style="position: absolute; right: 8px; top: 8px">{badge(l, "dub" if l == "TR" else "n")}</span></span><span style="font-size: 14px; font-weight: 800">{t}</span><span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #A1A1AD; margin-top: -4px">{svc(SV[k], 16, 4)}{SVN.get(SV[k], SV[k])} · Watch the full movie ↗</span></a>' for k, t, d, l in vids)
sh = ''.join(f'<a href="#" style="flex: 0 0 170px; position: relative; height: 302px; border-radius: 16px; overflow: hidden"><img src="{B(BD[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover; object-position: {p}"><span style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(10,10,13,0.9), transparent 55%)"></span><span style="position: absolute; left: 10px; right: 10px; bottom: 10px; font-size: 13px; font-weight: 800">{t}</span></a>' for k, t, p in [('arcane', 'Jinx in 30 seconds', '30% 40%'), ('spider', 'Gwen’s world, frame by frame', '60% 50%'), ('panda', 'Po’s best kick', '40% 40%'), ('io2', 'Meet Anxiety', '50% 40%'), ('demon', 'Water breathing', '30% 50%'), ('coco', 'Un poco loco', '60% 40%'), ('encanto', 'Bruno, explained', '50% 50%')])
tr_ = f'''
<section style="display: flex; flex-direction: column; gap: 14px"><h1 style="margin: 0; font-size: 44px; font-weight: 800; letter-spacing: -0.03em">Trailers</h1>
<div style="display: flex; gap: 8px">{chip('Trending', True)}{chip('New this week')}{chip('Coming soon')}{chip('Türkçe dublaj fragmanlar')}{chip('Anime')}</div></section>
<section style="display: flex; gap: 16px">
<div style="flex: 1 1 0; position: relative; aspect-ratio: 16/9; border-radius: 20px; overflow: hidden"><img src="{B(BD['spider'])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(10,10,13,0.92), transparent 55%)"></span>
<div style="position: absolute; left: 24px; right: 24px; bottom: 22px; display: flex; align-items: flex-end; gap: 16px"><span style="width: 64px; height: 64px; border-radius: 99px; background: #FFFFFF; display: flex; align-items: center; justify-content: center"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" fill="#0A0A0D"></path></svg></span>
<span style="flex: 1; display: flex; flex-direction: column; gap: 6px"><span style="display: flex; gap: 6px">{badge('TÜRKÇE DUBLAJ', 'dub')}{badge('OFFICIAL · SONY PICTURES', 'n')}</span><span style="font-size: 26px; font-weight: 800">Spider-Man: Across the Spider-Verse — Official trailer</span><span style="font-size: 14px; color: #D4D4DC">2:35 · Plays on YouTube · full movie on Netflix</span></span>{btn('Where to watch →', 'pri')}</div></div>
<aside style="flex: 0 0 340px; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 15px; font-weight: 800">Up next</span>
{"".join(f'<a href="#" style="display: flex; gap: 12px; align-items: center; padding: 8px; border-radius: 14px; background: #121217"><img src="{B(BD[k])}" alt="" style="width: 120px; height: 68px; object-fit: cover; border-radius: 10px"><span style="display: flex; flex-direction: column; gap: 3px"><span style="font-size: 14px; font-weight: 800">{t}</span><span style="font-size: 12px; color: #A1A1AD">{d}</span></span></a>' for k, t, d in [('panda', 'Kung Fu Panda 4', 'Trailer 2 · TR · 2:28'), ('io2', 'Inside Out 2', 'Trailer · EN · 2:18'), ('robot', 'The Wild Robot', 'Final trailer · TR · 2:24'), ('demon', 'Demon Slayer', 'Teaser · JP · 1:32')])}</aside></section>
{section(h2('Trending trailers', 'Official videos only') + f'<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px 16px">{vH}</div>')}
{section(h2('Shorts', 'Vertical clips from studio channels') + f'<div style="display: flex; gap: 14px">{sh}</div>')}'''
OUT['Trailers'] = ('Trailers hub', page('Trailers — official, in your language', tr_, active='Trailers'), 1440)

# ---------- 13. Person ----------
films = [('2024', 'panda', 'Kung Fu Panda 4', 'Po (voice)', 'Netflix', 'TR dub ✓'), ('2023', 'mario', 'The Super Mario Bros. Movie', 'Bowser (voice)', 'Netflix', 'TR dub ✓'),
         ('2016', None, 'Kung Fu Panda 3', 'Po (voice)', 'Prime', 'TR dub ✓'), ('2011', None, 'Kung Fu Panda 2', 'Po (voice)', 'Prime', 'TR sub'),
         ('2008', None, 'Kung Fu Panda', 'Po (voice)', 'Apple TV', 'Rent · TR dub ✓'), ('2003', None, 'School of Rock', 'Dewey Finn', 'Apple TV', 'Rent · TR sub')]
fH = ''.join(f'<div style="display: flex; align-items: center; gap: 16px; padding: 12px 14px; border-radius: 14px; background: #121217"><span style="width: 48px; font-size: 14px; font-weight: 800; color: #6E6E7A">{y}</span>' +
             (f'<img src="{B(P[k])}" alt="" style="width: 40px; height: 60px; object-fit: cover; border-radius: 6px">' if k else '<span style="width: 40px; height: 60px; border-radius: 6px; background: #1C1C24"></span>') +
             f'<span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><a href="Movie.dc.html" style="font-size: 15px; font-weight: 800">{t}</a><span style="font-size: 13px; color: #A1A1AD">{r}</span></span><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700">{svc(s, 24, 6)}{SVN.get(s, s)}</span>{badge(b, "dub" if "dub" in b else "n")}<a href="#" style="font-size: 13px; font-weight: 800; color: #FF5A1F; width: 70px; text-align: right">Watch ↗</a></div>'
             for y, k, t, r, s, b in films)
person = f'''
<section style="display: flex; gap: 28px; align-items: center">{initials('JB', 160)}
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; font-size: 52px; font-weight: 800; letter-spacing: -0.03em">Jack Black</h1>
<span style="font-size: 15px; color: #D4D4DC">Actor · Voice actor · Musician · Born Aug 28, 1969, Santa Monica, California</span>
<span style="display: flex; gap: 8px">{badge('94 titles', 'n', 12)}{badge('38 on your services', 'ok', 12)}{badge('21 with Turkish dub', 'dub', 12)}</span>
<div style="display: flex; gap: 10px">{btn('+ Follow — get new releases', 'sec')}{btn('Share', 'ghost')}</div></div></section>
{section(h2('Known for', '', '') + grid([poster(k, r, (('türkçe dublaj', 'dub'),)) for k, r in [('panda', 'Po · 2024'), ('mario', 'Bowser · 2023')]] + ['<span></span>'] * 4))}
<section style="display: flex; flex-direction: column; gap: 12px">{h2('Filmography — where to watch', '94 titles', '')}
<div style="display: flex; gap: 8px">{chip('All', True)}{chip('Voice')}{chip('Acting')}{chip('Music')}<span style="margin-left: auto">{chip('Only Turkish dub')}</span>{chip('Only my services')}</div>{fH}</section>'''
OUT['Person'] = ('Person — Jack Black', page('Jack Black — movies and where to watch', person, active=''), 1440)

# ---------- 14. Kids ----------
ages = [('0–3', 'First cartoons', '#FDE68A'), ('4–6', 'Preschool', '#F9A8D4'), ('7–9', 'Big adventures', '#7DD3FC'), ('10–12', 'Pre-teen', '#86EFAC')]
aH = ''.join(f'<a href="#" style="padding: 22px; border-radius: 24px; background: {c}; color: #0A0A0D; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 40px; font-weight: 800; letter-spacing: -0.03em; color: #0A0A0D">{a}</span><span style="font-size: 15px; font-weight: 800; color: #0A0A0D">{t}</span><span style="font-size: 13px; color: #3A3A45">years</span></a>' for a, t, c in ages)
tog = lambda t, on: f'<div style="display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700"><span style="width: 42px; height: 24px; border-radius: 99px; background: {"#FF5A1F" if on else "#3A3A45"}; position: relative; flex: 0 0 42px"><span style="position: absolute; top: 3px; {"right" if on else "left"}: 3px; width: 18px; height: 18px; border-radius: 99px; background: #FFFFFF"></span></span>{t}</div>'
kids = f'''
<section style="display: flex; gap: 28px; align-items: center; padding: 36px; border-radius: 28px; background: linear-gradient(120deg, #1B2A4A, #2A1B3D 60%, #15151B)">
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px"><h1 style="margin: 0; font-size: 52px; line-height: 1.02; font-weight: 800; letter-spacing: -0.03em">Cartoons in Turkish.<br>Only official services.</h1>
<span style="font-size: 16px; color: #D4D4DC; max-width: 520px">Every title here has Turkish audio, an age rating, and plays on a service you can trust — no pirate sites, no surprises.</span>
<form role="search" style="display: flex; align-items: center; height: 56px; padding: 0 8px 0 16px; gap: 10px; border-radius: 18px; background: #0A0A0D; max-width: 520px">{SEARCH_ICON}<input type="search" aria-label="Search cartoons" placeholder="Search a cartoon…" style="flex: 1; height: 50px; border: 0; background: transparent; color: #FFFFFF; font-family: inherit; font-size: 16px"></form></div>
<div style="display: flex; gap: 12px">{"".join(f'<img src="{B(P[k])}" alt="" style="width: 130px; height: 195px; object-fit: cover; border-radius: 18px; margin-top: {m}px">' for k, m in [('moana', 20), ('encanto', 0), ('panda', 30)])}</div></section>
{section(h2('Pick an age', '', '') + f'<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px">{aH}</div>')}
{section(h2('Family favourites in Turkish', '') + grid([poster(k, None, (('türkçe dublaj', 'dub'), ('7+', 'n'))) for k in ['moana', 'encanto', 'luca', 'elemental', 'robot', 'io2']]))}
<section style="display: flex; gap: 28px; align-items: flex-start">
<div style="flex: 1.4; display: flex; flex-direction: column; gap: 16px">{h2('Short &amp; sweet', 'Under 100 minutes') + grid([poster(k, None, (('türkçe dublaj', 'dub'),)) for k in ['panda', 'soul', 'coco', 'mario']], 4)}</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 22px; border-radius: 22px; background: #15151B; border: 1px solid #26262F"><span style="font-size: 18px; font-weight: 800">Parent settings</span>
{tog('Only Turkish audio', True)}{tog('Hide titles above 7+', True)}{tog('Only services we have', False)}{tog('Hide titles with ads', False)}
<span style="font-size: 12px; color: #6E6E7A; line-height: 1.5">Saved on this device. Sign in to use them on the TV and phone too.</span></div></section>'''
OUT['Kids'] = ('sofo kids', page('sofo kids — cartoons in Turkish', kids, active='Kids', kids=True), 1440)

# ---------- 15. My list ----------
wl = [('arcane', 'On Netflix · TR dub ✓', 'ok'), ('robot', 'On Prime Video · TR dub ✓', 'ok'), ('encanto', 'Leaves Disney+ in 5 days', 'leave'),
      ('aot', 'Not in Türkiye yet — we’ll tell you', 'n'), ('spirited', 'Now free with ads on tabii', 'free'), ('jjk', 'Season 3: TR dub coming', 'n'),
      ('io2', 'On Disney+ · TR dub ✓', 'ok'), ('onepiece', 'On Netflix · TR sub only', 'n')]
wH = ''.join(f'<a href="#" style="display: flex; flex-direction: column; gap: 8px"><span style="position: relative; display: block; aspect-ratio: 2/3; border-radius: 12px; overflow: hidden"><img src="{B(P[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover"></span><span style="font-size: 14px; font-weight: 800">{T[k]}</span><span style="align-self: flex-start; margin-top: -2px">{badge(s, kk)}</span></a>' for k, s, kk in wl)
al = [('NEW DUB', 'new', 'Arcane — Season 2 is now in Turkish on Netflix', '2 h ago'), ('LEAVING', 'leave', 'Encanto leaves Disney+ on Nov 8', 'Today'),
      ('PRICE', 'free', 'Spirited Away is now free with ads on tabii', 'Yesterday'), ('NEW SEASON', 'new', 'Jujutsu Kaisen S3 — Turkish dub announced', 'Mon')]
alH = ''.join(f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border-radius: 14px; background: #121217"><span style="display: flex; align-items: center; gap: 8px">{badge(b, k)}<span style="margin-left: auto; font-size: 12px; color: #6E6E7A">{t}</span></span><span style="font-size: 14px; font-weight: 700; line-height: 1.4">{x}</span></div>' for b, k, x, t in al)
mys = ''.join(f'<span style="display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700">{svc(s, 30, 7)}{SVN.get(s, s)}<span style="margin-left: auto; width: 42px; height: 24px; border-radius: 99px; background: {"#FF5A1F" if on else "#3A3A45"}; position: relative"><span style="position: absolute; top: 3px; {"right" if on else "left"}: 3px; width: 18px; height: 18px; border-radius: 99px; background: #FFFFFF"></span></span></span>' for s, on in [('Netflix', True), ('Disney', True), ('Prime', False), ('HBO Max', False), ('tabii', True)])
my = f'''
<section style="display: flex; flex-direction: column; gap: 14px"><h1 style="margin: 0; font-size: 44px; font-weight: 800; letter-spacing: -0.03em">My list</h1>
<div style="display: flex; gap: 8px">{chip('Watchlist · 12', True)}{chip('Alerts · 4')}{chip('Watched · 31')}{chip('My services · 3')}<span style="margin-left: auto">{chip('Sort: Available first ▾')}</span></div></section>
<section style="display: flex; gap: 28px; align-items: flex-start">
<div style="flex: 1; display: flex; flex-direction: column; gap: 18px">
<div style="display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 16px; background: #2A150D"><span style="font-size: 15px; font-weight: 700; flex: 1; color: #FFD5C7">5 of your 12 titles can be watched tonight on services you have.</span>{btn('Show only these', 'pri', 40)}</div>
{grid([w for w in wH.split('</a>') if w][:8] and [x + '</a>' for x in wH.split('</a>') if x], 4, 18)}</div>
<aside style="flex: 0 0 360px; display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; flex-direction: column; gap: 10px">{h2('Alerts', '', 'Settings', 18)}{alH}</div>
<div style="display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 18px; background: #15151B"><span style="font-size: 15px; font-weight: 800">My services</span>{mys}</div>
<div style="display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 18px; background: #15151B; border: 1px solid #26262F"><span style="font-size: 15px; font-weight: 800">Keep your list on every device</span>
<a href="#" style="height: 44px; border-radius: 12px; background: #FFFFFF; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Continue with Google</a>
<a href="#" style="height: 44px; border-radius: 12px; background: #1C1C24; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Continue with Apple</a>
<a href="#" style="height: 44px; border-radius: 12px; border: 1px solid #2E2E38; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Email me a sign-in link</a></div>
</aside></section>'''
OUT['MyList'] = ('My list + alerts', page('My list — sofo', my, active=''), 1440)

# ---------- 16. Onboarding (3 steps) ----------
def modal(step, title, sub, body, cta):
    dots = ''.join(f'<span style="width: {22 if i == step else 8}px; height: 8px; border-radius: 99px; background: {"#FF5A1F" if i == step else "#3A3A45"}"></span>' for i in range(3))
    return f'''<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 28px; border-radius: 26px; background: #15151B; border: 1px solid #26262F; box-shadow: 0 30px 80px rgba(0,0,0,0.6)">
<div style="display: flex; align-items: center; gap: 6px">{dots}<a href="#" style="margin-left: auto; font-size: 13px; font-weight: 700; color: #A1A1AD">Skip</a></div>
<span style="font-size: 13px; font-weight: 800; color: #FF5A1F">STEP {step + 1} OF 3</span>
<span style="font-size: 28px; line-height: 1.1; font-weight: 800; letter-spacing: -0.02em">{title}</span><span style="font-size: 14px; line-height: 1.5; color: #A1A1AD">{sub}</span>
{body}<span style="flex: 1"></span>{btn(cta, 'pri', 50)}</div>'''
opt = lambda t, d, on: f'<div style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; background: {"#2A150D" if on else "#0F0F14"}; border: 1px solid {"#FF5A1F" if on else "#26262F"}"><span style="width: 20px; height: 20px; border-radius: 99px; border: 2px solid {"#FF5A1F" if on else "#3A3A45"}; display: flex; align-items: center; justify-content: center">{"<span style=\"width: 10px; height: 10px; border-radius: 99px; background: #FF5A1F\"></span>" if on else ""}</span><span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; font-weight: 800">{t}</span><span style="font-size: 12px; color: #A1A1AD">{d}</span></span></div>'
s1 = opt('Türkiye', 'Detected from your connection · change anytime', True) + opt('Another country', 'Pick from 10 editions', False) + '<span style="font-size: 13px; font-weight: 800; margin-top: 4px">Interface language</span><div style="display: flex; gap: 8px">' + chip('English', True, 34) + chip('Türkçe', False, 34) + chip('More ▾', False, 34) + '</div>'
s2 = opt('Türkçe dublaj', 'Turkish voices', True) + opt('Türkçe altyazı', 'Original voices, Turkish subtitles', False) + opt('Original only', 'No dubbing, no subtitles', False) + opt('I don’t mind', 'Show everything', False)
svs = ['Netflix', 'Disney', 'Prime', 'HBO Max', 'tabii', 'TOD', 'Exxen', 'Gain']
s3 = '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px">' + ''.join(f'<span style="position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 6px; border-radius: 14px; background: #0F0F14; border: 1px solid {"#FF5A1F" if s in ("Netflix", "Disney", "tabii") else "#26262F"}">{svc(s, 40, 10)}<span style="font-size: 11px; font-weight: 700">{SVN.get(s, s)}</span>{"<span style=\"position: absolute; top: 6px; right: 6px; width: 16px; height: 16px; border-radius: 99px; background: #FF5A1F; color: #0A0A0D; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center\">✓</span>" if s in ("Netflix", "Disney", "tabii") else ""}</span>' for s in svs) + '</div><span style="font-size: 13px; color: #A1A1AD">We’ll show what you can watch now first. Others stay one tap away.</span>'
onb = f'''<div style="position: relative; min-height: 900px; overflow: hidden">
<div style="position: absolute; inset: 0; display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; padding: 10px; opacity: 0.35; filter: blur(2px)">{"".join(f'<img src="{B(P[k])}" alt="" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 10px">' for k in list(P)[:16])}</div>
<div style="position: absolute; inset: 0; background: rgba(10,10,13,0.72)"></div>
<div style="position: relative; padding: 60px 48px; display: flex; flex-direction: column; gap: 28px">
<div style="display: flex; flex-direction: column; gap: 6px; align-items: center; text-align: center">{logo(32)}<span style="font-size: 16px; color: #D4D4DC">3 quick questions — 20 seconds — so we show what you can actually watch</span></div>
<div style="display: flex; gap: 22px; align-items: stretch">{modal(0, 'Where do you watch?', 'Catalogs and prices differ in every country.', s1, 'Continue')}{modal(1, 'How do you like to watch?', 'We’ll mark every title that matches.', s2, 'Continue')}{modal(2, 'Which services do you have?', 'Pick all that apply.', s3, 'Show my picks')}</div>
</div></div>'''
OUT['Onboarding'] = ('Onboarding — 3 steps', page('Onboarding — sofo', onb, chrome=False), 1440)

# ---------- 17. Editions + empty + 404 ----------
eds = [('TR', 'Türkiye', 'Türkçe · English', True), ('US', 'United States', 'English · Español', False), ('DE', 'Deutschland', 'Deutsch · English', False),
       ('FR', 'France', 'Français', False), ('ES', 'España', 'Español', False), ('MX', 'México', 'Español', False), ('BR', 'Brasil', 'Português', False),
       ('UA', 'Україна', 'Українська · English', False), ('UZ', 'Oʻzbekiston', 'Oʻzbekcha · Русский', False), ('SA', 'Saudi Arabia', 'العربية · English', False),
       ('AZ', 'Azərbaycan', 'Azərbaycanca', False), ('KZ', 'Қазақстан', 'Қазақша · Русский', False)]
eH = ''.join(f'<a href="#" style="display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 16px; background: {"#2A150D" if on else "#15151B"}; border: 1px solid {"#FF5A1F" if on else "#26262F"}"><span style="width: 44px; height: 44px; border-radius: 99px; background: #1C1C24; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">{c}</span><span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 16px; font-weight: 800">{n}</span><span style="font-size: 12px; color: #A1A1AD">{l}</span></span>{"<span style=\"margin-left: auto\">" + badge("CURRENT", "new") + "</span>" if on else ""}</a>' for c, n, l, on in eds)
ed = f'''
<div style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 14px; background: #10233F; border: 1px solid #1E3A66"><span style="font-size: 14px; font-weight: 700; flex: 1">Looks like you’re in Deutschland. Catalogs differ by country — switch to sofo Deutschland?</span>{btn('Switch', 'pri', 38)}{btn('Stay in Türkiye', 'ghost', 38)}<span style="font-size: 11px; color: #6E6E7A">no auto-redirect</span></div>
{section(h2('Choose your edition', 'Each country has its own catalog, prices and languages', '') + f'<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px">{eH}</div>')}
<section style="display: flex; gap: 24px; align-items: stretch">
<div style="flex: 1.3; display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: 22px; background: #121217; border: 1px solid #1E1E26">
<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">STATE · SEARCH WITH NO EXACT MATCH</span>
<span style="font-size: 26px; font-weight: 800">No results for “arcane season 3”</span>
<div style="display: flex; gap: 14px; align-items: center; padding: 14px; border-radius: 16px; background: #15151B"><img src="{B(P['arcane'])}" alt="" style="width: 60px; height: 90px; object-fit: cover; border-radius: 8px"><span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 16px; font-weight: 800">Arcane ended after 2 seasons</span><span style="font-size: 13px; color: #A1A1AD">Both seasons are on Netflix with Turkish dub.</span></span>{btn('Open Arcane', 'sec', 40)}</div>
<span style="font-size: 15px; font-weight: 800; margin-top: 6px">Can’t find a title? Ask for it.</span>
<div style="display: flex; gap: 8px"><input aria-label="Title" placeholder="Title" value="Arcane season 3" style="flex: 1; height: 46px; border-radius: 12px; border: 1px solid #26262F; background: #0A0A0D; color: #FFFFFF; padding: 0 14px; font-family: inherit; font-size: 14px">{chip('Türkçe dublaj ▾', False, 46)}{btn('Notify me', 'pri', 46)}</div></div>
<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; border-radius: 22px; background: #121217; border: 1px solid #1E1E26; text-align: center">
<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">STATE · 404</span>
<span style="font-size: 96px; line-height: 1; font-weight: 800; letter-spacing: -0.05em; color: #26262F">404</span>
<span style="font-size: 22px; font-weight: 800">This page left the catalog</span><span style="font-size: 14px; color: #A1A1AD; max-width: 340px">Titles move between services. Search again — we probably know where it went.</span>
<form role="search" style="display: flex; align-items: center; height: 48px; width: 100%; max-width: 380px; padding: 0 14px; gap: 10px; border-radius: 14px; background: #0A0A0D; border: 1px solid #26262F">{SEARCH_ICON}<input type="search" aria-label="Search" placeholder="Search a title…" style="flex: 1; border: 0; background: transparent; color: #FFFFFF; font-family: inherit; font-size: 14px"></form></div></section>'''
OUT['Editions'] = ('Editions + no results + 404', page('Choose your edition — sofo', ed, active=''), 1440)

# ---------- 18. About ----------
steps = [('1', 'You search', 'A title, an actor, or just “anime with Turkish dub”.'), ('2', 'We check the services', 'Catalogs, prices, audio and subtitle languages — every day, for your country.'), ('3', 'You watch there', 'One tap opens the title on the official service. We never host video.')]
stH = ''.join(f'<div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 24px; border-radius: 22px; background: #15151B"><span style="width: 44px; height: 44px; border-radius: 99px; background: #FF5A1F; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800">{n}</span><span style="font-size: 22px; font-weight: 800">{t}</span><span style="font-size: 15px; line-height: 1.5; color: #A1A1AD">{d}</span></div>' for n, t, d in steps)
about = f'''
<section style="display: flex; flex-direction: column; gap: 16px; max-width: 860px"><h1 style="margin: 0; font-size: 56px; line-height: 1.02; font-weight: 800; letter-spacing: -0.03em">One search. Every service.<br>Your language.</h1>
<p style="margin: 0; font-size: 18px; line-height: 1.6; color: #D4D4DC">sofo tells you where a movie or series is streaming in your country — and whether you can watch it dubbed or subtitled in your language. It’s free, and it works with the services you already pay for.</p></section>
<section style="display: flex; gap: 16px">{stH}</section>
<section style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">
{"".join(f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 22px; border-radius: 20px; background: #121217; border: 1px solid #1E1E26"><span style="font-size: 17px; font-weight: 800">{t}</span><span style="font-size: 14px; line-height: 1.6; color: #A1A1AD">{d}</span></div>' for t, d in [
    ('Where our data comes from', 'Titles, posters and descriptions: TMDB. Availability, prices and languages: the services’ own catalogs, checked daily. Every page shows when it was last checked.'),
    ('What we never do', 'We don’t host or stream video. We don’t link to pirate sites. If a service doesn’t confirm a language, we don’t show it.'),
    ('How sofo makes money', 'Today: it doesn’t. Later, some links may be affiliate links — they never change the order or what we show.')])}</section>
<section style="display: flex; gap: 16px">
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 22px; border-radius: 20px; background: #2A150D"><span style="font-size: 17px; font-weight: 800">For services &amp; studios</span><span style="font-size: 14px; color: #FFD5C7; line-height: 1.5">Spot a wrong price or language? Want your catalog listed correctly?</span><a href="#" style="font-size: 14px; font-weight: 800; color: #FF5A1F">partners@sofo.tv →</a></div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 22px; border-radius: 20px; background: #15151B"><span style="font-size: 17px; font-weight: 800">Legal</span><span style="font-size: 14px; color: #A1A1AD; line-height: 1.9">Terms · Privacy · Cookies · Content removal request · Imprint</span></div></section>'''
OUT['About'] = ('About / how it works', page('How sofo works', about, active=''), 1440)

# ---------- Mobile ----------
def mhead(q=False):
    return f'''<header style="padding: 12px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #18181E">{logo(22)}<span style="flex: 1"></span><span style="font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 10px; background: #15151B">TR · EN</span><a href="#" style="width: 36px; height: 36px; border-radius: 10px; background: #15151B; display: flex; align-items: center; justify-content: center">{BELL}</a></header>'''
def tabbar(on):
    it = [('Home', '⌂'), ('Search', '⌕'), ('New', '◷'), ('My list', '♡')]
    return '<nav style="position: relative; display: flex; justify-content: space-around; padding: 10px 0 22px; background: rgba(10,10,13,0.96); border-top: 1px solid #18181E">' + ''.join(f'<a href="#" style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; font-weight: 700; color: {"#FF5A1F" if t == on else "#A1A1AD"}"><span style="font-size: 20px; line-height: 1">{i}</span>{t}</a>' for t, i in it) + '</nav>'
def mrow(t, ks, badges=(('TR dub', 'dub'),)):
    cards = ''.join(f'<a href="#" style="flex: 0 0 116px; min-width: 0; overflow: hidden; display: flex; flex-direction: column; gap: 6px"><span style="position: relative; display: block; width: 116px; height: 174px; border-radius: 10px; overflow: hidden"><img src="{B(P[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; left: 6px; top: 6px">{"".join(badge(a, b, 10) for a, b in badges)}</span></span><span style="font-size: 12px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{T[k]}</span></a>' for k in ks)
    return f'<section style="display: flex; flex-direction: column; gap: 10px"><div style="display: flex; align-items: baseline; padding: 0 16px"><span style="font-size: 18px; font-weight: 800">{t}</span><a href="#" style="margin-left: auto; font-size: 13px; color: #A1A1AD">All →</a></div><div style="display: flex; gap: 10px; overflow: hidden; padding: 0 16px">{cards}</div></section>'
mhome = f'''<div style="width: 390px; display: flex; flex-direction: column; gap: 22px">{mhead()}
<section style="padding: 4px 16px 0; display: flex; flex-direction: column; gap: 12px"><span style="font-size: 30px; line-height: 1.05; font-weight: 800; letter-spacing: -0.03em">Every movie. Every service. Your language.</span>
<a href="MobileSearchF.dc.html" style="display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 14px; border-radius: 16px; background: #15151B; border: 1px solid #FF5A1F">{SEARCH_ICON}<span style="flex: 1; font-size: 15px; color: #6E6E7A">Search movies, series…</span><span style="font-size: 12px; font-weight: 800; padding: 6px 8px; border-radius: 8px; background: #1C1C24">TR ▾</span></a>
<div style="display: flex; gap: 6px; overflow: hidden">{chip('Türkçe dublaj', True, 32)}{chip('Anime', False, 32)}{chip('Kids', False, 32)}{chip('Leaving', False, 32)}</div></section>
{mrow('Top 10 in Türkiye', ['arcane', 'spider', 'demon', 'panda'], ())}
{mrow('Just dubbed into Turkish', ['moana', 'robot', 'io2', 'mario'], (('NEW DUB', 'new'),))}
<section style="margin: 0 16px; padding: 16px; border-radius: 18px; background: #1A1408; border: 1px solid #3A2A0A; display: flex; gap: 12px; align-items: center"><img src="{B(P['encanto'])}" alt="" style="width: 54px; height: 81px; object-fit: cover; border-radius: 8px"><span style="flex: 1; display: flex; flex-direction: column; gap: 4px">{badge('LEAVING IN 5 DAYS', 'leave', 10)}<span style="font-size: 15px; font-weight: 800">Encanto leaves Disney+</span></span><span style="font-size: 13px; font-weight: 800; color: #FBBF24">Remind</span></section>
{mrow('Anime — sub or dub', ['jjk', 'aot', 'onepiece', 'demon'])}
<section style="margin: 0 16px; padding: 18px; border-radius: 18px; background: #2A150D; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 17px; font-weight: 800">Which services do you have?</span><div style="display: flex; gap: 8px">{"".join(svc(s, 40, 10) for s in ['Netflix', 'Disney', 'Prime', 'HBO Max', 'tabii', 'Exxen'])}</div></section>
{tabbar('Home')}</div>'''
OUT['MobileHomeF'] = ('Phone — Home', page('sofo — phone home', mhome, 390, 1700, chrome=False), 390)

res = [('arcane', 'Arcane', 'Series · 2021 · Netflix', 'TR dub'), ('arcane', 'Arcane — Season 2', 'Season · 2024 · 9 ep.', 'TR dub'), ('spider', 'Spider-Man: Across the Spider-Verse', 'Similar style · Netflix', 'TR dub')]
rH = ''.join(f'<a href="#" style="display: flex; gap: 12px; align-items: center; padding: 8px 0"><img src="{B(P[k])}" alt="" style="width: 44px; height: 66px; object-fit: cover; border-radius: 6px"><span style="flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0"><span style="font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{t}</span><span style="font-size: 12px; color: #A1A1AD">{m}</span></span>{badge(b, "dub", 10)}</a>' for k, t, m, b in res)
msearch = f'''<div style="width: 390px; min-height: 844px; display: flex; flex-direction: column; gap: 16px; padding: 14px 16px; box-sizing: border-box">
<div style="display: flex; align-items: center; gap: 10px"><div style="flex: 1; display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 12px; border-radius: 14px; background: #15151B; border: 1px solid #FF5A1F">{SEARCH_ICON}<span style="flex: 1; font-size: 16px; font-weight: 700">arcan<span style="display: inline-block; width: 2px; height: 18px; background: #FF5A1F; vertical-align: middle; margin-left: 1px"></span></span></div><span style="font-size: 14px; font-weight: 700; color: #A1A1AD">Cancel</span></div>
<div style="display: flex; gap: 6px">{chip('All', True, 30)}{chip('Audio: Türkçe', False, 30)}{chip('My services', False, 30)}</div>
<div style="display: flex; gap: 12px; padding: 14px; border-radius: 18px; background: #15151B"><img src="{B(P['arcane'])}" alt="" style="width: 84px; height: 126px; object-fit: cover; border-radius: 10px"><span style="flex: 1; display: flex; flex-direction: column; gap: 6px">{badge('TOP RESULT', 'new', 10)}<span style="font-size: 20px; font-weight: 800">Arcane</span><span style="font-size: 12px; color: #A1A1AD">2021–2024 · 2 seasons · TMDB 8.7</span><span style="display: flex; gap: 4px">{badge('türkçe dublaj', 'dub', 10)}{badge('altyazı', 'sub', 10)}</span>
<a href="#" style="height: 38px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; background: #FF5A1F; color: #0A0A0D; font-size: 13px; font-weight: 800">Watch on Netflix ↗</a></span></div>
<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">MORE MATCHES</span>{rH}
<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">PEOPLE ALSO SEARCH</span><div style="display: flex; flex-wrap: wrap; gap: 6px">{chip('arcane türkçe dublaj', False, 30)}{chip('arcane 2. sezon', False, 30)}{chip('league of legends dizi', False, 30)}</div></div>'''
OUT['MobileSearchF'] = ('Phone — Search (typing)', page('sofo — phone search', msearch, 390, 844, chrome=False), 390)

mt_eps = ''.join(f'<div style="display: flex; gap: 10px; align-items: center"><img src="{B(BD["arcane"])}" alt="" style="width: 112px; height: 63px; object-fit: cover; object-position: {(i*31)%100}% {(i*43)%100}%; border-radius: 8px"><span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><span style="font-size: 11px; color: #6E6E7A; font-weight: 700">E{i+1} · 40m</span><span style="font-size: 14px; font-weight: 800">{t}</span>{badge("TR dub ✓", "dub", 10)}</span></div>' for i, t in enumerate(['Heavy Is the Crown', 'Watch It All Burn', 'Finally Got the Name Right']))
mtitle = f'''<div style="width: 390px; display: flex; flex-direction: column; gap: 18px">
<div style="position: relative; height: 300px"><img src="{B(BD['arcane'])}" alt="" style="width: 100%; height: 100%; object-fit: cover; object-position: 70% 30%"><span style="position: absolute; inset: 0; background: linear-gradient(0deg, #0A0A0D, transparent 60%)"></span>
<span style="position: absolute; left: 14px; top: 14px; width: 36px; height: 36px; border-radius: 99px; background: rgba(10,10,13,0.7); display: flex; align-items: center; justify-content: center; font-weight: 800">←</span>
<span style="position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 99px; background: rgba(255,255,255,0.95); color: #0A0A0D; font-size: 13px; font-weight: 800">▶ Trailer · Türkçe</span></div>
<section style="padding: 0 16px; margin-top: -60px; position: relative; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 36px; font-weight: 800; letter-spacing: -0.03em">Arcane</span>
<span style="font-size: 13px; color: #D4D4DC">Series · 2021–2024 · 2 seasons · <span style="color: #FF5A1F; font-weight: 800">TMDB 8.7</span></span>
<span style="display: flex; gap: 6px">{badge('türkçe dublaj', 'dub')}{badge('türkçe altyazı', 'sub')}{badge('+28', 'n')}</span>
<a href="#" style="height: 52px; border-radius: 14px; background: #FF5A1F; color: #0A0A0D; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 15px; font-weight: 800">{svc('Netflix', 26, 6)}Watch on Netflix ↗</a>
<span style="font-size: 12px; color: #A1A1AD; text-align: center">Subscription · TR audio ✓ · also: Prime Video (buy)</span>
<div style="display: flex; gap: 8px">{''.join(f'<a href="#" style="flex: 1; height: 44px; border-radius: 12px; background: #15151B; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">{x}</a>' for x in ['+ List', 'Notify', 'Story ↗'])}</div></section>
<section style="padding: 0 16px; display: flex; flex-direction: column; gap: 12px"><div style="display: flex; align-items: center; gap: 8px"><span style="font-size: 18px; font-weight: 800">Episodes</span><span style="margin-left: auto">{chip('Season 2 ▾', False, 32)}</span></div>{mt_eps}</section>
{mrow('Trailers', ['arcane', 'arcane'], (('TR', 'dub'),)).replace('width: 116px; height: 174px', 'width: 220px; height: 124px').replace('flex: 0 0 116px', 'flex: 0 0 220px').replace(B(P['arcane']), B(BD['arcane']))}
{mrow('If you liked Arcane', ['spider', 'jjk', 'demon', 'aot'])}
{tabbar('Search')}</div>'''
OUT['MobileTitleF'] = ('Phone — Title page', page('Arcane — phone', mtitle, 390, 1600, chrome=False), 390)
