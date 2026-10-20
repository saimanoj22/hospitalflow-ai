#!/usr/bin/env python3
"""Fit a lightweight hour-of-day arrivals forecast on completely SYNTHETIC data.
No sensitive health records, patient data or internet required.
Train first 77 days, evaluate final 21 days; use a fixed seeded data generator.
"""
import json
from pathlib import Path
import numpy as np

OUT=Path(__file__).resolve().parent.parent/'data'
OUT.mkdir(parents=True,exist_ok=True)
random=np.random.default_rng(34071)
def features(hour,weekday):
    a=2*np.pi*hour/24
    return [1.,np.sin(a),np.cos(a),np.sin(2*a),np.cos(2*a),float(weekday>=5)]
rows=[]
for day in range(98):
    for hour in range(24):
        a=2*np.pi*hour/24
        rate=17+3.5*np.sin(a-1.2)+2.4*np.cos(2*a+.4)-(2.5 if day%7>=5 else 0.)
        # stochastic synthetic demand with periodic fluctuations, no clinical basis
        count=int(random.poisson(max(1,rate)))
        rows.append({'day':day,'hour':hour,'weekday':day%7,'arrivals':count})
X=np.array([features(r['hour'],r['weekday']) for r in rows],float)
y=np.array([r['arrivals'] for r in rows],float)
cut=77*24
# Ridge with unregularized intercept
penalty=np.diag([0,1,1,1,1,1])
weights=np.linalg.solve(X[:cut].T@X[:cut]+4*penalty,X[:cut].T@y[:cut])
pred=np.clip(X[cut:]@weights,1,None)
baseline=np.full_like(pred,y[:cut].mean())
mae=float(np.mean(np.abs(pred-y[cut:])))
mae_baseline=float(np.mean(np.abs(baseline-y[cut:])))
rmse=float(np.sqrt(np.mean((pred-y[cut:])**2)))
model={
 'name':'Synthetic ED arrival forecaster',
 'type':'Ridge regression with hourly Fourier features',
 'training_data':'Deterministic generated synthetic hourly counts — not hospital data',
 'seed':34071,'training_days':77,'test_days':21,
 'features':['intercept','sin24','cos24','sin12','cos12','is_weekend'],
 'weights':[round(float(x),7) for x in weights],
 'holdout_mae':round(mae,3),'constant_baseline_mae':round(mae_baseline,3),
 'holdout_rmse':round(rmse,3),
 'limitation':'Educational synthetic-data benchmark. Results cannot infer real ED volumes, accuracy, or clinical outcomes.'
}
(OUT/'forecast_model.json').write_text(json.dumps(model,indent=2)+'\n')
(OUT/'synthetic_hourly_arrivals.csv').write_text('day,hour,weekday,arrivals\n'+''.join(f"{r['day']},{r['hour']},{r['weekday']},{r['arrivals']}\n" for r in rows))
print(json.dumps({k:v for k,v in model.items() if k in ['holdout_mae','constant_baseline_mae','holdout_rmse']},indent=2))
