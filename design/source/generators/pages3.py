from lib import *

OUT = {}
CHECK = '<span style="width: 28px; height: 28px; flex: 0 0 28px; border-radius: 99px; background: #FF5A1F; color: #0A0A0D; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800">✓</span>'


def card(inner, pad=20, bg='#15151B', bd='#26262F', gap=12, extra=''):
    return f'<div style="display: flex; flex-direction: column; gap: {gap}px; padding: {pad}px; border-radius: 20px; background: {bg}; border: 1px solid {bd}; {extra}">{inner}</div>'


def tile(n, t, h=150, w=100):
    """Text poster placeholder for titles without a licensed image."""
    return (f'<span style="width: {w}px; height: {h}px; flex: 0 0 {w}px; border-radius: 12px; background: linear-gradient(160deg, #3A2A12, #1A1408); border: 1px solid #3A2A0A; '
            f'display: flex; flex-direction: column; justify-content: space-between; padding: 10px; box-sizing: border-box"><span style="font-size: 28px; font-weight: 800; color: #F5C46B">{n}</span>'
            f'<span style="font-size: 11px; font-weight: 800; line-height: 1.2; color: #F5E6C8">{t}</span></span>')


# ---------- A. Movie: answer block + availability history ----------
lanes = [('Theaters', None, 0, 8, '#6E6E7A', 'In theaters · Oct 2024'),
         ('Apple TV', 'Apple TV', 9, 100, '#A1A1AD', 'Rent / buy since Dec 2024'),
         ('Prime Video', 'Prime', 27, 100, '#FF5A1F', 'Subscription since Apr 2025'),
         ('Netflix', 'Netflix', 36, 52, '#E50914', 'Jul – Oct 2025 · left')]
months = ['Oct 24', 'Jan 25', 'Apr 25', 'Jul 25', 'Oct 25', 'Jan 26', 'Apr 26', 'Jul 26', 'Oct 26']
laneH = ''.join(
    f'<div style="display: flex; align-items: center; gap: 14px; height: 40px"><span style="flex: 0 0 120px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700">{svc(s, 20, 5) if s else ""}{n}</span>'
    f'<div style="flex: 1; position: relative; height: 12px; border-radius: 99px; background: #1C1C24"><span style="position: absolute; left: {a}%; width: {b - a}%; top: 0; bottom: 0; border-radius: 99px; background: {c}"></span>'
    f'<span style="position: absolute; left: calc({a}% + 6px); top: -20px; font-size: 11px; font-weight: 700; color: #A1A1AD; white-space: nowrap">{lab}</span></div></div>'
    for n, s, a, b, c, lab in lanes)
monthH = ''.join(f'<span style="font-size: 11px; color: #6E6E7A; font-weight: 700">{m}</span>' for m in months)
events = [('Nov 1, 2026', 'Price drop', 'Apple TV rent ₺89 → ₺69', 'free'), ('Oct 31, 2025', 'Left Netflix', 'Was there for 4 months', 'leave'),
          ('Jul 2, 2025', 'Added to Netflix', 'Turkish dub ✓', 'new'), ('Apr 18, 2025', 'Added to Prime Video', 'Turkish dub + subtitles ✓', 'new'),
          ('Dec 10, 2024', 'Digital release', 'Rent/buy on Apple TV and YouTube', 'n')]
evH = ''.join(f'<div style="display: flex; gap: 14px; align-items: flex-start"><span style="flex: 0 0 100px; font-size: 12px; font-weight: 700; color: #6E6E7A; padding-top: 3px">{d}</span>'
              f'<span style="display: flex; flex-direction: column; gap: 4px">{badge(t, k)}<span style="font-size: 13px; color: #D4D4DC">{x}</span></span></div>' for d, t, x, k in events)
answer = f'''
<nav style="font-size: 13px; color: #6E6E7A; font-weight: 600; margin-bottom: -20px">Home / Movies / <span style="color: #A1A1AD">The Wild Robot</span></nav>
<section style="display: flex; gap: 20px; align-items: stretch">
<div style="flex: 1; display: flex; flex-direction: column; gap: 16px; padding: 26px; border-radius: 24px; background: linear-gradient(135deg, #2A150D, #121217 70%); border: 1px solid #5A2A17">
<span style="font-size: 12px; font-weight: 800; color: #FF5A1F; letter-spacing: 0.08em">THE SHORT ANSWER</span>
<div style="display: flex; gap: 14px; align-items: flex-start">{CHECK}<h1 style="margin: 0; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em">Yes — <span style="color: #FF5A1F">The Wild Robot</span> is streaming on Prime Video in Türkiye, with Turkish dub and subtitles.</h1></div>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px">
{"".join(f'<div style="padding: 12px 14px; border-radius: 14px; background: rgba(10,10,13,0.55); display: flex; flex-direction: column; gap: 3px"><span style="font-size: 11px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.05em">{a}</span><span style="font-size: 15px; font-weight: 800">{b}</span><span style="font-size: 12px; color: #A1A1AD">{c}</span></div>' for a, b, c in [('CHEAPEST WAY', 'Included in Prime', 'or rent from ₺69 on Apple TV'), ('TURKISH DUB', 'Prime · Apple TV', 'YouTube: subtitles only'), ('NOT ON', 'Netflix, Disney+', 'left Netflix Oct 31, 2025')])}
</div>
<div style="display: flex; align-items: center; gap: 12px">{btn('Watch on Prime Video ↗', 'pri', 48)}{btn('Alert me if it leaves', 'sec', 48)}<span style="margin-left: auto; font-size: 12px; color: #6E6E7A; text-align: right">Checked today 09:40 from the Prime Video Türkiye catalog<br><a href="#" style="color: #A1A1AD">Something wrong? Tell us</a></span></div>
</div>
<div style="flex: 0 0 300px; position: relative; border-radius: 24px; overflow: hidden"><img src="{B(P['robot'])}" alt="The Wild Robot poster" style="width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; left: 12px; top: 12px; display: flex; gap: 4px">{badge('türkçe dublaj', 'dub')}{badge('TMDB 8.3', 'n')}</span></div>
</section>
<section style="display: flex; gap: 20px; align-items: flex-start">
{card(h2('Availability history', 'Where it has been in Türkiye', '', 22) + f'<div style="display: flex; flex-direction: column; gap: 10px; padding-top: 18px">{laneH}<div style="display: flex; justify-content: space-between; margin-left: 134px">{monthH}</div></div>' + '<span style="font-size: 13px; color: #A1A1AD">We record every change since launch. Movies like this often move between services every 6–12 months.</span>', 24, extra='flex: 1.5 1 0')}
{card(h2('Change log', '', '', 22) + evH + btn('Follow changes for this movie', 'ghost', 42), 24, extra='flex: 1 1 0')}
</section>
<section style="display: flex; gap: 20px">
{card('<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">WHAT GOOGLE AND AI ASSISTANTS READ</span><span style="font-family: ui-monospace, monospace; font-size: 12px; line-height: 1.7; color: #FFD5C7">Movie · name "The Wild Robot" · alternateName "Vahşi Robot" · potentialAction WatchAction → Prime Video (TR), availableLanguage tr, en · offers Rent ₺69 · dateModified 2026-11-03T09:40</span>', 18, '#0F0F14', '#1E1E26', 8, 'flex: 1')}
</section>'''
OUT['MovieAnswer'] = ('Movie — answer block + history', page('The Wild Robot — where to watch, short answer and history', answer, active='Movies'), 1440)

# ---------- B. Franchise / watch order ----------
films = [('1', 'Kung Fu Panda', '2008 · 1h 32m', 'Netflix', 'Subscription', None), ('2', 'Kung Fu Panda 2', '2011 · 1h 30m', 'Netflix', 'Subscription', None),
         ('3', 'Kung Fu Panda 3', '2016 · 1h 35m', 'Prime', 'Subscription', None), ('4', 'Kung Fu Panda 4', '2024 · 1h 34m', 'Netflix', 'Subscription', 'panda')]
fH = ''.join(f'''<article style="display: flex; gap: 18px; align-items: center; padding: 14px; border-radius: 18px; background: #121217; border: 1px solid #1E1E26">
{(f'<img src="{B(P[k])}" alt="{t}" style="width: 100px; height: 150px; object-fit: cover; border-radius: 12px">' if k else tile(n, t))}
<div style="flex: 1; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: #F5C46B">PART {n}</span><a href="Movie.dc.html" style="font-size: 22px; font-weight: 800">{t}</a><span style="font-size: 13px; color: #A1A1AD">{m}</span><span style="display: flex; gap: 6px">{badge('türkçe dublaj', 'dub')}{badge('türkçe altyazı', 'sub')}</span></div>
<div style="flex: 0 0 250px; display: flex; flex-direction: column; gap: 8px"><span style="display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 800">{svc(s, 30, 7)}{SVN.get(s, s)}<span style="font-size: 12px; color: #A1A1AD; font-weight: 600">{p}</span></span>{btn('Watch ↗', 'pri' if n == '1' else 'sec', 40)}</div></article>''' for n, t, m, s, p, k in films)
series = [('Legends of Awesomeness', '2011–2016 · 3 seasons', 'Prime'), ('The Paws of Destiny', '2018–2019 · 2 seasons', 'Prime'), ('The Dragon Knight', '2022–2023 · 3 seasons', 'Netflix')]
sH = ''.join(f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: #121217">{svc(s, 30, 7)}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; font-weight: 800">{t}</span><span style="font-size: 12px; color: #A1A1AD">{m}</span></span>{badge("TR dub ✓", "dub")}</div>' for t, m, s in series)
fr = f'''
<section style="position: relative; border-radius: 24px; overflow: hidden">
<img src="{B(BD['panda'])}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 35%">
<div style="position: absolute; inset: 0; background: linear-gradient(90deg, #0A0A0D 35%, rgba(10,10,13,0.3))"></div>
<div style="position: relative; padding: 36px; display: flex; flex-direction: column; gap: 14px; max-width: 700px">
<span style="font-size: 13px; font-weight: 800; color: #F5C46B; letter-spacing: 0.08em">FRANCHISE · 4 MOVIES · 3 SERIES · 4 SHORTS</span>
<h1 style="margin: 0; font-size: 50px; line-height: 1.02; font-weight: 800; letter-spacing: -0.03em">Kung Fu Panda: watch order and where to stream every part</h1>
<span style="font-size: 16px; color: #D4D4DC">All 4 movies have Turkish dub, and all 4 are included in a subscription in Türkiye.</span>
<div style="display: flex; gap: 8px">{chip('Release order', True)}{chip('Story order')}{chip('Only on my services')}</div></div></section>
<section style="display: flex; gap: 28px; align-items: flex-start">
<div style="flex: 1; display: flex; flex-direction: column; gap: 12px">{h2('Movies', '6h 11m in total', '', 22)}{fH}{h2('Series', '', '', 22)}{sH}
{h2('Shorts', '', '', 22)}<span style="font-size: 14px; color: #A1A1AD; line-height: 1.8">Secrets of the Furious Five (2008) · Kung Fu Panda Holiday (2010) · Secrets of the Masters (2011) · Secrets of the Scroll (2016)</span></div>
<aside style="flex: 0 0 340px; display: flex; flex-direction: column; gap: 14px">
{card('<span style="font-size: 12px; font-weight: 800; color: #FF5A1F; letter-spacing: 0.06em">WATCH ALL 4 MOVIES</span><span style="font-size: 26px; font-weight: 800">Netflix + Prime Video</span><span style="font-size: 14px; color: #FFD5C7; line-height: 1.5">These two cover all 4 movies — no rentals needed.</span>' + btn('Add the whole franchise to My list', 'pri', 44), 20, '#2A150D', '#5A2A17')}
{card('<span style="font-size: 15px; font-weight: 800">Kung Fu Panda 5?</span><span style="font-size: 14px; color: #A1A1AD; line-height: 1.5">We’ll tell you the moment a new part is dated — and when it gets Turkish dub.</span>' + btn('Notify me', 'sec', 42))}
{card('<span style="font-size: 15px; font-weight: 800">More franchises</span>' + ''.join(f'<a href="#" style="font-size: 14px; font-weight: 700; color: #D4D4DC">{x} →</a>' for x in ['Spider-Verse', 'Inside Out', 'Moana', 'Toy Story', 'Shrek', 'How to Train Your Dragon']))}
</aside></section>'''
OUT['Franchise'] = ('Franchise — watch order', page('Kung Fu Panda watch order — where to stream every part', fr, active='Movies'), 1440)

# ---------- C. Release tracker ----------
def stage(t, d, st):
    col = {'done': '#FF5A1F', 'est': '#FBBF24', 'unk': '#3A3A45'}[st]
    ic = {'done': '✓', 'est': '~', 'unk': '?'}[st]
    return (f'<div style="flex: 1; display: flex; flex-direction: column; gap: 6px"><div style="display: flex; align-items: center; gap: 8px"><span style="width: 26px; height: 26px; border-radius: 99px; background: {col}; color: #0A0A0D; '
            f'display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">{ic}</span><span style="flex: 1; height: 2px; background: {col}; opacity: 0.5"></span></div>'
            f'<span style="font-size: 13px; font-weight: 800">{t}</span><span style="font-size: 12px; color: {"#A1A1AD" if st != "est" else "#F5C46B"}">{d}</span></div>')
trk = [('demon', 'Demon Slayer: Infinity Castle', 'Movie · anime', [('In theaters', 'Sep 2025', 'done'), ('Rent / buy', 'Dec 2025', 'done'), ('Subscription', '~ Dec 2026 · Netflix', 'est'), ('Turkish dub', 'not announced', 'unk')]),
       ('jjk', 'Jujutsu Kaisen — Season 3', 'Series · anime', [('Airs in Japan', 'Jan 2026', 'done'), ('Turkish subtitles', 'Netflix · same week', 'done'), ('Turkish dub', '~ Jan 2027', 'est'), ('Full season', '~ Mar 2027', 'est')]),
       ('aot', 'Attack on Titan: The Last Attack', 'Movie · anime', [('In theaters', 'Nov 2024', 'done'), ('Rent / buy', 'Mar 2025', 'done'), ('Subscription', 'Prime · Jun 2025', 'done'), ('Turkish dub', '~ Dec 2026', 'est')])]
tH = ''.join(f'''<article style="display: flex; gap: 20px; align-items: center; padding: 18px; border-radius: 20px; background: #121217; border: 1px solid #1E1E26">
<img src="{B(P[k])}" alt="{t}" style="width: 96px; height: 144px; object-fit: cover; border-radius: 12px">
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px"><div style="display: flex; align-items: baseline; gap: 10px"><span style="font-size: 20px; font-weight: 800">{t}</span><span style="font-size: 13px; color: #A1A1AD">{m}</span></div>
<div style="display: flex; gap: 10px">{"".join(stage(*s) for s in st)}</div></div>
<div style="flex: 0 0 170px; display: flex; flex-direction: column; gap: 8px">{btn('Notify me', 'pri', 42)}<span style="font-size: 11px; color: #6E6E7A; line-height: 1.4">“~” = our estimate from the studio’s usual window</span></div></article>''' for k, t, m, st in trk)
cal = ''.join(f'<div style="flex: 1; padding: 14px; border-radius: 16px; background: {"#1C1C24" if i == 0 else "#121217"}; border: 1px solid {"#FF5A1F" if i == 0 else "#1E1E26"}; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13px; font-weight: 800; color: #A1A1AD">{m}</span><span style="font-size: 26px; font-weight: 800">{n}</span><span style="font-size: 12px; color: #A1A1AD">arrivals · {d} dubs</span></div>' for i, (m, n, d) in enumerate([('November 2026', 42, 11), ('December 2026', 57, 18), ('January 2027', 33, 9), ('February 2027', 21, 4)]))
rel = f'''
<section style="display: flex; flex-direction: column; gap: 14px"><h1 style="margin: 0; font-size: 44px; font-weight: 800; letter-spacing: -0.03em">Coming to streaming in Türkiye</h1>
<span style="font-size: 16px; color: #A1A1AD">From the cinema to your sofa — and when the Turkish dub arrives.</span>
<div style="display: flex; gap: 8px">{chip('All', True)}{chip('Movies')}{chip('Series')}{chip('Anime')}{chip('Only Turkish dub')}<span style="margin-left: auto">{chip('My follows · 6')}</span></div></section>
<section style="display: flex; gap: 12px">{cal}</section>
<section style="display: flex; flex-direction: column; gap: 12px">{h2('Being tracked', 'Sorted by next step', '', 22)}{tH}</section>
<section style="display: flex; gap: 20px">{card('<span style="font-size: 17px; font-weight: 800">How we estimate dates</span><span style="font-size: 14px; line-height: 1.6; color: #A1A1AD">Confirmed dates come from the services and studios. When nothing is announced, we show “~” with the usual gap between cinema, digital and subscription for that studio. We change it as soon as a real date appears.</span>', 22, extra='flex: 1')}
{card('<span style="font-size: 17px; font-weight: 800">Never miss a release</span><span style="font-size: 14px; color: #FFD5C7">Follow a title and get one message when it lands — on email or Telegram.</span>' + btn('Connect Telegram', 'pri', 44), 22, '#2A150D', '#5A2A17', extra='flex: 1')}</section>'''
OUT['Releases'] = ('Release tracker', page('Coming to streaming in Türkiye — release tracker', rel, active='New &amp; leaving'), 1440)

# ---------- D. AI search ----------
ai_res = [('robot', 'Same story feel: a robot learns to care. Rated 7+.', 'Prime'), ('elemental', 'Warm, funny, about family. Turkish dub on Disney+.', 'Disney'),
          ('luca', 'Gentle adventure, no scary scenes. 1h 35m.', 'Disney'), ('panda', 'Lots of action but safe for 7+. All parts dubbed.', 'Netflix')]
aiH = ''.join(f'<article style="display: flex; gap: 14px; padding: 12px; border-radius: 16px; background: #121217; border: 1px solid #1E1E26"><img src="{B(P[k])}" alt="{T[k]}" style="width: 84px; height: 126px; object-fit: cover; border-radius: 10px"><div style="flex: 1; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 17px; font-weight: 800">{T[k]}</span><span style="font-size: 13px; color: #A1A1AD">{Y[k]} · {badge("türkçe dublaj", "dub")}</span><span style="font-size: 13px; line-height: 1.45; color: #D4D4DC"><b style="color: #A78BFA">Why:</b> {w}</span><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; margin-top: auto">{svc(s, 22, 5)}{SVN.get(s, s)}<a href="#" style="margin-left: auto; color: #FF5A1F">Watch ↗</a></span></div></article>' for k, w, s in ai_res)
ai = f'''
<section style="display: flex; flex-direction: column; gap: 14px; align-items: center; padding: 34px; border-radius: 28px; background: radial-gradient(100% 120% at 50% 0%, #241A3D, #121217 60%); border: 1px solid #2E2546">
<span style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; color: #C4B5FD">✦ ASK KINVO</span>
<div style="width: 100%; max-width: 900px; display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 20px; border-radius: 20px; background: #0A0A0D; border: 1px solid #A78BFA"><span style="flex: 1; font-size: 18px; font-weight: 700">Something like The Wild Robot for my 7-year-old, in Turkish, on Netflix or Disney+</span>{btn('Search', 'pri', 46)}</div>
<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center"><span style="font-size: 13px; color: #A1A1AD; align-self: center">I understood:</span>{"".join(chip(x + ' ×', True, 32) for x in ['Animation', 'Age 7+', 'Türkçe dublaj', 'Netflix, Disney+', 'Like: The Wild Robot'])}</div>
</section>
<section style="display: flex; gap: 24px; align-items: flex-start">
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px">
<div style="padding: 16px 18px; border-radius: 16px; background: #15151B; font-size: 15px; line-height: 1.55"><b>12 movies match.</b> 3 are on your services right now. The Wild Robot itself is on Prime Video — not on Netflix or Disney+ — so we added close matches you can watch tonight.</div>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">{aiH}</div>
<div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #6E6E7A"><span>Results come only from our checked catalog. AI picks the order and writes the “why”.</span><span style="margin-left: auto">Helpful?</span>{chip('👍', False, 32)}{chip('👎', False, 32)}</div></div>
<aside style="flex: 0 0 320px; display: flex; flex-direction: column; gap: 14px">
{card('<span style="font-size: 15px; font-weight: 800">Try asking</span>' + ''.join(f'<a href="#" style="font-size: 14px; color: #D4D4DC; line-height: 1.4">“{x}”</a>' for x in ['James Cameron movies I can watch tonight', 'Anime with Turkish dub under 12 episodes', 'What’s leaving my services this week?', 'Best family movie for Friday, under 100 min']))}
{card('<span style="font-size: 15px; font-weight: 800">Refine</span><div style="display: flex; flex-wrap: wrap; gap: 6px">' + ''.join(chip(x, False, 32) for x in ['Shorter', 'Newer', 'Funnier', 'No sad endings', 'Include rentals']) + '</div>')}
</aside></section>'''
OUT['AISearch'] = ('AI search — Ask sofo', page('Ask sofo — AI search', ai, active=''), 1440)

# ---------- E. Search states ----------
def panel(label, inner):
    return f'<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 12px"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">{label}</span>{inner}</div>'
def sbox(txt, ph=False):
    c = '#6E6E7A' if ph else '#FFFFFF'
    return f'<div style="display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 14px; border-radius: 16px; background: #15151B; border: 1px solid #FF5A1F">{SEARCH_ICON}<span style="flex: 1; font-size: 16px; font-weight: 700; color: {c}">{txt}</span></div>'
def drop(inner):
    return f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 10px; border-radius: 18px; background: #15151B; border: 1px solid #26262F; box-shadow: 0 20px 50px rgba(0,0,0,0.5)">{inner}</div>'
lab = lambda t: f'<span style="font-size: 11px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em; padding: 8px 8px 2px">{t}</span>'
row = lambda ic, t, m='': f'<div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px"><span style="width: 28px; color: #6E6E7A; text-align: center">{ic}</span><span style="flex: 1; font-size: 14px; font-weight: 700">{t}</span><span style="font-size: 12px; color: #6E6E7A">{m}</span></div>'
prow = lambda k, t, m, on=False: f'<div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px; background: {"#1C1C24" if on else "transparent"}"><img src="{B(P[k])}" alt="" style="width: 32px; height: 48px; object-fit: cover; border-radius: 5px"><span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 14px; font-weight: 800">{t}</span><span style="font-size: 12px; color: #A1A1AD">{m}</span></span>{badge("TR dub", "dub", 10)}</div>'
sk = lambda w, h=12: f'<span style="display: block; width: {w}; height: {h}px; border-radius: 6px; background: linear-gradient(90deg, #1C1C24, #26262F, #1C1C24)"></span>'
p1 = panel('1 · FOCUS, NOTHING TYPED', sbox('Search movies, series, people…', True) + drop(lab('RECENT') + row('↺', 'arcane') + row('↺', 'kung fu panda 4') + lab('TRENDING IN TÜRKİYE') + row('↗', 'demon slayer infinity castle', '#1') + row('↗', 'vahşi robot', '#2') + row('↗', 'netflix kasım 2026', '#3') + lab('TRY') + row('✦', 'Ask: “anime with Turkish dub”')))
p2 = panel('2 · TYPING — INSTANT RESULTS', sbox('kung fu') + drop(prow('panda', 'Kung Fu Panda 4', 'Movie · 2024 · Netflix', True) + row('▤', 'Kung Fu Panda — watch order', 'Franchise · 4 movies') + row('◉', 'Jack Black', 'Person · Po') + row('⌕', 'Search all results for “kung fu”', '↵')))
p3 = panel('3 · TYPO — DID YOU MEAN', sbox('arcan 2 sezon') + drop('<div style="padding: 10px; font-size: 14px">Did you mean <a href="#" style="color: #FF5A1F; font-weight: 800">Arcane — Season 2</a>?</div>' + prow('arcane', 'Arcane — Season 2', 'Season · 2024 · Netflix') + prow('arcane', 'Arcane', 'Series · 2021–2024 · Netflix')))
p4 = panel('4 · LOADING → NO RESULTS', sbox('xyzzz film') + drop(''.join(f'<div style="display: flex; gap: 10px; padding: 8px"><span style="width: 32px; height: 48px; border-radius: 5px; background: #1C1C24"></span><span style="flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center">{sk("70%")}{sk("40%", 10)}</span></div>' for _ in range(2))) +
            drop('<div style="padding: 12px; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 15px; font-weight: 800">No title called “xyzzz film”</span><span style="font-size: 13px; color: #A1A1AD">Check the spelling, try the original title, or ask us to add it.</span>' + btn('Request this title', 'sec', 40) + '</div>'))
states = f'<section style="display: flex; gap: 20px; align-items: flex-start">{p1}{p2}{p3}{p4}</section>'
states += f'<section style="display: flex; gap: 20px; align-items: flex-start">{panel("KEYBOARD", card("<span style=\'font-size: 14px; color: #D4D4DC; line-height: 1.9\'>/ — open search · ↑ ↓ — move · ↵ — open · Esc — close · Tab — switch Audio filter</span>", 16))}{panel("RULES", card("<span style=\'font-size: 14px; color: #D4D4DC; line-height: 1.7\'>Results in &lt;150 ms · Turkish letters ignored (vahsi = vahşi) · local and original titles both match · a franchise or person row appears when the query matches one</span>", 16))}</section>'
OUT['SearchStates'] = ('Search states', page('Search states — sofo', f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 28px"><span style="font-size: 28px; font-weight: 800">Search — all states</span>{states}</div>', chrome=False), 1440)

# ---------- F. Modals & overlays ----------
def modal(title, inner, w=420):
    return f'<div style="flex: 0 0 {w}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: 24px; background: #15151B; border: 1px solid #26262F; box-shadow: 0 30px 80px rgba(0,0,0,0.6)"><div style="display: flex; align-items: center"><span style="font-size: 20px; font-weight: 800">{title}</span><span style="margin-left: auto; width: 32px; height: 32px; border-radius: 99px; background: #1C1C24; display: flex; align-items: center; justify-content: center; color: #A1A1AD">×</span></div>{inner}</div>'
def cbx(t, on):
    box = '<span style="width: 20px; height: 20px; border-radius: 6px; background: #FF5A1F; color: #0A0A0D; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800">✓</span>' if on else '<span style="width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid #3A3A45"></span>'
    return f'<label style="display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700; padding: 10px 12px; border-radius: 12px; background: {"#2A150D" if on else "#0F0F14"}">{box}{t}</label>'
notify = modal('Notify me', f'<div style="display: flex; gap: 12px; align-items: center"><img src="{B(P["jjk"])}" alt="" style="width: 48px; height: 72px; object-fit: cover; border-radius: 8px"><span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 16px; font-weight: 800">Jujutsu Kaisen</span><span style="font-size: 13px; color: #A1A1AD">Season 3 · Netflix · TR subtitles</span></span></div>' +
               cbx('When the Turkish dub arrives', True) + cbx('When a new episode is out', True) + cbx('If it leaves Netflix', False) + cbx('If it gets cheaper elsewhere', False) +
               '<span style="font-size: 13px; font-weight: 800">Send to</span><div style="display: flex; gap: 8px">' + chip('Telegram', True, 34) + chip('Email', False, 34) + chip('Browser', False, 34) + '</div>' + btn('Save alerts', 'pri', 48))
signin = modal('Save your list', '<span style="font-size: 14px; color: #A1A1AD; line-height: 1.5">Sign in to keep your list, services and alerts on every device. No password needed.</span>' +
               '<a href="#" style="height: 48px; border-radius: 14px; background: #FFFFFF; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800">Continue with Google</a>' +
               '<a href="#" style="height: 48px; border-radius: 14px; background: #1C1C24; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800">Continue with Apple</a>' +
               '<a href="#" style="height: 48px; border-radius: 14px; background: #229ED9; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800">Continue with Telegram</a>' +
               '<div style="display: flex; gap: 8px"><input aria-label="Email" placeholder="you@email.com" style="flex: 1; height: 48px; border-radius: 14px; border: 1px solid #26262F; background: #0A0A0D; color: #FFFFFF; padding: 0 14px; font-family: inherit; font-size: 14px">' + btn('Send link', 'sec', 48) + '</div>' +
               '<span style="font-size: 11px; color: #6E6E7A; line-height: 1.5">By continuing you agree to the Terms and Privacy Policy (KVKK).</span>', 400)
report = modal('Something wrong?', '<span style="font-size: 14px; color: #A1A1AD">The Wild Robot · Prime Video · Türkiye</span>' + ''.join(cbx(x, i == 1) for i, x in enumerate(['It’s not on this service anymore', 'Turkish dub / subtitles are wrong', 'Price is wrong', 'Link doesn’t open the title'])) +
               '<textarea aria-label="Details" placeholder="Tell us more (optional)" style="height: 80px; border-radius: 14px; border: 1px solid #26262F; background: #0A0A0D; color: #FFFFFF; padding: 12px; font-family: inherit; font-size: 14px; resize: none"></textarea>' + btn('Send report', 'pri', 46) +
               '<span style="font-size: 12px; color: #6E6E7A">We re-check reported titles within 24 hours.</span>', 400)
eds = ''.join(f'<div style="display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; background: {"#1C1C24" if on else "transparent"}"><span style="width: 30px; height: 30px; border-radius: 99px; background: #26262F; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800">{c}</span><span style="flex: 1; font-size: 14px; font-weight: 700">{n}</span>{"<span style=\"color: #FF5A1F; font-weight: 800\">✓</span>" if on else ""}</div>' for c, n, on in [('TR', 'Türkiye', True), ('US', 'United States', False), ('DE', 'Deutschland', False), ('FR', 'France', False), ('UZ', 'Oʻzbekiston', False)])
switch = f'<div style="flex: 0 0 300px; display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 18px; background: #15151B; border: 1px solid #26262F; box-shadow: 0 30px 80px rgba(0,0,0,0.6)"><span style="font-size: 11px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em; padding: 4px 8px">COUNTRY — CATALOG &amp; PRICES</span>{eds}<span style="font-size: 11px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em; padding: 10px 8px 4px">INTERFACE LANGUAGE</span><div style="display: flex; flex-wrap: wrap; gap: 6px; padding: 0 6px">{chip("English", True, 32)}{chip("Türkçe", False, 32)}{chip("Español", False, 32)}{chip("Русский", False, 32)}{chip("العربية", False, 32)}</div></div>'
cookie = '<div style="display: flex; align-items: center; gap: 18px; padding: 18px 22px; border-radius: 20px; background: #15151B; border: 1px solid #26262F; box-shadow: 0 -10px 40px rgba(0,0,0,0.4)"><span style="font-size: 22px">🍪</span><span style="flex: 1; font-size: 14px; line-height: 1.5; color: #D4D4DC">We use essential cookies to remember your country, language and services. With your OK we also measure which pages help people (KVKK / GDPR). <a href="#" style="color: #A1A1AD; text-decoration: underline">Details</a></span>' + btn('Only essential', 'ghost', 42) + btn('Accept all', 'pri', 42) + '</div>'
mod = f'''<div style="padding: 40px; display: flex; flex-direction: column; gap: 28px; background: radial-gradient(80% 60% at 50% 0%, #15151B, #0A0A0D)">
<span style="font-size: 28px; font-weight: 800">Modals &amp; overlays</span>
<div style="display: flex; gap: 24px; align-items: flex-start">{notify}{signin}{report}</div>
<div style="display: flex; gap: 24px; align-items: flex-start"><div style="display: flex; flex-direction: column; gap: 10px"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">HEADER · “TÜRKİYE · EN” MENU</span>{switch}</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">FIRST VISIT · COOKIE / KVKK BANNER (bottom)</span>{cookie}
<span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em; margin-top: 10px">TOAST</span><div style="align-self: flex-start; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: #2A150D; border: 1px solid #5A2A17; font-size: 14px; font-weight: 700">✓ Added to My list <a href="#" style="color: #FF5A1F">Undo</a></div></div></div></div>'''
OUT['Modals'] = ('Modals & overlays', page('Modals — sofo', mod, chrome=False), 1440)

# ---------- G. Loading / error / empty ----------
skel = f'''<div style="display: flex; gap: 20px">{'<span style="width: 200px; height: 300px; border-radius: 16px; background: linear-gradient(135deg, #1C1C24, #22222B)"></span>'}<div style="flex: 1; display: flex; flex-direction: column; gap: 14px; padding-top: 10px">{sk("60%", 36)}{sk("40%", 14)}<div style="display: flex; gap: 6px">{sk("90px", 22)}{sk("90px", 22)}</div>{sk("90%", 12)}{sk("80%", 12)}{sk("200px", 44)}</div></div>'''
down = card(f'<span style="font-size: 15px; font-weight: 800">Where to watch in Türkiye</span>{offer("Prime", "Subscription · TR audio ✓", "Watch ↗", True)}<div style="display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: 12px; background: #1A1408; border: 1px solid #3A2A0A"><span style="color: #FBBF24; font-weight: 800">!</span><span style="font-size: 13px; line-height: 1.5; color: #F5E6C8">Netflix didn’t answer our check today. Showing what we saw 6 hours ago — it may have changed.</span></div>', 18)
unk = card(f'<span style="font-size: 15px; font-weight: 800">Audio &amp; subtitles</span><div style="display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 12px; background: #0F0F14"><span style="flex: 1; font-size: 14px; font-weight: 700">Türkçe dublaj</span><span style="font-size: 13px; color: #A1A1AD">Not confirmed by the service</span></div><span style="font-size: 12px; color: #6E6E7A; line-height: 1.5">We never guess. If you know, <a href="#" style="color: #A1A1AD; text-decoration: underline">tell us</a> and we’ll check.</span>', 18)
empty = card(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; text-align: center"><span style="font-size: 44px">♡</span><span style="font-size: 20px; font-weight: 800">Your list is empty</span><span style="font-size: 14px; color: #A1A1AD; max-width: 300px">Tap + on any title. We’ll tell you when it’s on your services or gets Turkish dub.</span>{btn("Browse popular titles", "pri", 44)}</div>', 18)
offline = card(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; text-align: center"><span style="font-size: 44px; color: #3A3A45; font-weight: 800">500</span><span style="font-size: 20px; font-weight: 800">Something broke on our side</span><span style="font-size: 14px; color: #A1A1AD; max-width: 300px">It’s not you. Try again in a minute — your list and settings are safe.</span>{btn("Try again", "sec", 44)}</div>', 18)
lst = f'''<div style="padding: 40px; display: flex; flex-direction: column; gap: 28px"><span style="font-size: 28px; font-weight: 800">Loading, error and empty states</span>
<div style="display: flex; gap: 24px; align-items: flex-start"><div style="flex: 1.4; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">TITLE PAGE · LOADING (server renders text first, skeleton only for live prices)</span>{card(skel, 22)}</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">SERVICE CHECK FAILED</span>{down}</div></div>
<div style="display: flex; gap: 24px; align-items: flex-start">{"".join(f'<div style="flex: 1; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 12px; font-weight: 800; color: #6E6E7A; letter-spacing: 0.06em">{l}</span>{c}</div>' for l, c in [("LANGUAGE NOT CONFIRMED", unk), ("EMPTY MY LIST", empty), ("SERVER ERROR", offline)])}</div></div>'''
OUT['States'] = ('Loading / error / empty states', page('States — sofo', lst, chrome=False), 1440)

# ---------- Mobile ----------
def mshell(inner):
    return f'<div style="width: 390px; display: flex; flex-direction: column; gap: 16px">{inner}</div>'
mm = mshell(f'''<header style="padding: 12px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #18181E"><span style="font-size: 20px; font-weight: 800">←</span>{logo(20)}<span style="flex: 1"></span><span style="font-size: 18px">⌕</span></header>
<div style="margin: 0 16px; padding: 16px; border-radius: 20px; background: linear-gradient(135deg, #2A150D, #121217); border: 1px solid #5A2A17; display: flex; flex-direction: column; gap: 10px">
<span style="font-size: 11px; font-weight: 800; color: #FF5A1F; letter-spacing: 0.08em">THE SHORT ANSWER</span>
<span style="font-size: 19px; line-height: 1.3; font-weight: 800">Yes — on <span style="color: #FF5A1F">Prime Video</span> in Türkiye, with Turkish dub.</span>
<span style="font-size: 12px; color: #A1A1AD">Cheapest: included in Prime · or rent ₺69 · checked 09:40</span>
<a href="#" style="height: 48px; border-radius: 14px; background: #FF5A1F; color: #0A0A0D; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 800">{svc("Prime", 24, 6)}Watch on Prime Video ↗</a></div>
<div style="display: flex; gap: 14px; padding: 0 16px"><img src="{B(P["robot"])}" alt="" style="width: 110px; height: 165px; object-fit: cover; border-radius: 12px"><div style="flex: 1; display: flex; flex-direction: column; gap: 8px"><span style="font-size: 26px; line-height: 1.05; font-weight: 800; letter-spacing: -0.02em">The Wild Robot</span><span style="font-size: 12px; color: #A1A1AD">2024 · 1h 42m · 7+ · <span style="color: #FF5A1F; font-weight: 800">TMDB 8.3</span></span><span style="display: flex; flex-wrap: wrap; gap: 4px">{badge("türkçe dublaj", "dub", 10)}{badge("altyazı", "sub", 10)}</span><span style="display: flex; gap: 6px; margin-top: auto">{chip("▶ Trailer", False, 32)}{chip("+ List", False, 32)}</span></div></div>
<section style="padding: 0 16px; display: flex; flex-direction: column; gap: 8px"><span style="font-size: 17px; font-weight: 800">All options</span>{offer("Prime", "Subscription · TR audio ✓", "Watch ↗", True)}{offer("Apple TV", "Rent ₺69 · TR audio ✓", "Rent ↗")}{offer("YouTube", "Rent ₺79 · TR subs only", "Rent ↗")}</section>
<section style="padding: 0 16px; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 17px; font-weight: 800">History in Türkiye</span>
{"".join(f'<div style="display: flex; gap: 10px; align-items: center"><span style="width: 10px; height: 10px; border-radius: 99px; background: {c}"></span><span style="flex: 1; font-size: 13px; font-weight: 700">{t}</span><span style="font-size: 12px; color: #6E6E7A">{d}</span></div>' for c, t, d in [("#A78BFA", "Rent price dropped to ₺69", "Nov 2026"), ("#FBBF24", "Left Netflix", "Oct 2025"), ("#FF5A1F", "Added to Prime Video", "Apr 2025"), ("#6E6E7A", "Digital release", "Dec 2024")])}
<a href="#" style="height: 44px; border-radius: 12px; background: #15151B; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">Alert me if it leaves Prime</a></section>
<div style="height: 8px"></div>''')
OUT['MobileMovieF'] = ('Phone — Movie (answer + history)', page('Phone — The Wild Robot', mm, 390, 1400, chrome=False), 390)

fsheet = f'''<div style="position: relative; width: 390px; height: 844px; overflow: hidden">
<div style="position: absolute; inset: 0; padding: 60px 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; opacity: 0.5">{"".join(f'<img src="{B(P[k])}" alt="" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 8px">' for k in ['robot', 'io2', 'moana', 'panda', 'spider', 'mario', 'elemental', 'encanto', 'soul'])}</div>
<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6)"></div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 640px; border-radius: 24px 24px 0 0; background: #15151B; display: flex; flex-direction: column">
<div style="padding: 10px 18px 0; display: flex; flex-direction: column; gap: 14px; flex: 1"><span style="align-self: center; width: 40px; height: 4px; border-radius: 99px; background: #3A3A45"></span>
<div style="display: flex; align-items: center"><span style="font-size: 20px; font-weight: 800">Filters</span><a href="#" style="margin-left: auto; font-size: 14px; color: #A1A1AD; font-weight: 700">Reset</a></div>
<span style="font-size: 12px; font-weight: 800; color: #A1A1AD; letter-spacing: 0.05em">AUDIO</span><div style="display: flex; flex-wrap: wrap; gap: 6px">{chip("Türkçe dublaj", True, 34)}{chip("Türkçe altyazı", False, 34)}{chip("Original", False, 34)}</div>
<span style="font-size: 12px; font-weight: 800; color: #A1A1AD; letter-spacing: 0.05em">MY SERVICES</span><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">{"".join(f'<span style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border-radius: 12px; border: 1px solid {"#FF5A1F" if s in ("Netflix", "Disney") else "#26262F"}">{svc(s, 34, 9)}<span style="font-size: 10px; font-weight: 700">{SVN.get(s, s)}</span></span>' for s in ["Netflix", "Disney", "Prime", "HBO Max", "tabii", "TOD", "Exxen", "Gain"])}</div>
<span style="font-size: 12px; font-weight: 800; color: #A1A1AD; letter-spacing: 0.05em">PRICE</span><div style="display: flex; flex-wrap: wrap; gap: 6px">{chip("Subscription", True, 34)}{chip("Free", False, 34)}{chip("Rent", False, 34)}{chip("Buy", False, 34)}</div>
<span style="font-size: 12px; font-weight: 800; color: #A1A1AD; letter-spacing: 0.05em">GENRE</span><div style="display: flex; flex-wrap: wrap; gap: 6px">{chip("Animation", True, 34)}{chip("Family", False, 34)}{chip("Comedy", False, 34)}{chip("+ 9", False, 34)}</div></div>
<div style="padding: 14px 18px 26px; border-top: 1px solid #26262F"><a href="#" style="height: 52px; border-radius: 14px; background: #FF5A1F; color: #0A0A0D; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800">Show 612 movies</a></div></div></div>'''
OUT['MobileFiltersF'] = ('Phone — Filters sheet', page('Phone — filters', fsheet, 390, 844, chrome=False), 390)

ml_items = [('arcane', 'On Netflix · TR dub ✓', 'ok'), ('encanto', 'Leaves Disney+ in 5 days', 'leave'), ('spirited', 'Free with ads on tabii', 'free'), ('aot', 'Not in Türkiye yet', 'n'), ('robot', 'On Prime Video · TR dub ✓', 'ok')]
mlH = ''.join(f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 14px; background: #121217"><img src="{B(P[k])}" alt="" style="width: 50px; height: 75px; object-fit: cover; border-radius: 8px"><span style="flex: 1; display: flex; flex-direction: column; gap: 5px"><span style="font-size: 15px; font-weight: 800">{T[k]}</span>{badge(s, kk, 10)}</span><span style="font-size: 18px; color: #6E6E7A">›</span></div>' for k, s, kk in ml_items)
mlist = mshell(f'''<header style="padding: 14px 16px 0; display: flex; align-items: center"><span style="font-size: 28px; font-weight: 800">My list</span><span style="margin-left: auto; font-size: 13px; font-weight: 700; color: #A1A1AD">Edit</span></header>
<div style="display: flex; gap: 6px; padding: 0 16px">{chip("Watchlist 12", True, 32)}{chip("Alerts 4", False, 32)}{chip("Watched", False, 32)}</div>
<div style="margin: 0 16px; padding: 14px; border-radius: 16px; background: #2A150D; font-size: 14px; font-weight: 700; color: #FFD5C7">5 titles can be watched tonight on your services.</div>
<div style="display: flex; flex-direction: column; gap: 8px; padding: 0 16px">{mlH}</div>
<div style="margin: 0 16px; padding: 16px; border-radius: 16px; background: #15151B; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 15px; font-weight: 800">Get alerts on Telegram</span><span style="font-size: 13px; color: #A1A1AD">New Turkish dubs and titles leaving your services.</span><a href="#" style="height: 44px; border-radius: 12px; background: #229ED9; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800">Connect Telegram</a></div>
<nav style="display: flex; justify-content: space-around; padding: 10px 0 22px; border-top: 1px solid #18181E">{"".join(f'<a href="#" style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; font-weight: 700; color: {"#FF5A1F" if t == "My list" else "#A1A1AD"}"><span style="font-size: 20px; line-height: 1">{i}</span>{t}</a>' for t, i in [("Home", "⌂"), ("Search", "⌕"), ("New", "◷"), ("My list", "♡")])}</nav>''')
OUT['MobileListF'] = ('Phone — My list', page('Phone — My list', mlist, 390, 1000, chrome=False), 390)
