# Shared building blocks for sofo .dc.html boards (final style)
B = lambda i: '/_blob/' + i
P = dict(robot='cb4f087928b468549d841e1ee3e42661', arcane='08d298c5c43e27d20a009e1485cb9b3b', io2='79f8fee8ed49eaf30382120f6b21d16f',
         demon='8e2de4d5af09254f1969c0aac5f7ff72', moana='1e670cb28388c895319bac5d4cfbc2c3', panda='adb806acfa10e9988ff559ed874dc96e',
         coco='5ded58698603822d03ccd70fd08231b5', jjk='e622889c112ac94528cebedd9f389f09', spirited='c7d07cd502e08e290cd41761b2472cef',
         encanto='2e0943299c347febf750aa19360d1513', aot='93cf3e1c3aaff5d0d4a1608218ae34b7', mario='47f8a7c4cd8d8c24bf5128dfbdba945e',
         spider='03b2f15bf88d978897f8069cf919e46b', elemental='d72425766e887bab76cad923ba40aba6', soul='33e8d6e312d2c2a28eb7e6c8b92bd882',
         luca='8a0c424f5b0aaaf2e47ebfabe38e12cd', onepiece='b696d2769e7c1c80631606bc89386aec', rick='39beccc02edc0ee830f583d6e867930b',
         simpsons='fa46bb4c0cfc8f046cc08899da9bc5aa')
BD = dict(robot='f1bae5f68de0a4210ef79a94e898eb6b', arcane='eccffb3d20c5131d98f95617ef8f8b32', spider='1a1c9590170189ced4c2504e9d847887',
          panda='d5a4b5eb4214f38a4ed921decc62a2a3', spirited='2773e2d8f4575e5e9ed94235960a3900', encanto='1179309321f9ffa02b539f4c31ff5bd0',
          coco='4ca3d3239df179d68432e3dd05cd8583', io2='639102cbae922345a6f75cfad5711f2f', demon='c49a556dcc34438b5a142c8f6c07aa21')
LOGO = dict(Netflix='d2df8e6b31dc8a17d738cdcbe082abae', Prime='996ff9952cc48dec9ccd2e076c38e147', Disney='73cc46ffcd16b9ca2ab5420acf984a61')
T = dict(robot='The Wild Robot', arcane='Arcane', io2='Inside Out 2', demon='Demon Slayer', moana='Moana 2', panda='Kung Fu Panda 4', coco='Coco',
         jjk='Jujutsu Kaisen', spirited='Spirited Away', encanto='Encanto', aot='Attack on Titan', mario='The Super Mario Bros. Movie',
         spider='Spider-Man: Across the Spider-Verse', elemental='Elemental', soul='Soul', luca='Luca', onepiece='One Piece', rick='Rick and Morty',
         simpsons='The Simpsons')
Y = dict(robot='2024', arcane='2021', io2='2024', demon='2019', moana='2024', panda='2024', coco='2017', jjk='2020', spirited='2001', encanto='2021',
         aot='2013', mario='2023', spider='2023', elemental='2023', soul='2020', luca='2021', onepiece='1999', rick='2013', simpsons='1989')
SV = dict(robot='Prime', arcane='Netflix', io2='Disney', demon='Netflix', moana='Disney', panda='Netflix', coco='Disney', jjk='Netflix', spirited='HBO Max',
          encanto='Disney', aot='Prime', mario='Netflix', spider='Netflix', elemental='Disney', soul='Disney', luca='Disney', onepiece='Netflix',
          rick='HBO Max', simpsons='Disney')
SVC_FAKE = {'HBO Max': ('#4A1FB8', '#FFFFFF', 'max'), 'TOD': ('#5B0FA8', '#FFFFFF', 'TOD'), 'tabii': ('#0E7C66', '#FFFFFF', 'tabii'),
            'Exxen': ('#FFC21A', '#0A0A0D', 'exx'), 'Gain': ('#FF4D1A', '#FFFFFF', 'gain'), 'Apple TV': ('#E5E7EB', '#0A0A0D', 'tv'),
            'YouTube': ('#E5E7EB', '#C4302B', '▶')}
SVN = {'Prime': 'Prime Video', 'Disney': 'Disney+'}

FONT = "'Manrope', system-ui, sans-serif"


def svc(name, size=28, r=7):
    if name in LOGO:
        return f'<img src="{B(LOGO[name])}" alt="{SVN.get(name, name)}" style="width: {size}px; height: {size}px; border-radius: {r}px; flex: 0 0 {size}px">'
    bg, fg, t = SVC_FAKE[name]
    return (f'<span style="width: {size}px; height: {size}px; flex: 0 0 {size}px; border-radius: {r}px; background: {bg}; color: {fg}; '
            f'display: inline-flex; align-items: center; justify-content: center; font-size: {max(9, size // 3)}px; font-weight: 800; letter-spacing: -0.02em">{t}</span>')


BADGE = {'dub': 'background: #3B82F6; color: #FFFFFF', 'sub': 'background: #E5E7EB; color: #0A0A0D', 'free': 'background: #A78BFA; color: #0A0A0D',
         'leave': 'background: #FBBF24; color: #0A0A0D', 'new': 'background: #FF5A1F; color: #0A0A0D', 'n': 'background: #26262F; color: #FFFFFF',
         'ok': 'background: #123323; color: #4ADE80'}


def badge(t, k='n', fs=11):
    return f'<span style="font-size: {fs}px; font-weight: 800; padding: 3px 8px; border-radius: 999px; white-space: nowrap; width: max-content; {BADGE[k]}">{t}</span>'


def chip(t, on=False, h=36):
    st = 'background: #FFFFFF; color: #0A0A0D; border: 1px solid #FFFFFF' if on else 'background: #15151B; color: #D4D4DC; border: 1px solid #26262F'
    return f'<button type="button" style="height: {h}px; padding: 0 14px; border-radius: 999px; font-family: inherit; font-size: 13px; font-weight: 700; {st}">{t}</button>'


def btn(t, kind='sec', h=44, href='#'):
    st = {'pri': 'background: #FF5A1F; color: #0A0A0D', 'sec': 'background: #1C1C24; color: #FFFFFF', 'ghost': 'background: transparent; color: #FFFFFF; border: 1px solid #2E2E38'}[kind]
    return f'<a href="{href}" style="height: {h}px; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; border-radius: 12px; font-size: 14px; font-weight: 800; white-space: nowrap; {st}">{t}</a>'


def poster(k, meta=None, badges=(('türkçe dublaj', 'dub'),), show_svc=True, title=None, rank=None):
    bd = ''.join(badge(t, kk) for t, kk in badges)
    meta = meta if meta is not None else f'{Y[k]} · {SVN.get(SV[k], SV[k])}'
    rk = f'<span style="position: absolute; left: -6px; bottom: -14px; font-size: 76px; line-height: 1; font-weight: 800; color: rgba(10,10,13,0.85); -webkit-text-stroke: 2px #C9C9D1">{rank}</span>' if rank else ''
    sv = f'<span style="position: absolute; right: 8px; bottom: 8px">{svc(SV[k], 24, 6)}</span>' if show_svc else ''
    return (f'<a href="#" style="display: flex; flex-direction: column; gap: 8px; min-width: 0">'
            f'<span style="position: relative; display: block; aspect-ratio: 2 / 3; border-radius: 12px; overflow: hidden; background: #15151B">'
            f'<img src="{B(P[k])}" alt="{T[k]}" style="width: 100%; height: 100%; object-fit: cover">'
            f'<span style="position: absolute; left: 8px; top: 8px; display: flex; flex-wrap: wrap; gap: 4px">{bd}</span>{sv}{rk}</span>'
            f'<span style="font-size: 14px; font-weight: 800; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{title or T[k]}</span>'
            f'<span style="font-size: 12px; color: #A1A1AD; margin-top: -4px">{meta}</span></a>')


def grid(items, cols=6, gap=16):
    return f'<div style="display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); gap: 22px {gap}px">{"".join(items)}</div>'


def h2(t, sub='', link='See all →', size=24):
    s = f'<span style="font-size: 14px; color: #A1A1AD; font-weight: 600">{sub}</span>' if sub else ''
    l = f'<a href="#" style="margin-left: auto; font-size: 14px; font-weight: 700; color: #A1A1AD">{link}</a>' if link else ''
    return f'<div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px"><h2 style="margin: 0; font-size: {size}px; font-weight: 800; letter-spacing: -0.02em">{t}</h2>{s}{l}</div>'


def section(inner, gap=16):
    return f'<section style="display: flex; flex-direction: column; gap: {gap}px">{inner}</section>'


def offer(name, d, cta, pri=False):
    st = 'background: #FF5A1F; color: #0A0A0D' if pri else 'background: #1C1C24; color: #FFFFFF'
    return (f'<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 10px; border-radius: 14px; background: #0F0F14">{svc(name, 36, 8)}'
            f'<span style="flex: 999 1 160px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; font-weight: 800">{SVN.get(name, name)}</span>'
            f'<span style="font-size: 12px; color: #A1A1AD">{d}</span></span>'
            f'<a href="#" style="height: 40px; padding: 0 14px; display: inline-flex; align-items: center; border-radius: 10px; font-size: 13px; font-weight: 800; {st}">{cta}</a></div>')


def initials(t, size=96, bg='#2A1D18', fg='#FF5A1F'):
    return (f'<span style="width: {size}px; height: {size}px; flex: 0 0 {size}px; border-radius: 999px; background: {bg}; color: {fg}; display: inline-flex; '
            f'align-items: center; justify-content: center; font-size: {size // 3}px; font-weight: 800">{t}</span>')


SEARCH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="#FF5A1F" stroke-width="2"></circle><path d="m20 20-3.5-3.5" stroke="#FF5A1F" stroke-width="2" stroke-linecap="round"></path></svg>'
BELL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"></path><path d="M10 20a2 2 0 0 0 4 0" stroke="#FFFFFF" stroke-width="1.8"></path></svg>'

NAV = ['Home', 'Movies', 'Series', 'Anime', 'Kids', 'New &amp; leaving', 'Trailers']
NAVH = {'Home': 'HomeFinal.dc.html', 'Movies': 'Browse.dc.html', 'Series': 'Browse.dc.html', 'Anime': 'Browse.dc.html', 'Kids': 'Kids.dc.html',
        'New &amp; leaving': 'NewLeaving.dc.html', 'Trailers': 'Trailers.dc.html'}


PLAY_EM = ('<span style="display: inline-flex; align-items: center; justify-content: center; width: 0.6em; height: 0.6em; border-radius: 99px; background: #FF5A1F; vertical-align: 0.02em; margin-left: 0.03em">'
           '<span style="width: 0; height: 0; border-top: 0.156em solid transparent; border-bottom: 0.156em solid transparent; border-left: 0.234em solid #0A0A0D; margin-left: 0.055em"></span></span>')
LOGO_EM = ('<span style="display: inline-flex; align-items: center; gap: 0.22em; font-family: Nunito, Manrope, sans-serif; font-weight: 900; letter-spacing: -0.03em"><span style="width: 1.12em; height: 1.12em; border-radius: 0.3em; background: #FF5A1F; display: inline-flex; align-items: center; justify-content: center; color: #FFFFFF; line-height: 1; padding-bottom: 0.08em; box-sizing: border-box">s</span>sofo</span>')


def logo(size=26, kids=False):
    k = '<span style="font-size: 12px; font-weight: 800; padding: 3px 7px; margin-left: 6px; border-radius: 999px; background: #FDE68A; color: #0A0A0D; vertical-align: middle; letter-spacing: 0">kids</span>' if kids else ''
    return f'<a href="HomeFinal.dc.html" style="font-size: {size}px; font-weight: 800; letter-spacing: -0.04em; white-space: nowrap">{LOGO_EM}{k}</a>'


def header(active='', q='', kids=False):
    nav = ''.join(f'<a href="{NAVH[n]}" style="font-size: 14px; font-weight: 700; white-space: nowrap; color: {"#FFFFFF" if n == active else "#A1A1AD"}">{n}</a>' for n in NAV)
    val = f' value="{q}"' if q else ''
    return f'''<header style="border-bottom: 1px solid #18181E; background: #0A0A0D">
<div style="max-width: 1360px; margin: 0 auto; padding: 12px 28px; box-sizing: border-box; display: flex; align-items: center; gap: 22px">
{logo(26, kids)}
<nav style="display: flex; gap: 18px">{nav}</nav>
<form role="search" style="flex: 1 1 300px; min-width: 0; display: flex; align-items: center; height: 44px; padding: 0 8px 0 14px; gap: 10px; border-radius: 12px; background: #15151B; border: 1px solid #26262F">{SEARCH_ICON}
<input type="search" aria-label="Search" placeholder="Search movies, series, people…"{val} style="flex-grow: 1; min-width: 0; height: 40px; border: 0; background: transparent; color: #FFFFFF; font-family: inherit; font-size: 14px; font-weight: 600">
<span style="font-size: 11px; font-weight: 800; color: #6E6E7A; padding: 3px 7px; border: 1px solid #26262F; border-radius: 6px">/</span></form>
<button type="button" style="height: 40px; padding: 0 12px; border-radius: 10px; border: 0; background: #15151B; color: #FFFFFF; font-family: inherit; font-size: 13px; font-weight: 700; white-space: nowrap">Türkiye · EN</button>
<a href="MyList.dc.html" style="position: relative; height: 40px; width: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: #15151B">{BELL}<span style="position: absolute; top: 6px; right: 7px; width: 8px; height: 8px; border-radius: 99px; background: #FF5A1F"></span></a>
<a href="MyList.dc.html" style="height: 40px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: 10px; background: #15151B; font-size: 13px; font-weight: 700; white-space: nowrap">My list</a>
</div></header>'''


def footer():
    cols = [('Browse', ['Movies', 'Series', 'Anime', 'Kids', 'New &amp; leaving', 'Trailers']),
            ('Languages', ['Türkçe dublaj', 'Türkçe altyazı', 'English audio', 'Español', 'Deutsch', 'All languages']),
            ('Services', ['Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'TOD', 'tabii', 'Exxen', 'Gain']),
            ('sofo', ['How it works', 'About', 'For press', 'Contact', 'Privacy', 'Terms'])]
    c = ''.join(f'<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 13px; font-weight: 800">{h}</span>' +
                ''.join(f'<a href="#" style="font-size: 13px; color: #A1A1AD">{x}</a>' for x in xs) + '</div>' for h, xs in cols)
    ed = ' · '.join(['Türkiye', 'United States', 'Deutschland', 'France', 'España', 'México', 'Brasil', 'Україна', 'Oʻzbekiston', 'العربية'])
    return f'''<footer style="border-top: 1px solid #18181E; margin-top: 24px">
<div style="max-width: 1360px; margin: 0 auto; padding: 36px 28px 44px; box-sizing: border-box; display: flex; flex-direction: column; gap: 26px">
<div style="display: flex; flex-wrap: wrap; gap: 40px"><div style="flex: 1 1 260px; display: flex; flex-direction: column; gap: 10px">{logo(24)}<span style="font-size: 13px; line-height: 1.5; color: #A1A1AD; max-width: 300px">Find where to watch any movie or series — in your language. sofo doesn't host video: every title plays on the official service.</span></div>{c}</div>
<div style="font-size: 12px; color: #6E6E7A; display: flex; flex-wrap: wrap; gap: 8px 20px; border-top: 1px solid #18181E; padding-top: 18px"><span>Editions: <a href="Editions.dc.html" style="color: #A1A1AD">{ed}</a></span><span style="margin-left: auto">sofo.tv · Metadata &amp; images: TMDB · availability checked daily</span></div>
</div></footer>'''


def page(title, body, w=1440, h=2000, active='', q='', kids=False, chrome=True, lang='en'):
    inner = (header(active, q, kids) + f'<main style="max-width: 1360px; margin: 0 auto; padding: 22px 28px 40px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px">{body}</main>' + footer()) if chrome else body
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;family=Nunito:wght@900&amp;display=swap">
<style>
body{{margin:0;background:#0A0A0D}}
a{{color:#FFFFFF;text-decoration:none}}a:hover{{color:#FFD5C7}}
button{{cursor:pointer}}
</style>
</helmet>
<div style="width: 100%; min-height: 100vh; background: #0A0A0D; color: #FFFFFF; font-family: {FONT}">
{inner}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
