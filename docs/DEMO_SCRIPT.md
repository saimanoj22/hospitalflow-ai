# 15–20 minute unlisted demo video: suggested run of show

**The competition form explicitly requires a 15–20-minute demo.** Record an unlisted YouTube video in that duration range; insert its accessible URL in the repository README.

| Time | On-screen activity | Talking points |
|---|---|---|
| 00:00–01:30 | Intro / title slide | Team, project, healthcare problem, synthetic-PoC scope |
| 01:30–03:00 | **Visual Digital Twin** tab | Orient viewers to the hospital floor plan, rooms, patient agents and severity legend. Explain these are stage-linked synthetic positions. |
| 03:00–05:30 | **Click patient agent**, then Run simulation | Show selected patient P1–P5, current department, service status and recorded timeline. Advance +30 minutes and explain stage transitions. |
| 05:30–07:00 | **Visual twin controls** + Command Center | Change arrivals and staff sliders, watch the avatars, queues, patient counts and room occupancy update. |
| 07:00–09:00 | **Emergency surge ×1.8**, advance +30 min repeatedly | Demonstrate modeled congestion, highlight critical priority patients and capacity saturation. Disclose synthetic assumptions. |
| 09:00–11:30 | Scenario Lab | Run all four float-staff allocation candidates and discuss common arrival stream |
| 11:30–13:00 | Candidate comparison & score | Explain operational score, outputs and why optimization is bounded and interpretable |
| 13:00–14:30 | Forecast Studio | Discuss learned Fourier ridge model, training/holdout split and synthetic MAE |
| 14:30–16:00 | Methodology, architecture | Show resource constraints, event-state machine and limitations |
| 16:00–17:30 | README, tests in terminal | Run Node tests; show forecast training and model artifact; repo structure |
| 17:30–18:30 | Closing / next steps | Production calibration roadmap, validation needs, non-clinical disclaimer |

**Video recording checklist:** Share screen at 1080p, enlarge text where necessary, avoid revealing personal credentials, show one example of a live setting change, run a comparison, show tests, and verify the YouTube video's link works in private browsing while Unlisted.

**Narrative:** "We built a transparent, standalone emergency department operational twin. It uses a seeded synthetic event stream rather than pretending to access real hospital data, and can show how bottlenecks emerge and how alternative staff allocations compare within the model. It is intended for exploratory planning research, not clinical decision support."


### 3D demonstration walkthrough
Start in **3D**. Drag the camera to orbit; use Top and Reverse presets; zoom on treatment beds. Click any avatar to populate the patient journey inspector, then switch to 2D to show that the same patient data is available in both modes. Trigger the ×1.8 surge, advance 30 minutes, and point out the updated room counts and occupancy-linked highlighted beds. Distinguish the synthetic agent model from a real facility telemetry connection.
