# DERMALENS — Demo Recording Checklist

A short, honest recording flow. Do NOT claim a live analysis succeeded unless
one actually ran during the recording.

## Pre-recording
- [ ] Confirm the dev server is running and the page loads without console errors.
- [ ] Have a suitable, consented adult portrait ready (well-lit, front-facing,
      face filling >60% of frame width, no filters/sunglasses).
- [ ] Confirm you are willing to consume one YouCam API credit for the demo.

## Recording flow (shortest coherent path)

1. **Landing page** (~5s)
   - Show the hero, "AI Skin Intelligence" badge, and the three-step explainer.
   - Note the "4 concerns measured" and "0 photos stored" stats.

2. **Photo upload** (~10s)
   - Click "Start your analysis" or scroll to the upload card.
   - Drag in or browse for the consented portrait.
   - Show the photo-quality tips panel and the privacy disclosure
     ("DERMALENS does not store your photo…").

3. **Analysis** (~60s)
   - Click "Analyze my skin".
   - Show the loading state with progress bar and stage labels.
   - Wait for the real YouCam result to return.

4. **Results** (~30s)
   - Show the priority focus areas (concern cards).
   - Explain the difference between the **YouCam health score** (higher =
     healthier) and the **DERMALENS focus estimate** (an app hint, not a
     clinical severity score).
   - Point out the source attribution banner ("Measured by the YouCam API").
   - If masks were returned, toggle one overlay on.

5. **Evidence Trail** (~30s) — NEW
   - Tap a concern card to open the Evidence Trail panel.
   - Walk through the four sections:
     - "What YouCam returned" — actual raw_score, ui_score, mask availability.
     - "How DERMALENS interpreted it" — the focus estimate formula and its
       limitation.
     - "How the routine responds" — which steps link to this concern and why.
     - "What remains unknown" — no diagnosis, no efficacy guarantee.
   - If a mask is available, click "Show [concern] mask" to display it.
   - Click "All concerns" to return to the full list.

6. **Routine & goals** (~30s)
   - Scroll to the Routine & products section.
   - Select one or two goals (e.g. "Breakout-prone appearance").
   - Toggle the routine style between Essentials / Balanced / Optional targeted.
   - Set skin sensitivity to "Yes" — show how the optional targeted step
     disappears and the data note explains why.

7. **Pipeline explainer** (~15s) — NEW
   - Expand "How DERMALENS makes a recommendation".
   - Walk through the 6-step pipeline, noting the "YouCam API" vs
     "DERMALENS engine" source badges.

8. **Routine Passport** (~20s) — NEW
   - Click "View Routine Passport".
   - Show the preview: branding, goals, analysis summary, AM/PM steps,
     products with official info links, limitations, medical disclaimer.
   - Point out the "Print / Save as PDF" button.
   - Note that no photo is embedded and no data was uploaded.
   - Close the passport.

9. **Product shortlist** (~20s)
   - Scroll to the curated product cards.
   - Open "Why this match?" on one card — show the goal/concern/category reasons.
   - Point out "Check current regional price" and "Availability not verified".
   - Click "View official product information" to show it opens the real
     manufacturer page (CeraVe / Neutrogena / The Ordinary).

10. **Trust & close** (~10s)
    - Scroll to the "Why these recommendations?" panel.
    - End on the TrustNotice: "Not a medical diagnosis."

## If the live analysis fails
- Show the error state and the crop-recovery button (if face-too-small).
- Do NOT retry automatically. Explain the error and end the recording,
  or crop and retry once manually.

## Total estimated time: ~4 minutes
