# Hyperframes Composition Brief: Flowcore

## Objective
Create a short launch-style brag video for Flowcore — the 2 AM shift.

## Output
- Composition directory: `brag-output-2026-08-16-205801/composition/`
- Rendered video: `brag-output-2026-08-16-205801/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: C:\Users\dhivya sri\Downloads\flowter\flowter
- Primary files read: src/app/home-client.tsx (landing page: hero, integrations, features), src/app/layout.tsx (fonts), public/logo.svg (brand mark), README.md (agents, pipeline, channels), public/producthunt/*.png (real inbox/analytics screenshots), src/app/(dashboard)/inbox/
- Product name: Flowcore
- Tagline / strongest claim: "Stop answering the same question 30 times a day"
- Key UI or visual moment to recreate: WhatsApp message thread flowing into the Flowcore unified inbox (To do / Active / Done), with a Google Calendar event card
- Copy that must appear verbatim:
  - Flowcore
  - flowcore.works
  - "hi! do you have any slots for a haircut tomorrow?"
  - "Hi Maya! I've got you at 10:30 AM tomorrow."
  - Booking · Sales · Support
  - To do / Active / Done
  - Resolved
  - "Stop answering the same question 30 times a day."
  - "2:00 AM"

## Creative Direction
- Tone preset: polished
- Creative direction: quiet 2 AM product film — the product speaks for itself
- Interpretation: 4 scenes, longer holds, slow confident reveals. Restraint is the creative choice.
- Angle: A customer messages on WhatsApp at 2:00 AM. The AI routes it, answers it, books the appointment on Google Calendar, and by morning the thread is marked Resolved in the unified inbox. No team member involved.
- Hook: Late-night darkness, "2:00 AM" clock, WhatsApp bubble slides in: "hi! do you have any slots for a haircut tomorrow?"
- Outro / punchline: Flowcore logo lockup + "Stop answering the same question 30 times a day." + flowcore.works
- Avoid:
  - Generic SaaS language ("streamline your workflow" etc.)
  - Abstract filler visuals or unrelated redesigns
  - Loud/chaotic motion or big impact SFX — this is a quiet film

## Visual Identity
- Background: #050505 (dark scenes), #fafafa / #ffffff (inbox scene), borders #e5e5e5
- Text: #ffffff / #e5e5e5 / #a3a3a3 / #737373 (dark scenes), #171717 / #525252 / #a3a3a3 (light UI)
- Accent: #f9510b (CTA orange), logo gradient #c65f39 → #a84a2a
- WhatsApp green: #25D366; Google Calendar blue: #4285F4; Google Sheets green: #0F9D58
- Display font: Outfit (headings), fallback Inter / Söhne / system-ui
- Body font: Inter
- Visual references from the project:
  - WhatsApp-style white message bubble with customer name "Maya"
  - Dark hero with soft orange radial glow + slow floating particles
  - Google Calendar event card (blue mark, "Synced" tag)
  - Flowcore inbox: tabs To do / Active / Done, thread rows with channel badges, green Resolved badge, "AI · 96s" label
  - Flowcore logo: orange rounded-square mark (gradient #c65f39 → #a84a2a) + wordmark

## Storyboard
Use the storyboard in `brag-output-2026-08-16-205801/brag-plan.md` as the creative contract.

Scene summary (20s total):
1. The 2 AM message — 4s (0-4) — dark bg, "2:00 AM" clock, WhatsApp bubble slides in
2. Routing + reply — 6s (4-10) — Booking/Sales/Support chips, typing indicator, reply types in
3. Calendar + morning inbox — 6s (10-16) — Google Calendar card, Flowcore inbox, Resolved badge
4. Outro — 4s (16-20) — logo lockup, tagline, flowcore.works

## Audio
- Audio role: warm bed with sparse professional accents
- Audio arc: low warm bed throughout, quiet SFX matched to interactions, gentle swell on the calendar/inbox reveal, quiet outro hold with fade
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3
- Music treatment: bed at low volume under the hook, gentle swell on the calendar/inbox reveal, settle under outro, gentle final fade
- Music cue guidance: bundled preset — happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json/md (tempo ~110 BPM). Suggested strong-cue locks: AI reply reveal ~8.7s, inbox reveal ~13.1s, outro logo ~17.5s. Beat grid for sequential chips/thread rows (snap within ±0.10s; reveal quickly and hold for readable text).
- Audio-reactive treatment: subtle; use music RMS/bass to make the hero glow and card presence breathe. No waveform/equalizer visuals.
- Audio-coupled moments:
  - WhatsApp message arrival — one soft notification ping
  - Agent chips + typing indicator — quiet per-character typing ticks
  - Calendar event sync — soft confirm chime
  - Inbox thread rows + Resolved badge — soft card/click sounds, one success ding on Resolved
  - Outro logo — one soft logo hit
- SFX selection guidance: sparse, low/medium HF-risk files preferred (polished). Match sound to motion: soft ping for incoming message, keyboard keypresses for typed reply, card sounds for card reveals, a gentle chime for calendar sync, one success ding for Resolved, one soft hit for the logo.
- SFX analysis guidance: skills at C:\Users\dhivya sri\.config\opencode\skills\brag\assets\sfx\sfx-analysis.md (and .json). Use lower high-frequency-risk sounds for repeated/polished moments.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output-2026-08-16-205801/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in /brag.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (the WhatsApp thread, the inbox, the calendar card).
- Keep all text readable in the final render (0.8s floor for short labels, ~0.3s/word for sentences).
- Keep the video within 15-25 seconds (target 20s).
- Include the planned music/SFX layer unless audio was explicitly disabled.
- Treat /brag audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in this 20s video.
- Use SFX to support motion and interaction; restraint when the edit is busy.
- Honor planned music treatment such as fade-outs and letting a final SFX ring over the music.
- When music is present, consider the Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion (glow, card presence). Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
