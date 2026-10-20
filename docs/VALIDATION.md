# Technical validation and experimental findings

**Scope:** fixed-seed, synthetic simulation only. Neither the patient-flow engine nor the arrival forecaster has been validated on real hospital data.

## Replicable scenario evaluations

Settings: base arrivals 17/hour; triage nurses 3; physicians 7; treatment beds 12; ICU beds 8; simulation seed 34071; six-hour evaluation after 90-minute warm-up. Three floating staff are added for candidate scenarios and assigned between triage and ED treatment; baseline has no extra float staff.

| Scenario | Staffing | Mean time to clinician (min) | Mean queue (patients) | Discharges / 6h |
|---|---|---:|---:|---:|
| Standard demand | Baseline 3 nurses / 7 physicians | 14.36 | 2.00 | 95 |
| Standard demand | Selected +1 triage / +2 physicians | 8.22 | 0.05 | 101 |
| Surge (×1.8) | Baseline 3 nurses / 7 physicians | 32.26 | 70.11 | 96 |
| Surge (×1.8) | Selected +1 triage / +2 physicians | 30.07 | 42.70 | 122 |

Numbers are from a deterministic *simulation run*, not observed improvements. They are conditional on the model assumptions, seed, resource constraints and optimization score. The 'selected' staffing allocation minimizes the illustrative composite score across candidate allocations; it is not necessarily the allocation with the lowest wait time.

### Forecasting benchmark

Synthetic hourly dataset: 2,352 records (98 days), produced by a seeded Poisson generator with designed daily harmonic and weekend patterns. First 1,848 observations used to fit, final 504 to test (no random shuffling).

| Model | Test MAE (synthetic patients/hour) |
|---|---:|
| Harmonic ridge regression | **3.215** |
| Constant training-set mean | **4.138** |

Training script: `scripts/train_forecaster.py`. Fitted weights and benchmark metrics: `data/forecast_model.json`. The measured error concerns a toy synthetic arrival process; it is not evidence that the model forecasts real hospital demand.

## Automated tests

Run `node --test tests/*.test.js`. Coverage includes:

1. Same seed produces identical snapshots and history.
2. Population conservation across all states and discharges.
3. Triage, care and ICU occupancy never exceed stated limits at any step.
4. Incoming patient event times and acuity assignments remain identical when staffing changes.
5. Higher synthetic surge increases event volume under the fixed seed.
6. Exhaustive bounded search visits all four valid three-person staff splits.
7. Percentile, Poisson edge cases and Fourier input shape checks.
8. Empty-arrival scenarios do not create invalid numerical metrics.

## Important limitations

- Fixed arrival distribution, clinical priorities, care pathways and service-time ranges are invented for demonstration. They must not be used for actual patient decisions.
- Changing resources may change the order of service-time and disposition draws. The arrival stream and patient severity draws are held consistent, but *all* patient outcomes are not identically paired across counterfactuals.
- Small-sample, fixed-seed scenario results are illustrative; meaningful policy analysis would require multiple seeded runs, confidence intervals, real-world calibration, case mix and sensitivity testing.
- Mean time to clinician is calculated among people who have started care. Individuals still waiting are omitted from this average, so it is a biased operational indicator during extreme congestion. The queue chart adds context but does not fix this bias.
- Staff are treated as identical capacity units; fatigue, scheduling, turnover, shift boundaries, interdepartment dependencies and actual medical protocols are not represented.
- The optimizer objective contains arbitrary weights. It is not a validated clinical or financial objective and must not be interpreted as a safe staffing recommendation.
- The synthetic forecasting model is trained on a separately designed periodic data generator. Its reported accuracy does not certify the simulator or imply that either model generalizes to actual hospitals.

## Production research next steps

Permissioned event logs → process mining and calibration → arrival and service distribution fitting → patient journey and subgroup validation → robustness across many random seeds → clinician and operations review → shadow-mode testing → prospective evaluation → governed deployment.

## Visual patient journey synchronization

The upgraded spatial visualizer directly reads the live `HospitalTwin.patients` array on each render. Its colored agents are not prerecorded decoration. The timestamped `patient.journey` contains transitions recorded by the same simulation method that updates care status. Two additional automated tests confirm each patient trace starts at arrival, ends at the true current state, advances in nondecreasing simulated time, and records discharge at its actual discharge timestamp. The room coordinates are illustrative rather than measured indoor positions.
