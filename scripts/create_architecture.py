#!/usr/bin/env python3
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import fitz
root=Path(__file__).resolve().parent.parent
out=root/'docs/ARCHITECTURE.pdf'
W,H=1000,560
c=canvas.Canvas(str(out),pagesize=(W,H))
def color(s):return HexColor(s)
def rr(x,y,w,h,fill,stroke='#294158',rad=13):
 c.setFillColor(color(fill));c.setStrokeColor(color(stroke));c.setLineWidth(1)
 c.roundRect(x,y,w,h,rad,stroke=1,fill=1)
def tx(x,y,s,size=12,col='#e9f5ff',font='Helvetica'):
 c.setFont(font,size);c.setFillColor(color(col));c.drawString(x,y,s)
def arrow(x1,y1,x2,y2,col='#65cdb9'):
 c.setStrokeColor(color(col));c.setLineWidth(2.2);c.line(x1,y1,x2,y2)
 c.setFillColor(color(col));c.line(x2-9,y2+5,x2,y2);c.line(x2-9,y2-5,x2,y2)
def card(x,y,w,h,number,title,sub,items,accent):
 rr(x,y,w,h,'#142237')
 c.setFillColor(color(accent));c.roundRect(x+14,y+h-45,28,28,8,stroke=0,fill=1)
 tx(x+23,y+h-36,str(number),13,'#0b1b22','Helvetica-Bold')
 tx(x+14,y+h-72,title,14,'#f5fbff','Helvetica-Bold')
 tx(x+14,y+h-92,sub,9,'#89a8bf')
 for i,item in enumerate(items):
  yy=y+h-122-i*23
  c.setFillColor(color(accent));c.circle(x+18,yy+3,2.4,stroke=0,fill=1)
  tx(x+28,yy,item,10,'#c7d7e8')
c.setFillColor(color('#0b1422'));c.rect(0,0,W,H,stroke=0,fill=1)
# subtle background accents
c.setFillColor(color('#11243a'));c.circle(930,485,150,stroke=0,fill=1)
c.setFillColor(color('#0b1422'));c.circle(930,485,125,stroke=0,fill=1)
tx(42,514,'HOSPITALFLOW',18,'#f3f9ff','Helvetica-Bold');tx(185,514,'AI',18,'#5be0c6','Helvetica-Bold')
tx(42,482,'System architecture / local-first digital twin',13,'#9bb2c9')
tx(42,449,'SYNTHETIC DATA ONLY   |   NO LIVE CLINICAL SYSTEMS   |   REPRODUCIBLE FIXED SEED',9,'#5be0c6','Helvetica-Bold')
card(42,225,204,200,1,'Synthetic events','Exogenous inputs',[
 'Poisson arrivals', 'P1-P5 acuity stream','Hourly demand shape','Scenario multipliers'], '#7bbdfa')
card(278,225,220,200,2,'Stateful ED twin','Minute-step queue model',[
 'Triage and clinician queues','Staff and bed constraints','ICU / observation routing','Individual patient state'], '#5be0c6')
card(530,225,204,200,3,'Decision layer','Evaluation & forecasting',[
 'Wait / occupancy metrics','Scenario replay','Three-staff allocation search','Ridge arrival forecast'], '#aa94fa')
card(766,225,192,200,4,'Spatial visual twin','Canvas 3D + SVG 2D',[
 '3D rooms + 2D floor plan','Synced avatars / traces','Sliders / charts / what-ifs','Offline standalone HTML'], '#ffb773')
arrow(249,325,274,325);arrow(500,325,527,325);arrow(736,325,763,325)
# top feedback loop from browser to twin
c.setStrokeColor(color('#56867e'));c.setLineWidth(1.5)
c.setDash(6,5)
p=c.beginPath();p.moveTo(858,433);p.lineTo(858,457);p.lineTo(387,457);p.lineTo(387,429);c.drawPath(p)
c.setDash()
c.setFillColor(color('#5be0c6'));c.line(382,436,387,429);c.line(392,436,387,429)
tx(518,465,'REACTIVE CONTROL FEEDBACK',9,'#5be0c6','Helvetica-Bold')
# lower data blocks
rr(42,67,290,127,'#11273a')
tx(58,166,'MODEL TRAINING (OFFLINE)',11,'#80d8f5','Helvetica-Bold')
tx(58,144,'98 generated days -> chronological 77 / 21 split',10,'#bed1df')
tx(58,123,'Six Fourier / weekend features; ridge regression',10,'#bed1df')
tx(58,102,'Holdout MAE: 3.215 vs mean baseline: 4.138',10,'#bed1df')
tx(58,81,'Benchmark ONLY on toy synthetic demand',9,'#7796ad')
rr(354,67,290,127,'#11273a')
tx(370,166,'SIMULATION VALIDATION',11,'#8be7cb','Helvetica-Bold')
tx(370,144,'Seeded replay and population conservation',10,'#bed1df')
tx(370,123,'Enforced resource capacity / independent RNG',10,'#bed1df')
tx(370,102,'Search / timestamped journey tests',10,'#bed1df')
tx(370,81,'Clinical accuracy NOT established',9,'#7796ad')
rr(666,67,292,127,'#11273a')
tx(682,166,'SUBMISSION ARTIFACTS',11,'#edba89','Helvetica-Bold')
tx(682,144,'README + documented source + MIT license',10,'#bed1df')
tx(682,123,'Architecture PDF + presentation PPTX / PDF',10,'#bed1df')
tx(682,102,'Standalone HTML and demo recording guide',10,'#bed1df')
tx(682,81,'Team / video links supplied after upload',9,'#7796ad')
tx(42,26,'Operational education and research demonstration. Not validated for medical use.',10,'#67839a')
tx(855,26,'v3.0.0',10,'#67839a')
c.showPage();c.save()
pdf=fitz.open(str(out));p=pdf[0].get_pixmap(matrix=fitz.Matrix(1.8,1.8),alpha=False);p.save(str(root/'docs/architecture.png'))
print('Created',out)
