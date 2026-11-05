import sys, json
sys.path.insert(0, '.')
import pages1, pages2
out = '../canvas/project/'
meta = {}
for mod in (pages1, pages2):
    for k, (title, html, w) in mod.OUT.items():
        open(out + k + '.dc.html', 'w').write(html)
        meta[k] = (title, w)
json.dump(meta, open('meta.json', 'w'), ensure_ascii=False)
print(len(meta), list(meta))
