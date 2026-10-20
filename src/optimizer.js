import { simulate } from './simulator.js';
/**
 * Exhaustive and reproducible bounded resource allocation search.
 * Fixed number of float staff; no net staffing increase between candidate allocations.
 * Score = time-to-care + queue risk + throughput penalty; NOT a clinical safety objective.
 */
export function optimizeStaff(config, options={}) {
  const {minutes=360,warmup=90,flexStaff=3}=options;
  const baseline=simulate(config,minutes,warmup);
  const results=[];
  for(let toTriage=0;toTriage<=flexStaff;toTriage++) {
    const toDoctors=flexStaff-toTriage;
    const candidate={...config,nurses:config.nurses+toTriage,physicians:config.physicians+toDoctors};
    const result=simulate(candidate,minutes,warmup);
    const score=result.meanWait + .8*result.meanQueue + 40/(1+result.discharges/50);
    results.push({toTriage,toDoctors,score,...result});
  }
  results.sort((a,b)=>a.score-b.score || a.toTriage-b.toTriage);
  return {baseline,best:results[0],candidates:results,minutes,warmup,flexStaff};
}
export function percentChange(from,to) {
  return from===0 ? 0 : (to-from)/from*100;
}
