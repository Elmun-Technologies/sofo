import sys, json
sys.path.insert(0, '.')
import pages3
meta = {}
for k, (title, html, w) in pages3.OUT.items():
    open('../canvas/project/' + k + '.dc.html', 'w').write(html); meta[k] = (title, w)
json.dump(meta, open('meta3.json', 'w'), ensure_ascii=False); print(list(meta))
