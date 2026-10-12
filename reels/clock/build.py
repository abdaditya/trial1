import glob
head='''<!doctype html>
<html><head><meta charset="utf-8">
<style>
@font-face { font-family: "Playfair"; src: url(fonts/PlayfairDisplay-800.woff2) format("woff2"); font-weight: 400 900; font-style: normal; }
@font-face { font-family: "Playfair"; src: url(fonts/PlayfairDisplay-800i.woff2) format("woff2"); font-weight: 400 900; font-style: italic; }
@font-face { font-family: "Inter"; src: url(fonts/Inter-700.woff2) format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Oswald"; src: url(fonts/Oswald-600.woff2) format("woff2"); font-weight: 200 700; }
html, body { margin: 0; background: #000; }
canvas { display: block; }
</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script src="lib/three.min.js"></script>
<script src="audio/words.js"></script>
<script>
'''
js="\n".join(open(f).read() for f in sorted(glob.glob("src/[0-9]*.js")) if not f.endswith("90_tail_part.js"))
open("index.html","w").write(head+js+"\n</script></body></html>\n")
print("built index.html", len(js.split("\n")),"lines")
