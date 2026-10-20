#!/usr/bin/env python3
"""Create a one-file offline edition from the source; standard app remains modular."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
css=(root/'styles.css').read_text()
model=json.loads((root/'data/forecast_model.json').read_text())
js=''
for file in ['simulator.js','optimizer.js','forecast.js','charts.js','twinView.js','twin3d.js','main.js']:
    s=(root/'src'/file).read_text()
    s=re.sub(r'^import .*?;\s*$', '',s,flags=re.M)
    s=re.sub(r'\bexport (?=(?:const|function|class))','',s)
    js+='\n'+s
html=html.replace('<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">','')
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>')
html=html.replace('<script type="module" src="src/main.js"></script>',
    '<script>window.__forecastModel='+json.dumps(model)+';</script><script>'+js+'</script>')
out=root/'HospitalFlow-AI-Standalone.html'
out.write_text(html)
print('Built',out,'size',len(html),'bytes')
