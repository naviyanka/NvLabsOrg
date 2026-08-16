# V3: Realistic Isometric Office — Background + Agent Walk-In Animation

## Effort: 3-5 days
## Category: Major Visual Upgrade

---

## Summary

Replace/augment the current pixel-art Office view with a **realistic isometric 3D-rendered office** (the attached reference image) and add **walk-in/movement animation** for agent avatars. This is NOT a real-time 3D renderer — it's a static high-fidelity background with lightweight animated sprites on top.

## Art Direction (from reference image)

- Cool blue-grey architectural tones (concrete/glass/steel)
- Warm amber desk-lamp pools of light
- Glass partition walls between zones (translucent, subtle blue edge-glow)
- Wall-mounted screens with abstract data visualizations
- Central round meeting table in glass-walled room
- Potted plants near windows for warmth/scale
- Soft realistic shadows and ambient occlusion
- Desks in pods of 2-4, grouped into zones with partitions

## Technical Architecture

```
┌──────────────────────────────────────────────────┐
│  Static Background Layer                          │
│  (one large PNG/WebP — the rendered office)       │
├──────────────────────────────────────────────────┤
│  Zone Overlay Layer (CSS positioned)              │
│  (invisible hit areas + hover highlights)         │
├──────────────────────────────────────────────────┤
│  Avatar Animation Layer (CSS/SVG)                 │
│  (small isometric humanoid figures)               │
│  - Position: absolute coordinates                 │
│  - Movement: CSS transition/animation along paths │
│  - Status: glow color + idle/working pose         │
└──────────────────────────────────────────────────┘
```

## Zone Layout (matching reference 3x3 grid + center meeting)

```
┌────────────┬────────────┬────────────┐
│  Planning  │Development │ QA/Security│
│    Zone    │    Zone    │    Zone    │
├────────────┼────────────┼────────────┤
│   Data     │  MEETING   │ Automation │
│   Zone     │   ROOM     │    Zone    │
├────────────┼────────────┼────────────┤
│  Research  │ Operations │  Support   │
│    Zone    │    Zone    │    Zone    │
└────────────┴────────────┴────────────┘
```

Entry point: top-center corridor (visible gap between Planning and Development zones in top row)

## Agent Avatar Spec

- **Style**: Simplified humanoid silhouettes with soft isometric shading
- **Size**: ~20-30px tall (proportionate to desk scale in background)
- **Color**: Subtle agent-identity color accent (glow or clothing highlight)
- **Rendering**: CSS-styled div with SVG body, or small sprite sheet
- **NOT**: Cartoon blobs, photorealistic people, or pixel art

## Animation Behaviors

### Walk-In (agent comes online)
1. Avatar appears at entry point (top-center corridor)
2. CSS transition moves avatar along pre-defined waypoint path to their desk
3. ~2-3 second walk duration
4. On arrival: transition to seated/working pose

### Status-Driven Movement
| Status | Behavior |
|--------|----------|
| Working | Seated at desk, subtle idle sway, screen-glow flicker |
| Idle | Gets up, short wander loop within zone pod (3-4 waypoints), returns |
| Offline | Walks OUT to entrance corridor, fades out / disappears |
| Review/Approval | Seated but with pulsing yellow highlight ring |

### Meeting Room
- Relevant agents walk from desks → corridors → central meeting room
- Take seats at round table
- Speaking cue: slight glow pulse on current speaker
- After meeting: walk back to desks

### Auditor/Reviewer
- Enters from door
- Walks between zones through visible walkways
- Brief soft light pulse over visited pod
- Exits after inspection

## Pre-Defined Paths (waypoints)

Each zone has:
- An **entry waypoint** (where the corridor meets the zone)
- **Desk positions** (2-4 per zone, absolute coordinates)
- **Exit waypoint** (back to corridor)

The **corridor** is a series of connected waypoints forming a cross/grid shape through the office, connecting all zone entry points to the main entrance.

## Micro-Phases

### Phase 1: Background + Zone Map (2h)
- [ ] Save the reference image as the office background (or generate a similar one)
- [ ] Create `RealisticOfficeView.tsx` component
- [ ] Position zone hit areas (invisible, for interaction)
- [ ] Add hover highlight effect per zone
- [ ] Wire as new view mode option alongside existing pixel office

### Phase 2: Avatar Sprites (2h)
- [ ] Create `AgentAvatar.tsx` — isometric humanoid silhouette
- [ ] SVG-based with configurable accent color
- [ ] States: standing, seated, walking (CSS class toggle)
- [ ] Glow effect matching agent identity color
- [ ] Respect `prefers-reduced-motion`

### Phase 3: Desk Positions + Path System (2h)
- [ ] Define desk coordinates per zone (relative to background)
- [ ] Define corridor waypoint graph (entry → zones)
- [ ] Path resolver: given start + end position, return waypoint array
- [ ] CSS transition for smooth movement between waypoints

### Phase 4: Walk-In / Walk-Out Animation (3h)
- [ ] On agent status change to "working": trigger walk-in from entrance to desk
- [ ] On agent status change to "offline": trigger walk-out from desk to entrance
- [ ] Stagger multiple simultaneous walks (don't start all at once)
- [ ] Fallback for prefers-reduced-motion: instant position

### Phase 5: Idle Wander + Meeting Room (2h)
- [ ] Idle agents: periodic wander within zone (random waypoints, return)
- [ ] Meeting trigger: agents walk to meeting room, take seats
- [ ] Speaking indicator: glow pulse
- [ ] Return-to-desk after meeting ends

### Phase 6: Interaction + Integration (1h)
- [ ] Click avatar → open agent detail drawer
- [ ] Click zone → highlight zone agents
- [ ] Click meeting room → open meeting transcript
- [ ] View mode toggle: add "Realistic" option alongside "Pixel Art" and "Floor Plan"
- [ ] Save preference to localStorage

---

## Constraints
- No physics or real pathfinding — paths are pre-defined per zone
- No 3D renderer — pure static image + CSS transforms
- `prefers-reduced-motion` → instant position, no walk
- Calm and watchable — animations triggered only by actual status changes
- Additive — doesn't remove existing pixel office view

## Dependencies
- Background image: the user-provided reference image (or a similar generated one)
- Agent status data: already available from the store (status, agentId, name, palette)
- Zone assignments: can derive from agent role or assign round-robin
