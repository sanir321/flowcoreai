# Hyperframes Composition Brief: FlowCore

## Objective
Create a short launch-style brag video for FlowCore.

## Output
- Composition directory: `brag-output-2026-08-16-201115/composition/`
- Rendered video: `brag-output-2026-08-16-201115/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: C:\Users\dhivya sri\Downloads\flowter\flowter
- Primary files read: src/app/home-client.tsx, src/app/(dashboard)/inbox/inbox-client.tsx, src/app/(dashboard)/agent-hub/agent-hub-client.tsx, src/app/onboarding/page.tsx, README.md
- Product name: FlowCore
- Tagline / strongest claim: AI customer service, orchestrated.
- Key UI or visual moment to recreate: FlowCore inbox with tabs To do / Active / Done, thread rows with channel badges and agent badges, agent hub cards, onboarding agent selection
- Copy that must appear verbatim:
  - FlowCore
  - One inbox. Three agents. Every channel.
  - flowcore.works
  - WhatsApp
  - Webchat
  - Active / To do / Done
  - Support Hero
  - Appointment Booker
  - Sales Closer

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film using real UI
- Interpretation: slow, confident reveals. Let each scene breathe. Use restraint, not noise.
- Angle: Both channels feel equally easy and reliable. The video proves it by showing WhatsApp and webchat threading into the same polished inbox, with real integrations like Google Calendar and Google Sheets making the system feel complete.
- Hook: FlowCore logo animates in—orange rounded-square mark plus wordmark—centered on dark background. Text: "AI customer service, orchestrated."
- Outro / punchline: Logo lockup holds + "One inbox. Three agents. Every channel." + flowcore.works
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: #050505
- Text: #ffffff / #e5e5e5 / #a3a3a3 / #171717
- Accent: #f9510b / #c65f39
- Display font: Outfit / Inter / Söhne
- Body font: Inter
- Visual references from the project:
  - FlowCore inbox thread list with tabs and badges
  - Dark onboarding particle ring and agent cards
  - Orange rounded-square logo mark
  - Google Calendar and Google Sheets integration chips

## Storyboard
Use the storyboard in `brag-output-2026-08-16-201115/brag-plan.md` as the creative contract.

Scene summary:
1. Logo hook — 3s — FlowCore logo animates in on dark background
2. Both channels connect — 4s — WhatsApp and webchat tiles pulse to show live connection
3. Inbox + integrations reveal — 6s — FlowCore inbox with threads, Google Calendar and Sheets appear
4. Agent routing + typing — 4s — Agent chips appear, typing indicator, reply types in
5. Resolved + outro — 3s — Resolved status, logo and tagline land

## Audio
- Audio role: warm corporate bed with tasteful motion-matched accents
- Audio arc: low warm bed throughout, sparse professional SFX, confident outro hold
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3
- Music treatment: start low under the logo hook, swell on the inbox reveal, settle under the outro
- Music cue guidance: unavailable; note cues will be detected at composition time
- Audio-reactive treatment: subtle; use music RMS/bass to make logo glow and card presence breathe
- Audio-coupled moments:
  - Logo reveal — soft logo hit
  - Channel connect pulses — two soft connection chimes
  - Inbox row arrivals — soft click on each thread arrival
  - Integration badges — subtle shimmer
  - Agent routing — quiet typing ticks
  - Final resolved/outro — one soft logo hit
- SFX selection guidance: prefer low/medium HF-risk sounds for polished moments; sparse and professional
- SFX analysis guidance: assets/sfx/sfx-analysis.md
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output-2026-08-16-201115/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, and `hyperframes-cli`. /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview or route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- When music is present and the treatment is not `none`, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion. Good targets are glow, depth, background warmth, card presence, title emphasis, or other existing visual elements. Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
