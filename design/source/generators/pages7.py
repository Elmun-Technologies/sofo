from lib import *
from pages2 import mhead, tabbar, mrow

OUT = {}
OR = '#FF5A1F'


def mp(inner, tab='Home', head=True, kids=False):
    h = mhead() if head else ''
    if kids:
        h = h.replace('sofo</span>', 'sofo</span><span style="font-size: 11px; font-weight: 800; padding: 2px 6px; margin-left: 6px; border-radius: 999px; background: #FDE68A; color: #0A0A0D">kids</span>', 1)
    t = tabbar(tab) if tab else ''
    return f'<div style="width: 390px; display: flex; flex-direction: column; gap: 18px">{h}{inner}{t}</div>'


def pad(inner, gap=12):
    return f'<section style="padding: 0 16px; display: flex; flex-direction: column; gap: {gap}px">{inner}</section>'


def mh1(t, sub=''):
    s = f'<span style="font-size: 13px; color: #A1A1AD; line-height: 1.4">{sub}</span>' if sub else ''
    return pad(f'<h1 style="margin: 0; font-size: 28px; line-height: 1.08; font-weight: 800; letter-spacing: -0.03em">{t}</h1>{s}', 6)


def mchips(items, on=0, h=32):
    return f'<div style="display: flex; gap: 6px; overflow: hidden; padding: 0 16px">{"".join(chip(x, i == on, h) for i, x in enumerate(items))}</div>'


def mh2(t, link='All →'):
    return f'<div style="display: flex; align-items: baseline"><span style="font-size: 18px; font-weight: 800">{t}</span><a href="#" style="margin-left: auto; font-size: 13px; color: #A1A1AD">{link}</a></div>'


def mlist(k, t, m, b=None, bk='dub', right=''):
    bb = badge(b, bk, 10) if b else ''
    return (f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 14px; background: #121217"><img src="{B(P[k])}" alt="" style="width: 50px; height: 75px; object-fit: cover; border-radius: 8px">'
            f'<span style="flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0"><span style="font-size: 15px; font-weight: 800; line-height: 1.2">{t}</span><span style="font-size: 12px; color: #A1A1AD">{m}</span>{bb}</span>{right}</div>')


def mgrid(ks, badges=(('TR dub', 'dub'),)):
    cards = ''.join(f'<a href="#" style="display: flex; flex-direction: column; gap: 6px; min-width: 0"><span style="position: relative; display: block; aspect-ratio: 2/3; border-radius: 10px; overflow: hidden"><img src="{B(P[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; left: 5px; top: 5px">{"".join(badge(a, b, 9) for a, b in badges)}</span><span style="position: absolute; right: 5px; bottom: 5px">{svc(SV[k], 18, 4)}</span></span><span style="font-size: 12px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{T[k]}</span></a>' for k in ks)
    return f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 10px; padding: 0 16px">{cards}</div>'


def sticky(label, sub=''):
    s = f'<span style="font-size: 11px; color: #A1A1AD; text-align: center">{sub}</span>' if sub else ''
    return f'<div style="position: relative; padding: 12px 16px 6px; background: linear-gradient(0deg, #0A0A0D 70%, rgba(10,10,13,0)); display: flex; flex-direction: column; gap: 6px"><a href="#" style="height: 50px; border-radius: 14px; background: {OR}; color: #0A0A0D; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 800">{label}</a>{s}</div>'


# 1 Season
s2 = ['Heavy Is the Crown', 'Watch It All Burn', 'Finally Got the Name Right', 'Paint the Town Blue', 'Blisters and Bedrock', 'The Message Hidden Within the Pattern']
eps = ''.join(f'<div style="display: flex; gap: 10px; align-items: center"><img src="{B(BD["arcane"])}" alt="" style="width: 120px; height: 68px; object-fit: cover; object-position: {(i*31)%100}% {(i*43)%100}%; border-radius: 8px"><span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 11px; color: #6E6E7A; font-weight: 700">E{i+1} · 40m</span><span style="font-size: 14px; font-weight: 800; line-height: 1.2">{t}</span><span style="display: flex; gap: 4px">{badge("TR dub ✓", "dub", 10)}{badge("TR sub ✓", "n", 10)}</span></span></div>' for i, t in enumerate(s2))
OUT['MSeason'] = mp(f'''{pad(f'<div style="display: flex; gap: 12px; align-items: center"><img src="{B(P["arcane"])}" alt="" style="width: 64px; height: 96px; object-fit: cover; border-radius: 10px"><span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; color: #A1A1AD">Arcane</span><span style="font-size: 24px; font-weight: 800">Season 2</span><span style="font-size: 12px; color: #A1A1AD">2024 · 9 episodes · final season</span></span></div>')}
{mchips(['Season 1', 'Season 2', 'All episodes'], 1)}
{pad(f'<span style="font-size: 11px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">ACT I · NOV 9, 2024</span>{eps}', 12)}
{sticky(svc("Netflix", 24, 6) + " Watch S2 on Netflix ↗", "Subscription · TR audio ✓ · 4K")}''', 'Search')

# 2 Browse
OUT['MBrowse'] = mp(f'''{mh1('Animated movies with Turkish dub', '1 912 movies on 8 services in Türkiye')}
<div style="display: flex; gap: 8px; padding: 0 16px"><a href="MobileFiltersF.dc.html" style="flex: 1; height: 42px; border-radius: 12px; background: #15151B; border: 1px solid {OR}; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 800">Filters · 3</a><span style="flex: 1; height: 42px; border-radius: 12px; background: #15151B; border: 1px solid #26262F; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700">Sort: Popular ▾</span></div>
{mchips(['Türkçe dublaj ×', 'Animation ×', 'Subscription ×'], -1, 30)}
{mgrid(['robot', 'io2', 'moana', 'panda', 'spider', 'mario', 'elemental', 'encanto', 'soul', 'luca', 'coco', 'spirited'])}
{pad('<a href="#" style="height: 46px; border-radius: 12px; background: #15151B; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Load 24 more</a>')}''', 'Search')

# 3 LangHub
cnt = ''.join(f'<span style="display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; background: #15151B">{svc(s, 28, 7)}<span style="display: flex; flex-direction: column"><span style="font-size: 13px; font-weight: 800">{SVN.get(s, s)}</span><span style="font-size: 11px; color: #A1A1AD">{n}</span></span></span>' for s, n in [('Netflix', '1 240'), ('Disney', '640'), ('Prime', '520'), ('HBO Max', '310')])
OUT['MLangHub'] = mp(f'''<section style="margin: 0 16px; padding: 20px; border-radius: 20px; background: radial-gradient(120% 140% at 100% 0%, #10314F, #0A0A0D 80%); display: flex; flex-direction: column; gap: 12px">
<div style="display: flex; gap: 6px">{chip('Dublaj', True, 30)}{chip('Altyazı', False, 30)}{chip('Original', False, 30)}</div>
<span style="font-size: 28px; line-height: 1.05; font-weight: 800; letter-spacing: -0.03em">Watch in Turkish.<br>3 412 titles.</span><span style="font-size: 12px; color: #C9D6EA">8 services · checked every day</span>
<div style="display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 12px; border-radius: 12px; background: #0A0A0D; border: 1px solid #3B82F6">{SEARCH_ICON}<span style="font-size: 14px; color: #6E6E7A">Search dubbed titles…</span></div></section>
{pad(mh2('By service') + f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">{cnt}</div>')}
{mrow('Newly dubbed', ['spider', 'moana', 'robot', 'io2'], (('NEW DUB', 'new'),))}
{mrow('Anime — Turkish dub', ['demon', 'jjk', 'aot', 'onepiece'])}
{pad(mh2('Dublaj or altyazı?', '') + '<span style="font-size: 13px; line-height: 1.5; color: #D4D4DC; padding: 14px; border-radius: 14px; background: #121217">Dublaj — voices in Turkish. Altyazı — original voices with Turkish subtitles. We show both separately for every service.</span>')}''')

# 4 Collection
items = [('spirited', 'Spirited Away', 'HBO Max'), ('coco', 'Coco', 'Disney'), ('spider', 'Spider-Man: Across the Spider-Verse', 'Netflix'), ('robot', 'The Wild Robot', 'Prime')]
ci = ''.join(f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 14px; background: #121217"><span style="width: 26px; font-size: 24px; font-weight: 800; color: #3A3A45; text-align: center">{i+1}</span><img src="{B(P[k])}" alt="" style="width: 56px; height: 84px; object-fit: cover; border-radius: 8px"><span style="flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0"><span style="font-size: 15px; font-weight: 800; line-height: 1.2">{t}</span><span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #A1A1AD">{svc(s, 18, 4)}{SVN.get(s, s)}</span>{badge("türkçe dublaj", "dub", 10)}</span><span style="font-size: 13px; font-weight: 800; color: {OR}">↗</span></div>' for i, (k, t, s) in enumerate(items))
OUT['MCollection'] = mp(f'''{mh1('The 20 best animated movies with Turkish dub', 'sofo editors · updated Nov 3, 2026')}
{mchips(['All 20', 'My services · 14', 'Free · 3'], 0, 30)}
{pad(ci, 8)}
{pad('<a href="#" style="height: 46px; border-radius: 12px; background: #15151B; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Show 16 more</a><div style="display: flex; gap: 8px"><a href="#" style="flex: 1; height: 44px; border-radius: 12px; background: #1C1C24; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">+ Save list</a><a href="#" style="flex: 1; height: 44px; border-radius: 12px; background: #1C1C24; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">Story ↗</a></div>')}''')

# 5 Service
lv = ''.join(mlist(k, T[k], 'Leaves Netflix ' + d, 'LEAVING ' + d.upper(), 'leave') for k, d in [('mario', 'Nov 30'), ('panda', 'Dec 1'), ('rick', 'Dec 4')])
OUT['MService'] = mp(f'''<section style="margin: 0 16px; padding: 18px; border-radius: 20px; background: linear-gradient(135deg, #2A0A0C, #15151B 70%); display: flex; gap: 14px; align-items: center">{svc('Netflix', 56, 14)}<span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 22px; font-weight: 800">Netflix in Türkiye</span><span style="font-size: 12px; color: #D4D4DC">6 840 titles · 1 240 TR dub · from ₺149.99</span></span></section>
{mchips(['All', 'TR dub only', 'Movies', 'Series'], 0, 30)}
{mrow('New this week', ['spider', 'io2', 'moana', 'arcane'], (('NEW', 'new'),))}
{pad(mh2('Leaving soon') + lv, 8)}
{pad('<a href="#" style="height: 46px; border-radius: 12px; background: #15151B; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Netflix vs Disney+ vs Prime →</a>')}''')

# 6 New & leaving
days = ''.join(f'<span style="flex: 0 0 46px; height: 60px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: {OR if n == "3" else "#15151B"}; color: {"#0A0A0D" if n == "3" else "#FFFFFF"}"><span style="font-size: 11px; font-weight: 800">{d}</span><span style="font-size: 18px; font-weight: 800">{n}</span></span>' for d, n in [('Mon', '2'), ('Tue', '3'), ('Wed', '4'), ('Thu', '5'), ('Fri', '6'), ('Sat', '7'), ('Sun', '8')])
OUT['MNewLeaving'] = mp(f'''{mh1('New &amp; leaving', 'Week of Nov 2–8 · Türkiye')}
<div style="display: flex; gap: 6px; padding: 0 16px">{days}</div>
{pad(f'<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">TUESDAY, NOV 3 · TODAY</span>' + mlist('moana', 'Moana 2', 'Disney+ · new', 'NEW', 'new') + mlist('coco', 'Coco', 'Disney+ · leaves Nov 4', 'LEAVING TOMORROW', 'leave', f'<span style="font-size: 12px; font-weight: 800; color: #FBBF24">Remind</span>'), 8)}
{pad('<div style="padding: 16px; border-radius: 16px; background: #2A150D; display: flex; flex-direction: column; gap: 8px"><span style="font-size: 16px; font-weight: 800">Get this every Friday</span><span style="font-size: 13px; color: #FFD5C7">New dubs and what’s leaving — on Telegram.</span><a href="#" style="height: 42px; border-radius: 12px; background: #229ED9; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Connect Telegram</a></div>')}''', 'New')

# 7 Trailers
tv = ''.join(f'<a href="#" style="display: flex; flex-direction: column; gap: 6px"><span style="position: relative; display: block; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden"><img src="{B(BD[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; left: 8px; bottom: 8px">{badge("▶ " + d, "n", 11)}</span><span style="position: absolute; right: 8px; top: 8px">{badge(l, "dub" if l == "TR" else "n")}</span></span><span style="font-size: 14px; font-weight: 800">{t}</span></a>' for k, t, d, l in [('panda', 'Kung Fu Panda 4 — Trailer 2', '2:28', 'TR'), ('io2', 'Inside Out 2 — Official trailer', '2:18', 'EN')])
sh = ''.join(f'<span style="flex: 0 0 110px; height: 196px; border-radius: 12px; overflow: hidden; position: relative"><img src="{B(BD[k])}" alt="" style="width: 100%; height: 100%; object-fit: cover; object-position: {p}"><span style="position: absolute; left: 8px; bottom: 8px; font-size: 11px; font-weight: 800">{t}</span></span>' for k, t, p in [('arcane', 'Jinx in 30s', '30% 40%'), ('spider', 'Gwen’s world', '60% 50%'), ('demon', 'Water breathing', '30% 50%')])
OUT['MTrailers'] = mp(f'''{mh1('Trailers')}
{mchips(['Trending', 'New', 'Coming soon', 'Türkçe'], 0, 30)}
<section style="margin: 0 16px; position: relative; aspect-ratio: 16/9; border-radius: 16px; overflow: hidden"><img src="{B(BD['spider'])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(10,10,13,0.9), transparent 60%)"></span><span style="position: absolute; left: 12px; right: 12px; bottom: 10px; display: flex; flex-direction: column; gap: 4px">{badge('TÜRKÇE DUBLAJ', 'dub', 10)}<span style="font-size: 16px; font-weight: 800">Spider-Verse — Official trailer</span></span></section>
{pad(tv, 14)}
{pad(mh2('Shorts') + f'<div style="display: flex; gap: 8px; overflow: hidden">{sh}</div>')}''', 'New')

# 8 Person
fl = ''.join(mlist(k, t, r, b, 'dub' if 'dub' in b else 'n') for k, t, r, b in [('panda', 'Kung Fu Panda 4', '2024 · Po (voice) · Netflix', 'TR dub ✓'), ('mario', 'The Super Mario Bros. Movie', '2023 · Bowser (voice) · Netflix', 'TR dub ✓')])
OUT['MPerson'] = mp(f'''{pad(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">{initials("JB", 104)}<span style="font-size: 28px; font-weight: 800">Jack Black</span><span style="font-size: 13px; color: #A1A1AD">Actor · Voice actor · Musician</span><span style="display: flex; gap: 6px">{badge("94 titles", "n")}{badge("21 TR dub", "dub")}</span></div>')}
{mchips(['All', 'Voice', 'Acting', 'TR dub only'], 0, 30)}
{pad(mh2('Where to watch his work', '') + fl, 8)}
{pad('<a href="#" style="height: 46px; border-radius: 12px; background: #15151B; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">+ Follow — new releases</a>')}''', 'Search')

# 9 Kids
ages = ''.join(f'<span style="padding: 16px; border-radius: 18px; background: {c}; color: #0A0A0D; display: flex; flex-direction: column"><span style="font-size: 28px; font-weight: 800">{a}</span><span style="font-size: 12px; font-weight: 800">{t}</span></span>' for a, t, c in [('0–3', 'First cartoons', '#FDE68A'), ('4–6', 'Preschool', '#F9A8D4'), ('7–9', 'Adventures', '#7DD3FC'), ('10–12', 'Pre-teen', '#86EFAC')])
OUT['MKids'] = mp(f'''<section style="margin: 0 16px; padding: 20px; border-radius: 22px; background: linear-gradient(120deg, #1B2A4A, #2A1B3D); display: flex; flex-direction: column; gap: 10px"><span style="font-size: 26px; line-height: 1.05; font-weight: 800">Cartoons in Turkish. Only official services.</span>
<div style="display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 12px; border-radius: 14px; background: #0A0A0D">{SEARCH_ICON}<span style="font-size: 14px; color: #6E6E7A">Search a cartoon…</span></div></section>
{pad(mh2('Pick an age', '') + f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">{ages}</div>')}
{mrow('Family favourites', ['moana', 'encanto', 'luca', 'elemental'])}
{pad('<span style="font-size: 13px; font-weight: 800; padding: 14px; border-radius: 14px; background: #15151B; display: flex; justify-content: space-between">Parent settings <span style="color: #A1A1AD">Only TR audio · 7+ ›</span></span>')}''', kids=True)

# 10 Onboarding (mobile, step 3)
svs = ['Netflix', 'Disney', 'Prime', 'HBO Max', 'tabii', 'TOD', 'Exxen', 'Gain']
sg = ''.join(f'<span style="position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px; border-radius: 14px; background: #0F0F14; border: 1px solid {OR if s in ("Netflix", "Disney", "tabii") else "#26262F"}">{svc(s, 40, 10)}<span style="font-size: 11px; font-weight: 700">{SVN.get(s, s)}</span></span>' for s in svs)
OUT['MOnboarding'] = f'''<div style="width: 390px; min-height: 844px; box-sizing: border-box; padding: 20px 18px 28px; display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; align-items: center; gap: 6px"><span style="width: 8px; height: 8px; border-radius: 99px; background: #3A3A45"></span><span style="width: 8px; height: 8px; border-radius: 99px; background: #3A3A45"></span><span style="width: 22px; height: 8px; border-radius: 99px; background: {OR}"></span><a href="#" style="margin-left: auto; font-size: 13px; color: #A1A1AD; font-weight: 700">Skip</a></div>
<span style="font-size: 12px; font-weight: 800; color: {OR}">STEP 3 OF 3</span><span style="font-size: 30px; line-height: 1.08; font-weight: 800; letter-spacing: -0.02em">Which services do you have?</span><span style="font-size: 14px; color: #A1A1AD">We’ll show what you can watch tonight first.</span>
<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">{sg}</div>
<span style="flex: 1"></span><a href="#" style="height: 52px; border-radius: 14px; background: {OR}; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800">Show my picks</a></div>'''

# 11 Franchise
fi = ''.join(f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 14px; background: #121217"><span style="width: 44px; height: 66px; flex: 0 0 44px; border-radius: 8px; background: linear-gradient(160deg, #3A2A12, #1A1408); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #F5C46B">{n}</span><span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 800">{t}</span><span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #A1A1AD">{svc(s, 18, 4)}{SVN.get(s, s)} · {y}</span>{badge("TR dub ✓", "dub", 10)}</span><span style="font-size: 13px; font-weight: 800; color: {OR}">↗</span></div>' for n, t, s, y in [('1', 'Kung Fu Panda', 'Netflix', '2008'), ('2', 'Kung Fu Panda 2', 'Netflix', '2011'), ('3', 'Kung Fu Panda 3', 'Prime', '2016'), ('4', 'Kung Fu Panda 4', 'Netflix', '2024')])
OUT['MFranchise'] = mp(f'''<section style="position: relative; height: 200px; margin: 0 16px; border-radius: 18px; overflow: hidden"><img src="{B(BD['panda'])}" alt="" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(0deg, #0A0A0D, transparent)"></span><span style="position: absolute; left: 14px; right: 14px; bottom: 12px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 11px; font-weight: 800; color: #F5C46B">4 MOVIES · 3 SERIES</span><span style="font-size: 22px; line-height: 1.1; font-weight: 800">Kung Fu Panda: watch order</span></span></section>
{mchips(['Release order', 'Story order'], 0, 30)}
{pad(fi, 8)}
{pad('<div style="padding: 14px; border-radius: 14px; background: #2A150D; font-size: 13px; line-height: 1.5; color: #FFD5C7"><b style="color: #FFFFFF">Netflix + Prime Video</b> cover all 4 movies — no rentals needed.</div>')}''', 'Search')

# 12 Releases
def vstage(t, d, st):
    col = {'done': OR, 'est': '#FBBF24', 'unk': '#3A3A45'}[st]
    ic = {'done': '✓', 'est': '~', 'unk': '?'}[st]
    return f'<div style="display: flex; gap: 10px; align-items: center"><span style="width: 22px; height: 22px; border-radius: 99px; background: {col}; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800">{ic}</span><span style="flex: 1; font-size: 13px; font-weight: 700">{t}</span><span style="font-size: 12px; color: {"#FDE68A" if st == "est" else "#A1A1AD"}">{d}</span></div>'
rc = f'''<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 16px; background: #121217"><div style="display: flex; gap: 10px; align-items: center"><img src="{B(P['demon'])}" alt="" style="width: 44px; height: 66px; object-fit: cover; border-radius: 8px"><span style="flex: 1; font-size: 15px; font-weight: 800">Demon Slayer: Infinity Castle</span></div>
{vstage('In theaters', 'Sep 2025', 'done')}{vstage('Rent / buy', 'Dec 2025', 'done')}{vstage('Subscription', '~ Dec 2026', 'est')}{vstage('Turkish dub', 'not announced', 'unk')}
<a href="#" style="height: 40px; border-radius: 10px; background: {OR}; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">Notify me</a></div>'''
OUT['MReleases'] = mp(f'''{mh1('Coming to streaming', 'Cinema → your sofa → Turkish dub')}
{mchips(['Nov · 42', 'Dec · 57', 'Jan · 33'], 0, 30)}
{pad(rc)}
{pad('<span style="font-size: 12px; color: #6E6E7A; line-height: 1.5">“~” — our estimate from the studio’s usual window. Changes when a real date appears.</span>')}''', 'New')

# 13 Editions + 404
el = ''.join(f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: {"#2A150D" if on else "#121217"}; border: 1px solid {OR if on else "#1E1E26"}"><span style="width: 36px; height: 36px; border-radius: 99px; background: #1C1C24; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800">{c}</span><span style="flex: 1; display: flex; flex-direction: column"><span style="font-size: 15px; font-weight: 800">{n}</span><span style="font-size: 11px; color: #A1A1AD">{l}</span></span>{"✓" if on else ""}</div>' for c, n, l, on in [('TR', 'Türkiye', 'Türkçe · English', True), ('US', 'United States', 'English · Español', False), ('DE', 'Deutschland', 'Deutsch', False), ('FR', 'France', 'Français', False), ('UZ', 'Oʻzbekiston', 'Oʻzbekcha · Русский', False)])
OUT['MEditions'] = mp(f'''{mh1('Choose your edition', 'Catalogs and prices differ by country')}
{pad(el, 8)}
{pad(f'<div style="padding: 18px; border-radius: 16px; background: #121217; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center"><span style="font-size: 11px; font-weight: 800; color: #6E6E7A">STATE · 404</span><span style="font-size: 56px; font-weight: 800; color: #26262F; line-height: 1">404</span><span style="font-size: 17px; font-weight: 800">This page left the catalog</span><span style="font-size: 13px; color: #A1A1AD">Search again — we probably know where it went.</span></div>')}''', 'Home')

# 14 About
st = ''.join(f'<div style="display: flex; gap: 12px; padding: 14px; border-radius: 14px; background: #15151B"><span style="width: 32px; height: 32px; flex: 0 0 32px; border-radius: 99px; background: {OR}; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-weight: 800">{n}</span><span style="display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 800">{t}</span><span style="font-size: 13px; color: #A1A1AD; line-height: 1.4">{d}</span></span></div>' for n, t, d in [('1', 'You search', 'A title, an actor or “anime with Turkish dub”.'), ('2', 'We check the services', 'Catalogs, prices and languages — daily.'), ('3', 'You watch there', 'One tap opens the official service. We never host video.')])
OUT['MAbout'] = mp(f'''{mh1('One search. Every service. Your language.')}
{pad(st, 8)}
{pad('<div style="padding: 14px; border-radius: 14px; background: #121217; font-size: 13px; line-height: 1.6; color: #D4D4DC"><b style="color: #FFFFFF">What we never do:</b> host or stream video, link to pirate sites, or guess a language the service doesn’t confirm.</div><span style="font-size: 12px; color: #6E6E7A">Terms · Privacy (KVKK) · Cookies · Content removal · partners@sofo.tv</span>')}''', 'Home')

# 15 Notify sheet + cookie
OUT['MNotify'] = f'''<div style="position: relative; width: 390px; height: 844px; overflow: hidden">
<img src="{B(BD['arcane'])}" alt="" style="position: absolute; top: 0; left: 0; width: 100%; height: 360px; object-fit: cover; opacity: 0.5"><div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6)"></div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; border-radius: 24px 24px 0 0; background: #15151B; padding: 12px 18px 26px; display: flex; flex-direction: column; gap: 12px">
<span style="align-self: center; width: 40px; height: 4px; border-radius: 99px; background: #3A3A45"></span>
<div style="display: flex; gap: 12px; align-items: center"><img src="{B(P['jjk'])}" alt="" style="width: 44px; height: 66px; object-fit: cover; border-radius: 8px"><span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 17px; font-weight: 800">Notify me</span><span style="font-size: 12px; color: #A1A1AD">Jujutsu Kaisen · Season 3</span></span></div>
{"".join(f'<label style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: {"#2A150D" if on else "#0F0F14"}; font-size: 14px; font-weight: 700"><span style="width: 20px; height: 20px; border-radius: 6px; {"background: " + OR + "; color: #0A0A0D" if on else "border: 1.5px solid #3A3A45"}; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800">{"✓" if on else ""}</span>{t}</label>' for t, on in [('Turkish dub arrives', True), ('New episode is out', True), ('It leaves Netflix', False)])}
<div style="display: flex; gap: 6px">{chip('Telegram', True, 34)}{chip('Email', False, 34)}</div>
<a href="#" style="height: 50px; border-radius: 14px; background: {OR}; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800">Save alerts</a></div>
<div style="position: absolute; left: 12px; right: 12px; top: 14px; padding: 12px 14px; border-radius: 14px; background: #15151B; border: 1px solid #26262F; display: flex; flex-direction: column; gap: 8px"><span style="font-size: 12px; line-height: 1.4; color: #D4D4DC">🍪 Essential cookies remember your country and services. OK to measure usage too? (KVKK)</span><div style="display: flex; gap: 6px"><span style="flex: 1; height: 34px; border-radius: 10px; border: 1px solid #2E2E38; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800">Only essential</span><span style="flex: 1; height: 34px; border-radius: 10px; background: {OR}; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800">Accept</span></div></div></div>'''

TITLES = {'MSeason': 'Telefon — Sezon / qism', 'MBrowse': 'Telefon — Katalog', 'MLangHub': 'Telefon — Til hubi', 'MCollection': "Telefon — To'plam", 'MService': 'Telefon — Servis (Netflix)',
          'MNewLeaving': 'Telefon — Yangi va ketayotganlar', 'MTrailers': 'Telefon — Treylerlar', 'MPerson': 'Telefon — Shaxs', 'MKids': 'Telefon — sofo kids', 'MOnboarding': 'Telefon — Onboarding',
          'MFranchise': 'Telefon — Franshiza', 'MReleases': 'Telefon — Chiqish kuzatuvchisi', 'MEditions': 'Telefon — Editionlar + 404', 'MAbout': 'Telefon — Qanday ishlaydi', 'MNotify': 'Telefon — Notify oynasi + KVKK banner'}
for k in list(OUT):
    OUT[k] = (TITLES[k], page(TITLES[k], OUT[k], 390, 1200, chrome=False), 390)
