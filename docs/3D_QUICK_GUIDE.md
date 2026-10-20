# 3D Hospital Twin — quick demo guide

Open `HospitalFlow-AI-Standalone.html` in a modern desktop browser. No installation, CDN, Python runtime, database or network is required. **3D mode starts by default.**

1. **Orbit:** Drag the 3D canvas with your mouse (or one finger on touchscreens). Camera angles are limited to keep the scene legible.
2. **Zoom:** Scroll while your pointer is over the model or use the `+` and `−` buttons. Camera presets: *Isometric*, *Top*, and *Reverse*.
3. **Inspect:** Click a colored patient figure. The right-hand panel displays its synthetic patient ID, acuity, state, elapsed time and simulated journey history.
4. **Advance:** Press `+5 minutes`, `+30 minutes`, or `Run simulation`. Avatars are linked to the same patient IDs and stage transitions that power the simulation engine.
5. **Experiment:** Click `Emergency surge ×1.8`, then advance time. Observe changed queue sizes, occupancy-linked bed highlights and counts. Modify staff, beds or arrivals with the sliders.
6. **Switch to 2D:** The `2D` button opens the existing interactive SVG floor plan. The simulation state and patient IDs do not change when switching visual modes.
7. **Compare decisions:** Open *Scenario lab* to evaluate four constrained staff reallocations.

**Rendering:** This is an isometric 3D world defined with rooms, walls, furniture and avatars in XYZ coordinates, projected onto HTML Canvas through an orbitable camera. It is deliberately a self-contained alternative to downloading Three.js or other WebGL libraries. It is not a textured, photorealistic hospital environment.

**Data integrity:** Real patient data and indoor GPS coordinates are never used. Every avatar maps to one synthetic `HospitalTwin` patient object. Room placements and beds are stylized visual representations; the model's resource constraints and numeric occupancy metrics are authoritative. The number of rendered bed props is fixed for clarity and is not identical to user-configurable hospital bed capacity.

**For a full technical explanation**, see the main README and `docs/VALIDATION.md`.
