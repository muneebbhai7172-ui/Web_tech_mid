# CSC336 Web Technologies — Lab Mid Project
## Advanced Lava Typing Challenge Game (Esports Edition)
**COMSATS University Islamabad, Vehari Campus**  
**Course:** CSC336 Web Technologies | **Class:** BSSE | **Instructor:** Yasmeen Jana

---

## 🌋 Project Overview

A responsive, high-performance Typing Challenge Game built strictly using **HTML5, CSS3, and ES6+ JavaScript**. Styled in an **esports Lava Red, Obsidian Black, and Crisp White** cyber aesthetic with low-latency Web Audio sound synthesis, particle simulations, and real-time performance analytics.

---
<img width="1162" height="682" alt="image" src="https://github.com/user-attachments/assets/8c163d86-ed5e-492f-b0b9-b51e2fef8951" />
<img width="1847" height="813" alt="image" src="https://github.com/user-attachments/assets/5247cbf6-5b3e-41dd-9c61-6a030c58518f" />
<img width="1917" height="890" alt="image" src="https://github.com/user-attachments/assets/00731474-717c-4a11-99d4-d5e61ca67b74" />
<img width="1815" height="897" alt="image" src="https://github.com/user-attachments/assets/511efae9-6625-43f9-8b87-e2017dee80ba" />

## 🎮 Game Modes

### Mode A: Magma Bubbles (Letter Recognition)
- **Concurrent Bubbles**: Maintains $\ge 5$ active magma orbs ascending at dynamic speeds.
- **Detonation Mechanics**: Pressing matching key pops the orb with particle explosion and score reward.
- **Penalties & Combos**: Consecutive hits build combo multipliers ($1\times \to 5\times$). Mistyped keys apply an immediate score deduction and break the active streak.
- **Ceiling Boundary**: Bubbles crossing the top hazard boundary trigger a miss. A maximum of **6 misses** results in a game-over overload.
- **Dynamic Difficulty**: Speed and spawn rates automatically scale as your score increases.

### Mode B: KeyMagnet Forge (Keyboard Precision)
- **Interactive 3D Mechanical Keyboard**: Real-time on-screen keyboard layout that highlights keys and responds with physical animations.
- **Electromagnetic Target Beacon**: Displays target letters with magnetic field pulses and timeout countdown gauges.
- **Practice Sets**:
  - **Home Row**: `A, S, D, F, J, K, L` (as specifically mandated in the Lab Mid spec)
  - **Top Row**: `Q, W, E, R, T, Y, U, I, O, P`
  - **Bottom Row**: `Z, X, C, V, B, N, M`
  - **Full Alphanumeric**: Complete alphabet set
- **Precision Telemetry**:
  - Reaction time tracking in **milliseconds** (`performance.now()`)
  - Real-time **Accuracy %**
  - **KPM** (Keys Per Minute) speed tracking
  - Correct and incorrect strike counters

---

## 📋 Mandatory Functional Requirements Compliance

| # | Requirement | Implementation in Codebase |
|---|---|---|
| **1** | Game Selection | Home screen with mode preview cards, online WebP hero graphics, difficulty selectors, and Launch buttons. |
| **2** | Difficulty Levels | **Easy, Medium, Hard** presets dynamically modulating speed, active orbs, timeout windows, and character case complexity. |
| **3** | Gameplay Controls | **Start, Pause / Resume, Restart, and Exit** controls operating 100% SPA without page reloads. |
| **4** | Score & Status | Real-time Top HUD displaying Score, High Score, Combo multiplier, Lives/Misses indicators (6 dots), and Countdown Timer. |
| **5** | Immediate Feedback | Key flashes on virtual keyboard, particle sparks, floating `+points` / `-penalty` popups, screen shake, and Web Audio SFX. |
| **6** | Game Completion | Clear win/game-over conditions when lives expire or the countdown timer concludes. |
| **7** | Results Screen | Cyberpunk mission debrief modal with Rank Badge (**S, A, B, C, F**), Final Score, Accuracy %, Reaction Latency, and Max Combo. |
| **8** | State Reset | Centralized `reset()` methods clearing DOM elements, counters, combos, and active loops upon restart. |
| **9** | Timer & Movement Safety | Strict cancellation of `requestAnimationFrame` and `clearInterval` prevents duplicate loops and memory leaks. |
| **10** | Responsive Interface | Fluid CSS Grid & Flexbox layout with touch-to-pop and mobile touch-input support for phones and tablets. |

---

## 🚀 How to Run

### Option 1: Direct Browser Launch (Zero Installation)
Simply double-click `index.html` or open it with any modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave).

### Option 2: Local HTTP Server
```bash
# Run with npm / npx
npm start
# OR
npx serve .
```

---

## 🛠️ Project Structure & Modularity

```
muneeb-web/
├── index.html                  # Main SPA markup, HUD, screens, and modals (< 350 lines)
├── package.json                # Project scripts and configuration
├── README.md                   # Complete documentation and viva guide
├── css/
│   ├── variables.css           # Lava Red, Obsidian Black & White design tokens
│   ├── base.css                # Global layouts, cyber HUD, buttons, and debrief modal
│   ├── bubbles.css             # Mode A arena, danger boundary, and magma orbs
│   └── keymagnet.css           # Mode B 3D mechanical keyboard & magnetic beacon
└── js/
    ├── audio.js                # Web Audio API sound generator (pops, chimes, buzzers)
    ├── particles.js            # Background lava embers & explosion spark emitter
    ├── storage.js              # LocalStorage manager for persistent high scores
    ├── mode-bubbles.js         # Mode A engine (spawn, physics, miss limit, pop score)
    ├── mode-keymagnet.js       # Mode B engine (target queue, mechanical keyboard, latency)
    └── app.js                  # Master controller, SPA router, and keyboard event dispatcher
```

---

## 🎤 Viva & Code Understanding Reference (5 Marks)

1. **How is the timer loop managed safely?**  
   All movement is executed via `requestAnimationFrame` with stored IDs (`animFrameId`). When the game pauses, restarts, or exits, `cancelAnimationFrame` and `clearInterval` are executed immediately, preventing duplicate loops.
2. **How does Mode B measure millisecond precision?**  
   It records `performance.now()` when the target key appears, and measures `performance.now() - startTime` upon keypress, providing sub-millisecond precision.
3. **How does the Web Audio synthesizer work?**  
   `SoundEngine` in `js/audio.js` uses `AudioContext` oscillators (`sine`, `triangle`, `sawtooth`) with exponential gain decay envelopes. It requires no external `.mp3` or `.wav` files, eliminating loading delays or 404 errors.
4. **How are high scores preserved?**  
   Scores are stored in browser `localStorage` keyed by mode and difficulty (`bubbles_easy`, `keymagnet_hard`, etc.).

