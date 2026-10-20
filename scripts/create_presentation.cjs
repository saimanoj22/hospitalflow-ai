const pptxgen = require('pptxgenjs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pptx = new pptxgen();
pptx.layout='LAYOUT_WIDE'; pptx.author='HospitalFlow AI Contributors'; pptx.subject='Emergency Department Digital Twin proof of concept'; pptx.title='HospitalFlow AI: Healthcare Digital Twin'; pptx.company='HospitalFlow AI';pptx.lang='en-US';
pptx.theme={headFontFace:'Aptos Display',bodyFontFace:'Aptos',lang:'en-US'};
const C={bg:'0C1523',panel:'142337',panel2:'182D40',mint:'5BE0C6',blue:'75BCFA',violet:'AA94FA',orange:'FFB773',white:'F3F9FF',grey:'A5B8CB',muted:'7B96AE',stroke:'2D455C',red:'FD778A'};
const S=pptx.ShapeType;
const slides=[];
function rect(sl,x,y,w,h,fill=C.panel,line='none',r=.12){sl.addShape(S.roundRect,{x,y,w,h,rectRadius:r,radius:r,fill:{color:fill},line:line==='none'?{color:fill,transparency:100}:{color:line,width:.85}})}
function text(sl,txt,x,y,w,h,size=16,color=C.white,opts={}){
 sl.addText(String(txt),{x,y,w,h,fontFace:opts.fontFace||'Aptos',fontSize:size,color,bold:opts.bold||false,breakLine:false,margin:0,fit:'shrink',valign:opts.valign||'mid',align:opts.align||'left',charSpacing:opts.charSpacing||0,...opts});
}
function base(section,num){
 let s=pptx.addSlide();s.background={color:C.bg};
 s.addShape(S.rect,{x:0,y:0,w:13.333,h:.075,fill:{color:C.mint},line:{transparency:100}});
 text(s,'HOSPITALFLOW',.56,.28,1.72,.27,13,C.white,{bold:true,charSpacing:1.4});
 text(s,'AI',2.20,.28,.37,.27,13,C.mint,{bold:true});
 text(s,section.toUpperCase(),8.5,.31,4.25,.20,9,C.muted,{align:'right',bold:true,charSpacing:1.6});
 s.addShape(S.line,{x:.55,y:7.15,w:12.2,h:0,line:{color:C.stroke,width:.8}});
 text(s,'SYNTHETIC PROOF OF CONCEPT · NOT FOR CLINICAL USE',.56,7.24,8.5,.13,7,C.muted,{charSpacing:1.1});
 text(s,String(num).padStart(2,'0'),12.25,7.21,.42,.17,9,C.mint,{bold:true,align:'right'});
 slides.push(s);return s;
}
function heading(s,eyebrow,title,subtitle){
 text(s,eyebrow.toUpperCase(),.65,.93,11,.22,10,C.mint,{bold:true,charSpacing:1.9});
 text(s,title,.65,1.30,12,.65,29,C.white,{bold:true,breakLine:false});
 if(subtitle)text(s,subtitle,.67,2.00,11.8,.48,14,C.grey);
}
function tag(s,txt,x,y,w,col=C.mint){rect(s,x,y,w,.35,C.panel2);text(s,txt,x+.09,y+.05,w-.18,.25,9,col,{bold:true,charSpacing:1});}
function feature(s,x,y,w,h,n,title,body,col=C.mint){
 rect(s,x,y,w,h,C.panel,C.stroke);
 rect(s,x+.23,y+.25,.42,.40,C.panel2);
 text(s,n,x+.24,y+.29,.4,.30,14,col,{bold:true,align:'center'});
 text(s,title,x+.24,y+.86,w-.5,.46,19,C.white,{bold:true});
 text(s,body,x+.24,y+1.47,w-.55,h-1.68,12,C.grey,{valign:'top',breakLine:false});
}
function cardText(s,x,y,w,h,title,body,color=C.mint){rect(s,x,y,w,h,C.panel,C.stroke);rect(s,x+.23,y+.30,.08,.42,color);text(s,title,x+.46,y+.28,w-.7,.49,17,C.white,{bold:true});text(s,body,x+.46,y+.91,w-.84,h-1.08,12,C.grey,{valign:'top'});}
function pill(s,txt,x,y,w,shade=C.mint){rect(s,x,y,w,.35,C.panel2);text(s,txt,x+.10,y+.06,w-.20,.22,9,shade,{bold:true,align:'center'});}
// 1
{
 let s=base('01 / introduction',1);
 s.addShape(S.ellipse,{x:8.28,y:.64,w:6.4,h:6.4,line:{transparency:100},fill:{color:'143840',transparency:50}});
 tag(s,'HEALTHCARE DIGITAL TWIN · CASE COMPETITION',.66,1.25,4.64);
 text(s,'What if we could',.68,2.04,8.2,.65,38,C.white,{bold:true});
 text(s,'rehearse the surge?',.68,2.80,9.6,.76,42,C.mint,{bold:true});
 text(s,'HospitalFlow AI',.72,3.95,6.4,.48,24,C.white,{bold:true});
 text(s,'An interactive Emergency Department twin for exploring patient flow, bottlenecks, and staffing decisions.',.72,4.50,7.4,1.0,18,C.grey,{valign:'top'});
 rect(s,.70,6.04,7.55,.59,C.panel2,C.stroke);
 text(s,'[TEAM NAME]  •  [TEAM MEMBERS]  •  [COLLEGE / INCUBATOR]',.89,6.20,7.1,.22,11,C.mint,{bold:true});
 s.addImage({path:path.join(root,'docs','architecture.png'),x:8.6,y:2.25,w:3.98,h:2.23});
}
// 2
{
 let s=base('02 / problem statement',2);heading(s,'THE PROBLEM','Bottlenecks emerge before dashboards explain them.','ED demand, triage capacity, clinicians and downstream beds interact as one system.');
 cardText(s,.65,2.88,3.84,2.55,'01. Demand is stochastic','Arrival surges compound waiting times as limited resources compete for attention.',C.blue);
 cardText(s,4.76,2.88,3.84,2.55,'02. Queues are coupled','A bottleneck at one step can influence triage, treatment and critical-care queues.',C.violet);
 cardText(s,8.87,2.88,3.84,2.55,'03. Policies need testing','A static census cannot show how a different staffing allocation might change future states.',C.orange);
 rect(s,.65,5.75,12.06,.67,'143D3A','35766A');text(s,'OUR QUESTION: Can a virtual ED rehearse disruptions and evaluate resource choices transparently?',.94,5.93,11.55,.29,15,C.mint,{bold:true});
}
//3
{
 let s=base('03 / solution',3);heading(s,'THE SOLUTION','From live state to counterfactual decisions.','A digital twin connects incoming events, a stateful model, metrics and intervention tests.');
 const names=['SYNTHETIC EVENTS','VIRTUAL ED STATE','SCENARIO ENGINE','HUMAN-IN-THE-LOOP UI'];
 const texts=['Seeded Poisson arrivals and patient acuity.','Priority queues, service capacities and patient pathways.','Replays, constrained allocation search and forecasting.','3D / 2D rooms, patient inspector and scenario controls.'];
 for(let i=0;i<4;i++){let x=.66+i*3.17;feature(s,x,2.71,2.93,2.72,String(i+1).padStart(2,'0'),names[i],texts[i],[C.blue,C.mint,C.violet,C.orange][i]);if(i<3)text(s,'→',x+2.99,3.82,.23,.31,22,C.mint,{bold:true});}
 tag(s,'FEEDBACK LOOP: USER CHANGES INPUTS → TWIN UPDATES → NEW SCENARIOS',.70,5.81,7.65);
}
//4
{
 let s=base('04 / working prototype',4);heading(s,'LIVE PRODUCT','Explore a hospital in 3D — and follow every patient.','Orbit, zoom, click a patient or switch to 2D. Both views reflect the same simulation state.');
 s.addImage({path:path.join(root,'docs','slide-twin-image.png'),x:.70,y:2.47,w:9.2,h:4.25});
 cardText(s,10.15,2.60,2.48,1.16,'3D hospital','Orbitable rooms + live beds',C.mint);
 cardText(s,10.15,3.91,2.48,1.16,'2D / 3D toggle','Same patients + journey trace',C.blue);
 cardText(s,10.15,5.22,2.48,1.16,'What-if controls','Staff, beds, arrivals, surge',C.orange);
}
//5
{
 let s=base('05 / virtual system',5);heading(s,'MODEL MECHANICS','A patient-level model with constrained resources.','Each synthetic patient carries an acuity, arrival timestamp, stage and remaining service time.');
 const xs=[.73,3.18,5.63,8.08,10.53];const lab=['ARRIVAL','TRIAGE','TREATMENT','OBSERVATION','EXIT'];const c=[C.blue,C.mint,C.violet,C.orange,C.mint];
 for(let i=0;i<5;i++){rect(s,xs[i],2.72,2.08,1.29,C.panel,C.stroke);rect(s,xs[i]+.16,2.91,.11,.67,c[i]);text(s,lab[i],xs[i]+.34,3.00,1.57,.22,12,C.white,{bold:true});if(i<4)text(s,'→',xs[i]+2.12,3.22,.30,.2,20,C.mint,{bold:true});}
 rect(s,5.69,4.45,2.07,1.1,'1B303C','386468');text(s,'↳ ICU',6.09,4.85,1.5,.28,17,C.mint,{bold:true});
 text(s,'Priority: P1 first',.77,6.05,3.2,.33,18,C.white,{bold:true});text(s,'Constraints: nurses, physicians, treatment beds, ICU beds',4.06,6.05,8.5,.36,16,C.grey);
}
//6
{
 let s=base('06 / scenario lab',6);heading(s,'INTERACTIVE EXPERIMENTS','Run the same surge under different staff allocations.','All four candidate configurations are constrained to three additional float staff.');
 s.addImage({path:path.join(root,'docs','scenario-preview.png'),x:.72,y:2.5,w:9.15,h:4.2});
 rect(s,10.16,2.51,2.45,3.66,C.panel,C.stroke);
 text(s,'EXPERIMENT',10.37,2.80,2.01,.24,10,C.mint,{bold:true,charSpacing:1});
 text(s,'3',10.36,3.19,1.4,.62,36,C.white,{bold:true});
 text(s,'floating staff',10.37,3.84,2.0,.25,12,C.grey);
 s.addShape(S.line,{x:10.37,y:4.32,w:2.00,h:0,line:{color:C.stroke,width:1}});
 text(s,'4',10.37,4.57,1.4,.62,36,C.violet,{bold:true});
 text(s,'staff allocations',10.37,5.24,1.99,.28,12,C.grey);
}
//7
{
 let s=base('07 / simulated findings',7);heading(s,'SIMULATION RESULTS','Adding flexible capacity changes modeled congestion.','Illustrative deterministic six-hour evaluation · 90-minute warmup · fixed seed 34071.');
 const cards=[
  {x:.7,title:'STANDARD ARRIVAL RATE',sub:'17 base arrivals / hour',b:'14.36 min',o:'8.22 min',q:'2.00 → 0.05',col:C.mint},
  {x:6.85,title:'SURGE ARRIVAL RATE',sub:'×1.8 demand multiplier',b:'32.26 min',o:'30.07 min',q:'70.11 → 42.70',col:C.orange}
 ];
 for(const k of cards){rect(s,k.x,2.70,5.79,3.16,C.panel,C.stroke);text(s,k.title,k.x+.25,2.96,5.2,.27,12,k.col,{bold:true,charSpacing:1});text(s,k.sub,k.x+.25,3.31,5.2,.23,11,C.muted);text(s,'BASELINE',k.x+.25,3.78,2.0,.25,10,C.grey,{bold:true});text(s,'WITH 3 FLOAT STAFF',k.x+2.93,3.78,2.4,.25,10,C.grey,{bold:true});text(s,k.b,k.x+.25,4.14,2.4,.65,27,C.white,{bold:true});text(s,k.o,k.x+2.93,4.14,2.5,.65,27,C.mint,{bold:true});text(s,'MEAN QUEUE: '+k.q+' patients',k.x+.25,5.22,5.2,.26,12,C.grey);}
 rect(s,.71,6.09,11.91,.60,'162D35','365863');text(s,'These are SIMULATED comparisons, not real hospital performance gains or validated clinical policies.',.96,6.26,11.4,.23,12,C.orange,{bold:true});
}
//8
{
 let s=base('08 / decision logic',8);heading(s,'EXPLAINABLE OPTIMIZATION','No black-box recommendations.','Exhaustively test all valid splits of the same three floating staff.');
 const rows=[['0 nurses','3 physicians'],['1 nurse','2 physicians'],['2 nurses','1 physician'],['3 nurses','0 physicians']];
 for(let i=0;i<4;i++){let x=.72+(i%2)*6.05,y=2.76+Math.floor(i/2)*1.52;rect(s,x,y,5.72,1.25,i===1?'153B34':C.panel,i===1?'4B987E':C.stroke);text(s,'PLAN 0'+(i+1),x+.24,y+.21,1.35,.25,11,i===1?C.mint:C.grey,{bold:true});text(s,rows[i].join('  +  '),x+.24,y+.57,4.9,.34,17,C.white,{bold:true});if(i===1)pill(s,'LOWEST TESTED SCORE',x+3.60,y+.19,1.87,C.mint);}
 tag(s,'COMPOSITE OBJECTIVE',.74,6.10,2.16);
 text(s,'mean wait + 0.8 × mean queue + 40 / (1 + discharges / 50)',3.13,6.11,8.9,.32,15,C.grey);
}
//9
{
 let s=base('09 / machine learning',9);heading(s,'FORECASTING COMPONENT','A real trained model. A transparent synthetic benchmark.','Ridge regression on Fourier seasonality features; no hospital dataset or protected patient information.');
 rect(s,.75,2.75,4.1,3.13,C.panel,C.stroke);
 text(s,'TRAINING SET',1.03,3.04,3.2,.25,11,C.mint,{bold:true});text(s,'1,848',1.03,3.42,3.1,.68,35,C.white,{bold:true});text(s,'77 synthetic days',1.03,4.11,3.3,.31,14,C.grey);
 text(s,'HOLDOUT: 504 OBSERVATIONS',1.03,5.23,3.5,.28,11,C.orange,{bold:true});
 rect(s,5.14,2.75,7.46,3.13,C.panel,C.stroke);
 text(s,'CHRONOLOGICAL HOLDOUT MAE',5.42,3.03,5.0,.27,11,C.grey,{bold:true});
 text(s,'Constant-mean baseline',5.45,3.58,3.1,.28,13,C.grey);text(s,'4.138',10.94,3.58,1.28,.3,16,C.white,{bold:true,align:'right'});
 rect(s,5.45,4.03,6.47,.22,'32465B');
 text(s,'Harmonic ridge model',5.45,4.54,3.2,.28,13,C.grey);text(s,'3.215',10.94,4.54,1.28,.30,16,C.mint,{bold:true,align:'right'});
 rect(s,5.45,4.99,5.02,.22,C.mint);
 text(s,'All metrics are synthetic observations per hour; cannot generalize to real facilities.',5.42,5.51,6.72,.22,11,C.muted);
 tag(s,'FEATURES: HOUR-OF-DAY FOURIER TERMS + WEEKEND FLAG',.76,6.24,5.98);
}
//10
{
 let s=base('10 / engineering architecture',10);
 text(s,'ENGINEERING ARCHITECTURE',.65,.91,11,.25,10,C.mint,{bold:true,charSpacing:1.8});
 text(s,'A local-first architecture with no deployment dependencies.',.65,1.28,12,.60,27,C.white,{bold:true});
 s.addImage({path:path.join(root,'docs','architecture.png'),x:.65,y:2.00,w:12.05,h:4.75});
}
//11
{
 let s=base('11 / limitations & validation',11);heading(s,'CREDIBILITY BEFORE HYPE','What we tested — and what remains unproven.','Our architecture is reproducible; operational and clinical validity require future real-world study.');
 cardText(s,.72,2.71,5.83,2.70,'VERIFIED INSIDE THE PROTOTYPE','10 automated tests: reproducibility, conservation of patient state, resource caps, matched arrivals and acuity, surge sensitivity, optimizer completeness, edge cases.',C.mint);
 cardText(s,6.77,2.71,5.83,2.70,'NOT CLAIMED','No real patient data; no clinical validation; no safe staffing prescription; no live hospital integration; no demonstrated real-world improvement.',C.orange);
 rect(s,.73,5.74,11.87,.72,'152E39','375366');text(s,'NEXT: event-log calibration  →  prospective validation  →  clinical governance  →  operational integration',1.02,5.96,11.3,.23,14,C.blue,{bold:true});
}
//12
{
 let s=base('12 / handoff',12);
 tag(s,'SUBMISSION-READY PROOF OF CONCEPT',.71,1.24,3.63);
 text(s,'The full build. Ready to run.',.71,1.89,11.0,.80,37,C.white,{bold:true});
 text(s,'2D / 3D hospital twin  •  seeded simulation  •  trained forecast  •  scenario optimization  •  tests  •  documentation',.72,2.87,11.63,.68,17,C.grey);
 rect(s,.73,3.98,11.88,1.45,C.panel,C.stroke);
 text(s,'QUICK START',1.00,4.22,3.0,.24,10,C.mint,{bold:true,charSpacing:1.7});
 text(s,'Double-click HospitalFlow-AI-Standalone.html',1.00,4.61,9.9,.40,21,C.white,{bold:true});
 text(s,'TEAM  [ADD NAME]     •     MEMBERS  [ADD]     •     COLLEGE/INCUBATOR  [ADD]',.74,5.82,11.89,.34,13,C.mint,{bold:true});
 text(s,'SOURCE: [ADD PUBLIC GITHUB LINK]      DEMO VIDEO: [ADD UNLISTED YOUTUBE LINK]',.74,6.35,11.80,.30,12,C.grey);
}
const dest=path.join(root,'docs','PRESENTATION.pptx');
pptx.writeFile({fileName:dest}).then(()=>console.log('Created '+dest+' ('+slides.length+' slides)')).catch(e=>{console.error(e);process.exit(1)});
