import sys, json
sys.path.insert(0, '.')
import pages4
for k, (t, html, w) in pages4.OUT.items():
    open('../canvas/project/' + k + '.dc.html', 'w').write(html)
print(list(pages4.OUT))
