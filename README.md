# DERMALENS

**Understand your skin. Choose your next step with confidence.**

DERMALENS is a cosmetic AI skin-analysis application that reads a single facial
photo, surfaces the concerns that matter today, and maps them to a transparent
morning and evening skincare routine with explainable product matches.

## The problem

Consumers are overwhelmed by skincare marketing. They don't know which concerns
are real for their skin, what products actually address those concerns, or
whether a routine is justified. Marketing claims are opaque, prices vary by
region, and "AI-powered" apps rarely explain their reasoning.

## Target audience

Adults (18+) who want an evidence-based starting point for a skincare routine —
not a medical diagnosis, not a shopping cart, and not a black-box score.

## Solution and key differentiators

1. **Real YouCam Skin Analysis integration** — genuine API results, not mock
   data. Scores, masks, and attributes come from the Perfect Corp YouCam model.
2. **Explainable recommendation engine** — a deterministic, transparent
   pipeline that traces each concern from YouCam measurement → DERMALENS focus
   estimate → routine step → product match, with reasons for every decision.
3. **Skin-to-Shelf Evidence Trail** — tap any concern to see exactly what
   YouCam returned, how DERMALENS interpreted it, which routine steps respond,
   and what remains unknown.
4. **Routine Passport** — a printable, one-page skincare plan generated
   client-side. No photo embedded, no data uploaded.
5. **Honest limitations** — unverified prices are shown as unverified. No
   fabricated ratings, reviews, stock levels, or efficacy claims. Cosmetic
   analysis is never presented as a medical diagnosis.

## Screenshots

> Screenshots will be added after the first successful live demo recording.
> Placeholders:
> - `docs/screenshot-landing.png` — Landing page with upload card
> - `docs/screenshot-results.png` — Analysis results with concern cards
> - `docs/screenshot-evidence-trail.png` — Evidence Trail panel open
> - `docs/screenshot-routine.png` — Routine builder with product shortlist
> - `docs/screenshot-passport.png` — Routine Passport print preview

## Architecture and data flow

```
Browser (React + Vite)
  ├── User selects photo → image prepared client-side (resize, JPEG)
  ├── POST to Supabase Edge Function (analyze-skin)
  │     ├── Holds YOUCAM_API_KEY server-side (never exposed to browser)
  │     ├── Registers file with YouCam File API
  │     ├── Uploads image to YouCam-provided storage URL
  │     ├── Creates YouCam task (SD concerns: wrinkle, pore, texture, acne)
  │     ├── Polls task status until success/error/timeout
  │     └── Returns normalized results to browser
  ├── Browser normalizes YouCam output → SkinAnalysisResult
  ├── Deterministic recommendation engine generates routine + product matches
  └── Evidence Trail + Routine Passport rendered client-side

No database, no accounts, no persistent storage of photos or analysis history.
```

### YouCam API integration and task lifecycle

1. **File registration**: The edge function calls YouCam's File API to register
   the image and receive an upload URL + headers.
2. **Image upload**: The image is uploaded to the YouCam-provided storage URL.
3. **Task creation**: The function creates a YouCam skin-analysis task with SD
   concern actions (`wrinkle`, `pore`, `texture`, `acne`).
4. **Polling**: The function polls the task status endpoint until the task
   succeeds, errors, or the internal polling ceiling is reached. If still
   running, the browser transparently resumes polling by re-calling the
   function with the `task_id`.
5. **Normalization**: Raw YouCam `output` entries are typed and normalized.
   `raw_score` and `ui_score` are health-favorable (higher = healthier).
6. **Score direction**: DERMALENS computes `focusEstimate = 100 - raw_score` as
   an application-level prioritization hint — never as a YouCam severity score.

YouCam API docs: https://docs.perfectcorp.com/reference/ai_skin_analysis

## Technology stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons
- **Backend**: Supabase Edge Functions (Deno runtime)
- **AI**: Perfect Corp YouCam Skin Analysis API (server-side proxy)
- **Testing**: Node.js native test runner (`node:test`)
- **No database, no auth, no accounts**

## Local setup and run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Production build
npm run build

# Preview the production build
npm run preview
```

## Server-side secret configuration

The YouCam API key is stored as a Supabase Edge Function secret named
`YOUCAM_API_KEY`. It is never committed to the repository, never exposed to the
browser, and never included in the client bundle.

To configure it (if deploying your own instance):

```bash
# Using the Supabase dashboard or CLI, set the edge function secret:
YOUCAM_API_KEY=your_api_key_here
```

Do NOT put the real key in `.env`, `config.toml`, or any committed file. The
edge function reads it from `Deno.env.get('YOUCAM_API_KEY')` at runtime.

## Supabase edge function deployment

The `analyze-skin` edge function lives in `supabase/functions/analyze-skin/`.
It is configured in `supabase/config.toml` with `verify_jwt = true`.

To deploy (via Supabase MCP tools or dashboard):
1. Ensure `YOUCAM_API_KEY` is set as an edge function secret.
2. Deploy the function from `supabase/functions/analyze-skin/index.ts`.
3. The function is invoked at:
   `POST {SUPABASE_URL}/functions/v1/analyze-skin`

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (client) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (client) | Supabase anon key (public) |
| `YOUCAM_API_KEY` | Edge Function secret | YouCam API key (server-only, never in client) |

The `.env` file contains only public Supabase keys. No private credentials are
committed to the repository.

## Test, typecheck, lint and build commands

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript compiler (no emit)
npm run build       # Vite production build
```

Engine and API-response fixture tests use Node's native test runner and are run
via `npx tsx` against test scripts. See the test scripts in `scripts/`.

## Privacy, image-retention and safety limitations

- DERMALENS does not store your photo. It is sent to the YouCam API for
  processing and removed by the provider within 30 days.
- The Routine Passport is generated entirely client-side. No photo or personal
  data is uploaded to any external service.
- No accounts, no database, no persistent analysis history.
- Cosmetic image analysis does not establish a medical diagnosis, determine the
  cause of a skin concern, or prove that a product will work.
- Results depend on photo quality, lighting, and facial positioning.

## Product catalog limitations

- The catalog contains 6 products from 3 brands (CeraVe, Neutrogena, The
  Ordinary).
- All product prices are unverified. The UI shows "Check current regional
  price" and links to official manufacturer information pages.
- Regional availability is not confirmed for any product.
- No ratings, reviews, stock levels, discounts, or checkout links are included.
- Product information links point to official manufacturer catalog/range pages,
  not to retailer checkout pages.

## Demo checklist

See `DEMO_CHECKLIST.md` for the recommended recording flow, including the new
Evidence Trail and Routine Passport features.

## Public demo URL

> Demo URL: _to be added after deployment_

## License

MIT License for the project's original code. See `LICENSE`.

This license does not grant ownership of Perfect Corp/YouCam APIs, manufacturer
trademarks (CeraVe, Neutrogena, The Ordinary), or any third-party assets.
