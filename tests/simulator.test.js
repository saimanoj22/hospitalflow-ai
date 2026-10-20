import test from 'node:test';
import assert from 'node:assert/strict';
import {HospitalTwin,simulate,DEFAULT_CONFIG,poisson,rng,percentile,STAGES} from '../src/simulator.js';
import {optimizeStaff} from '../src/optimizer.js';
import {features,predictHour} from '../src/forecast.js';

test('deterministic identical seeds',()=>{
 const a=new HospitalTwin().step(450),b=new HospitalTwin().step(450);
 assert.deepEqual(a.getSnapshot(),b.getSnapshot());
 assert.deepEqual(a.history,b.history);
});
test('arrival counts and stage totals balance',()=>{
 const t=new HospitalTwin().step(600),c=t.counts();
 assert.equal(Object.values(c).reduce((a,b)=>a+b,0),t.patients.length);
 assert.equal(c.discharged,t.dischargeCount);
 assert.equal(t.getSnapshot().active,t.patients.length-t.dischargeCount);
});
test('resource capacity always respected',()=>{
 const t=new HospitalTwin({...DEFAULT_CONFIG,nurses:2,physicians:3,treatmentBeds:2,icuBeds:1,surge:2});
 for(let i=0;i<600;i++){
   t.step(1);const c=t.counts();
   assert.ok(c.triage<=2);assert.ok(c.care<=2);assert.ok(c.icu<=1);
   assert.ok(STAGES.every(stage=>c[stage]>=0));
 }
});
test('same exogenous arrivals for different staffing',()=>{
 const a=new HospitalTwin({nurses:2,physicians:4}).step(400);
 const b=new HospitalTwin({nurses:7,physicians:9}).step(400);
 assert.deepEqual(a.arrivalEvents,b.arrivalEvents);
 assert.equal(a.patients.length,b.patients.length);
 assert.deepEqual(a.patients.map(p=>p.severity),b.patients.map(p=>p.severity));
});
test('higher surge generates more arrivals with common random numbers',()=>{
 const a=new HospitalTwin({surge:1}).step(500);
 const b=new HospitalTwin({surge:2}).step(500);
 assert.ok(b.patients.length>a.patients.length);
});
test('optimizer searches every integer split and ranks lowest score',()=>{
 const result=optimizeStaff({...DEFAULT_CONFIG,arrivalsPerHour:21},{minutes:120,warmup:60,flexStaff:3});
 assert.equal(result.candidates.length,4);
 assert.ok(result.candidates.every(x=>x.toTriage+x.toDoctors===3));
 assert.ok(result.candidates.every(x=>x.score>=result.best.score));
});
test('numeric helpers and model input shape',()=>{
 assert.equal(percentile([2,4,6],.5),4);
 assert.equal(features(8,1).length,6);
 assert.ok(predictHour({weights:[17,0,0,0,0,0]},10)>0);
 assert.equal(poisson(0,rng(1)),0);
});
test('snapshot/record edge cases no NaNs',()=>{
 const t=new HospitalTwin({arrivalsPerHour:0});
 for(const value of Object.values(t.getSnapshot()))
   if(typeof value==='number')assert.ok(Number.isFinite(value));
 const s=simulate({...DEFAULT_CONFIG,arrivalsPerHour:0},60,0);
 assert.equal(s.snapshot.arrivals,0);
});
