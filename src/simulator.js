/**
 * HospitalFlow AI — minute-step, seeded, stochastic emergency department twin.
 * All values are illustrative / synthetic and are NOT medical predictions.
 */
export const DEFAULT_CONFIG = Object.freeze({
  arrivalsPerHour: 17, nurses: 3, physicians: 7, treatmentBeds: 12,
  icuBeds: 8, surge: 1, flexStaff: 3, seed: 34071,
});

export const STAGES = Object.freeze([
  'triageQueue', 'triage', 'careQueue', 'care', 'icuQueue', 'icu', 'observation', 'discharged'
]);

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function mean(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
export function percentile(values,p) {
  if (!values.length) return 0;
  const a=[...values].sort((x,y)=>x-y);
  const i=(a.length-1)*p, j=Math.floor(i);
  return a[j]+(a[Math.min(j+1,a.length-1)]-a[j])*(i-j);
}
export function rng(seed) {
  let state=(Math.floor(seed) >>> 0) || 1;
  return ()=>{ state=(1664525*state+1013904223)>>>0; return state/4294967296; };
}
export function poisson(lambda,random) {
  if(lambda<=0) return 0;
  const limit=Math.exp(-lambda); let p=1,k=0;
  do {k++;p*=random();} while(p>limit);
  return k-1;
}
export function patientSeverity(random) {
  const x=random();
  return x<.035?1:x<.16?2:x<.52?3:x<.86?4:5;
}
export function diurnalFactor(minute) {
  const hour=(8+minute/60)%24;
  return clamp(1+.24*Math.sin((hour-8)*Math.PI/12)+.12*Math.cos((hour-14)*Math.PI/6),.56,1.50);
}
function randRange(random,lo,hi) {return lo+(hi-lo)*random();}
function priority(a,b){return a.severity-b.severity || a.arrived-b.arrived || a.id-b.id;}

export class HospitalTwin {
  constructor(config={}) { this.reset(config); }
  reset(config={}) {
    this.config={...DEFAULT_CONFIG,...config};
    this.config.nurses=Math.round(clamp(this.config.nurses,1,30));
    this.config.physicians=Math.round(clamp(this.config.physicians,1,40));
    this.config.treatmentBeds=Math.round(clamp(this.config.treatmentBeds,1,100));
    this.config.icuBeds=Math.round(clamp(this.config.icuBeds,1,60));
    this.time=0;this.nextId=1000;this.patients=[];this.dischargeCount=0;
    this.waitSamples=[];this.completedTimes=[];this.arrivalEvents=[];
    this.history=[];this.log=[];
    this.arrivalRand=rng(this.config.seed+13);
    this.clinicalRand=rng(this.config.seed+27);
    this.severityRand=rng(this.config.seed+39);
    this.routingRand=rng(this.config.seed+51);
    this.record(true);
    return this;
  }
  arrivalRate() {
    return this.config.arrivalsPerHour*this.config.surge*diurnalFactor(this.time);
  }
  pushLog(message,type='info') {
    this.log.unshift({minute:this.time,message,type});
    if(this.log.length>70)this.log.length=70;
  }
  enterPatient() {
    const severity=patientSeverity(this.severityRand);
    const p={id:++this.nextId,severity,arrived:this.time,status:'triageQueue',remaining:0,
      triageAt:null,careAt:null,dischargedAt:null,icuNeeded:false,
      journey:[{stage:'triageQueue',minute:this.time}]};
    this.patients.push(p);
    this.arrivalEvents.push(this.time);
    if(severity<=2)this.pushLog(`Priority ${severity} patient #${p.id} arrived`,'critical');
    return p;
  }
  transition(p,stage) {
    if(p.status===stage)return;
    p.status=stage;
    p.journey.push({stage,minute:this.time});
  }
  step(minutes=1) {
    for(let m=0;m<minutes;m++) {
      this.time++;
      const arrivals=poisson(this.arrivalRate()/60,this.arrivalRand);
      for(let i=0;i<arrivals;i++)this.enterPatient();
      // Complete service before admission to free real resources.
      for(const p of this.patients) {
        if(!['triage','care','icu','observation'].includes(p.status))continue;
        p.remaining--;
        if(p.remaining>0)continue;
        if(p.status==='triage')this.transition(p,'careQueue');
        else if(p.status==='care') {
          const r=this.routingRand();
          if(r < (p.severity<=2 ? .23 : .055)) {
            this.transition(p,'icuQueue');p.icuNeeded=true;
          } else if(r < (p.severity<=2 ? .42 : .24)) {
            this.transition(p,'observation'); p.remaining=Math.round(randRange(this.clinicalRand,35,100));
          } else this.discharge(p);
        } else if(p.status==='icu'||p.status==='observation')this.discharge(p);
      }
      // Triage staff allocated to triage rooms; priority service for high acuity.
      let activeTriage=this.count('triage');
      const triageWait=this.patients.filter(p=>p.status==='triageQueue').sort(priority);
      for(const p of triageWait) {
        if(activeTriage>=this.config.nurses)break;
        this.transition(p,'triage');p.triageAt=this.time;
        p.remaining=Math.max(2,Math.round(randRange(this.clinicalRand,4,11)+(p.severity<=2?4:0)));
        activeTriage++;
      }
      // ED physicians and treatment beds are both binding constraints.
      let activeCare=this.count('care');
      const careWait=this.patients.filter(p=>p.status==='careQueue').sort(priority);
      for(const p of careWait) {
        if(activeCare>=Math.min(this.config.physicians,this.config.treatmentBeds))break;
        this.transition(p,'care');p.careAt=this.time;
        const waited=p.careAt-p.arrived;
        this.waitSamples.push(waited);
        p.remaining=Math.max(4,Math.round(randRange(this.clinicalRand,12,32)*(p.severity<=2?1.6:1)));
        activeCare++;
      }
      let activeICU=this.count('icu');
      const icuWait=this.patients.filter(p=>p.status==='icuQueue').sort(priority);
      for(const p of icuWait) {
        if(activeICU>=this.config.icuBeds)break;
        this.transition(p,'icu');p.remaining=Math.round(randRange(this.clinicalRand,130,310));
        activeICU++;
      }
      if(this.time%10===0)this.record();
      if(this.time%90===0)this.pushLog(`Operations snapshot saved · hour ${Math.floor(this.time/60)+1}`,'system');
    }
    return this;
  }
  discharge(p) {
    this.transition(p,'discharged');p.dischargedAt=this.time;this.dischargeCount++;
    this.completedTimes.push(this.time-p.arrived);
  }
  count(status){return this.patients.reduce((n,p)=>n+(p.status===status),0);}
  counts() {
    const out={};for(const s of STAGES)out[s]=0;
    for(const p of this.patients)out[p.status]++;
    return out;
  }
  getSnapshot() {
    const c=this.counts();
    const active=this.patients.length-c.discharged;
    const inQueue=c.triageQueue+c.careQueue+c.icuQueue;
    const waiting=this.patients.filter(p=>p.status==='triageQueue'||p.status==='careQueue');
    const stale=waiting.filter(p=>this.time-p.arrived>45).length;
    const recentArrivals=this.arrivalEvents.filter(t=>t>this.time-60).length;
    const recentDischarges=this.patients.filter(p=>p.dischargedAt!==null&&p.dischargedAt>this.time-60).length;
    return {minute:this.time,active,arrivals:this.patients.length,arrivalsLastHour:recentArrivals,
      queue:inQueue,edQueue:c.triageQueue+c.careQueue,critical:this.patients.filter(p=>p.status!=='discharged'&&p.severity<=2).length,
      bedOccupancy:Math.round(100*c.care/this.config.treatmentBeds),
      icuOccupancy:Math.round(100*c.icu/this.config.icuBeds),
      meanWait:mean(this.waitSamples),p90Wait:percentile(this.waitSamples,.9),
      discharged:c.discharged,dischargedLastHour:recentDischarges,stale,
      counts:c,arrivalRate:this.arrivalRate(),
      averageJourney:mean(this.completedTimes),
    };
  }
  record(force=false) {
    if(!force && this.time%10!==0)return;
    const s=this.getSnapshot();
    this.history.push({minute:this.time,queue:s.queue,wait:s.meanWait,active:s.active,
      bed:s.bedOccupancy,critical:s.critical,arrivals:s.arrivals,discharged:s.discharged});
    if(this.history.length>180)this.history.shift();
  }
  recentPatients(n=9) {
    return this.patients.filter(p=>p.status!=='discharged').slice(-Math.max(n*5,35))
      .sort((a,b)=>a.severity-b.severity||b.arrived-a.arrived).slice(0,n);
  }
}

export function simulate(config, minutes=480, warmup=90) {
  const twin=new HospitalTwin(config);
  if(warmup>0)twin.step(warmup);
  const prior=twin.getSnapshot();
  const waitsBefore=twin.waitSamples.length;
  const discBefore=twin.dischargeCount;
  twin.step(minutes);
  const s=twin.getSnapshot();
  const freshWaits=twin.waitSamples.slice(waitsBefore);
  const periodHistory=twin.history.filter(h=>h.minute>=warmup);
  const timeAtRisk=periodHistory.length?mean(periodHistory.map(h=>h.queue)):s.queue;
  return {snapshot:s,meanWait:mean(freshWaits),p90Wait:percentile(freshWaits,.9),
    discharges:twin.dischargeCount-discBefore,meanQueue:timeAtRisk,
    lastQueue: s.queue,critical:s.critical,
    history:periodHistory,config:{...twin.config},warmup,minutes,
    baselineAtStart:prior};
}
