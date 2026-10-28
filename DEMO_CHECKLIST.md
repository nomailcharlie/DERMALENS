# DERMALENS — Demo Recording Checklist

A short, honest recording flow. Do NOT claim a live analysis succeeded unless
one actually ran during the recording.

## Pre-recording
- [ ] Confirm the dev server is running and the page loads without console errors.
- [ ] Have a suitable, consented adult portrait ready (well-lit, front-facing,
      face filling >60% of frame width, no filters/sunglasses).
- [ ] Confirm you are willing to consume one YouCam API credit for the live demo.
- [ ] If using the saved demo: confirm `public/demo/analysis.json` is a real
      captured fixture (not the placeholder template) and `public/demo/portrait.jpg`
      exists.

## Two demo options

DERMALENS offers two distinct entry points on the landing screen:

1. **"Try the demo"** — loads a saved, fully rendered sample. No API request
   is made. Results, masks, and the Evidence Trail are from a previous YouCam
   analysis. Clearly labeled "Saved demo sample."
2. **"Analyze my photo"** — runs a real YouCam analysis on the user's selected
   image. Consumes one API credit.

## Recording flow (shortest coherent path)

1. **Landing page** (~5s)
   - Show the hero, "AI Skin Intelligence" badge, and the three-step explainer.
   - Note the "4 concerns measured" and "0 photos stored" stats.
   - Point out the two buttons: "Analyze my photo" and "Try the demo."

2. **Photo upload** (~10s)
   - Click "Analyze my photo" or scroll to the upload card.
   - Drag in or browse for the consented portrait.
   - Show the photo-quality tips panel and the privacy disclosure.

3. **Analysis** (~60s)
   - Click "Analyze my skin".
   - Show the loading state with progress bar and stage labels.
   - Wait for the real YouCam result to return.

4. **Results — visual overlay viewer** (~30s)
   - Show the **OverlayViewer** with the analyzed photo and the first mask.
   - Toggle between **Original**, **Overlay**, and **Side-by-side** modes.
   - Adjust the **opacity slider** to show the mask blending.
   - Switch concern tabs (Pores, Skin Texture, Wrinkles, Acne & Blemishes).
   - Explain: masks are direct YouCam model outputs.

5. **Priority focus areas** (~20s)
   - Show the concern cards with YouCam health scores and DERMALENS focus estimates.
   - Explain: higher YouCam score = healthier skin. Focus estimate is a
     prioritization hint, not a clinical severity score or treatment prediction.

6. **Evidence Trail** (~30s)
   - Tap a concern card to open the Evidence Trail panel.
   - Walk through the four sections:
     - "What YouCam returned" — actual raw_score, ui_score, mask availability.
     - "How DERMALENS interpreted it" — the focus estimate formula and its
       limitation.
     - "How the routine responds" — which steps link to this concern and why.
     - "What remains unknown" — no diagnosis, no efficacy guarantee.
   - If a mask is available, click "Show [concern] mask" to display it in the
     overlay viewer.
   - Click "All concerns" to return to the full list.

7. **Routine & goals** (~30s)
   - Scroll to the Routine & products section.
   - Select one or two goals (e.g. "Breakout-prone appearance").
   - Toggle the routine style between Essentials / Balanced / Optional targeted.
   - Set skin sensitivity to "Yes" — show how the optional targeted step
     disappears and the data note explains why.

8. **Pipeline explainer** (~15s)
   - Expand "How DERMALENS makes a recommendation".
   - Walk through the 6-step pipeline, noting the "YouCam API" vs
     "DERMALENS engine" source badges.

9. **Routine Passport** (~20s)
   - Click "View Routine Passport".
   - Show the preview: branding, goals, analysis summary, AM/PM steps,
     products with official info links, limitations, medical disclaimer.
   - Point out the "Print / Save as PDF" button.
   - Note that no photo is embedded and no data was uploaded.
   - Close the passport.

10. **Product shortlist** (~20s)
    - Scroll to the curated product cards.
    - Open "Why this match?" on one card — show the goal/concern/category reasons.
    - Point out "Check current regional price" and "Availability not verified".
    - Click "View official product information" to show it opens the real
      manufacturer page (CeraVe / Neutrogena, The Ordinary).

11. **Trust & close** (~10s)
    - Scroll to the "Why these recommendations?" panel.
    - End on the TrustNotice: "Not a medical diagnosis."

## If the live analysis fails
- Show the error state with the tailored guidance.
- `error_src_face_too_small`: show the crop button and "Choose a closer photo".
- `error_large_face_angle`: show the straight-on photo tips (no crop button).
- Do NOT retry automatically. Explain the error and end the recording,
  or crop and retry once manually.

## Saved demo fallback
- If no API credits are available, use "Try the demo" instead.
- The demo is clearly labeled "Saved demo sample — these are results from a
  previous YouCam analysis of this sample image. No live analysis is being run."
- Do not pretend the demo is a live analysis.

## Capturing a demo fixture (developer only)
1. Run the app in development mode (`npm run dev`).
2. Perform a genuine live analysis with a rights-cleared portrait.
3. On the results screen, expand the "Dev: Capture Demo Fixture" bar.
4. Click "Download all fixture files" — downloads the portrait, analysis.json,
   and mask PNGs.
5. Place the files in `public/demo/` (portrait.jpg, analysis.json, masks/*.png).
6. Edit `analysis.json` to remove the `_status: "placeholder"` field if present.
7. Commit only a rights-cleared or fictional portrait — never your personal photo.

## Total estimated time: ~4 minutes
