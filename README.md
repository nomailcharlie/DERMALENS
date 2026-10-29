# DERMALENS

**Understand your skin. Choose your next step with confidence.**

DERMALENS is a cosmetic AI skin-analysis experience for adults who want a clearer starting point for a skincare routine. It reads one facial photo, presents four visible concern categories, and turns the returned measurements into an explainable morning and evening routine.

## Links

- **Live demo:** https://dermalens-skincare-w-va22.bolt.host
- **GitHub repository:** https://github.com/nomailcharlie/DERMALENS

## Problem and audience

Skincare advice is often difficult to evaluate: marketing is opaque, prices vary by region, and many tools provide a score without explaining what it means. DERMALENS is intended for adults 18+ who want a transparent, cosmetic image-based starting point—not a diagnosis, treatment plan, or shopping cart.

## Main features

- **Live YouCam Skin Analysis:** upload a photo and receive results from the Perfect Corp YouCam Skin Analysis API.
- **Four concern categories:** pores, skin texture, wrinkles, and acne/blemishes.
- **Visual evidence:** switch between the original photo, mask overlay, and side-by-side views when masks are available.
- **Skin-to-Shelf Evidence Trail:** see the returned scores, DERMALENS interpretation, related routine steps, and known limitations.
- **Explainable routine planning:** choose goals, routine intensity, and skin sensitivity to shape the recommendation.
- **Product shortlist:** curated manufacturer information links with prices and regional availability clearly marked as unverified.
- **Routine Passport:** generate a printable client-side summary without embedding the source photo.
- **Saved demo:** explore a complete captured result without consuming a new YouCam API unit.

## How YouCam integration works

The browser never receives the YouCam API key. The live analysis boundary is:

```text
Browser
  -> prepares the selected image locally
  -> POSTs the prepared image to the Supabase Edge Function

Supabase Edge Function: analyze-skin
  -> reads YOUCAM_API_KEY from server-side secret storage
  -> registers the file with YouCam
  -> uploads the image to the YouCam-provided storage URL
  -> creates a skin-analysis task for wrinkle, pore, texture, and acne
  -> polls the task status and returns normalized results

Browser
  -> displays the results
  -> calculates routine recommendations locally
```

The Edge Function is configured with JWT verification enabled. It also resumes polling when YouCam reports that a task is still running. The client normalizes the response into the app’s typed analysis result.

YouCam health scores are health-favorable: a higher score indicates healthier-looking skin for that measurement. DERMALENS calculates `focusEstimate` as `100 - raw_score` and uses it only as an application-level prioritization hint. It is not clinical severity, a diagnosis, or a prediction of treatment benefit.

Reference: https://docs.perfectcorp.com/reference/ai_skin_analysis

## Live analysis versus saved demo

### Analyze my photo

This is the live path. The browser prepares the selected image, sends it to the `analyze-skin` Supabase Edge Function, and the function communicates with YouCam. This path uses a YouCam API unit and depends on the server-side `YOUCAM_API_KEY` secret being configured.

The browser converts the image to JPEG, preserves its aspect ratio, avoids upscaling, downsizes oversized images, and checks the minimum image dimensions required by the integration before sending it.

### Try the demo

This path loads the saved fixture from `public/demo/` and does not make a new YouCam or Edge Function analysis request. The fixture contains:

- `public/demo/portrait.jpg`
- `public/demo/analysis.json`
- Four masks in `public/demo/masks/` for pores, texture, wrinkles, and acne/blemishes

The included portrait is a synthetic sample image used for the captured demo fixture. The JSON preserves the saved scores, metadata, task ID, and overlay paths from a previous successful YouCam analysis. The demo button appears only when the analysis file, portrait, and every referenced mask are present and valid.

## Technology and architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, and Lucide React icons
- **Client backend access:** `@supabase/supabase-js` invokes the deployed Edge Function
- **Server boundary:** Supabase Edge Function at `supabase/functions/analyze-skin/index.ts`
- **AI provider:** Perfect Corp YouCam Skin Analysis API
- **Recommendation layer:** deterministic client-side routine and product-matching logic
- **Persistence:** no application database, accounts, or analysis history
- **Saved fixture:** static files under `public/demo/`

The Vite alias `@` maps to `src/`. The Supabase function is declared in `supabase/config.toml` as `analyze-skin` with `verify_jwt = true`.

## Local installation and run

From the repository root:

```bash
npm install
npm run dev
```

To create and preview a production build:

```bash
npm run build
npm run preview
```

## Required environment variables and secrets

The browser-side variables are read by `src/services/skinAnalysis.ts`:

| Name | Where it is configured | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Local `.env` and hosted client environment | Supabase project URL used for the Edge Function request |
| `VITE_SUPABASE_ANON_KEY` | Local `.env` and hosted client environment | Public Supabase anon key sent with the request |

The Edge Function reads this server-only secret in `supabase/functions/analyze-skin/index.ts`:

| Name | Where it is configured | Purpose |
|---|---|---|
| `YOUCAM_API_KEY` | Supabase Edge Function secret storage | Authenticates server-to-server requests to YouCam |

Never put `YOUCAM_API_KEY` in the browser environment, README, source-controlled files, or the client bundle. The `VITE_` variables are intentionally exposed to the browser because they identify the Supabase project and use the public anon key; access to the analysis function is still controlled by its JWT configuration.

## Available checks

The repository defines these npm scripts:

```bash
npm run lint
npm run typecheck
npm run build
```

The repository also contains standalone Node test files at `scripts/test-phase5.mts` and `scripts/test-phase6.mts`, but there is no `npm test` script or committed test-runner configuration in `package.json`. A separate fixture-validation npm script is not defined; the saved demo fixture is checked at runtime by the demo loader before the button is shown or the fixture is loaded.

## Privacy and image processing

- The selected image is prepared in the browser before live analysis: it may be resized and converted to JPEG to meet the integration limits.
- Live analysis sends the prepared image to YouCam through the Supabase Edge Function. DERMALENS does not store the photo in its own database.
- The current in-app notice states that the photo is processed by YouCam and removed by the provider within 30 days. Result download links are valid for two hours after processing completes.
- Do not interpret this as “never processed” or “never retained”: the image is sent to the provider and may be retained according to the provider’s processing terms during that period.
- The saved demo uses local fixture files and does not send a new image for analysis.
- The Routine Passport is generated in the browser, contains no source photo, and is not uploaded by the app.
- There are no accounts, persistent analysis history, or application database records in this project.

## Limitations and responsible use

- **Not a medical diagnosis.** DERMALENS provides cosmetic, image-based observations for educational purposes only. Consult a qualified dermatologist or clinician for diagnosis or treatment.
- Results depend on lighting, focus, angle, facial positioning, makeup, filters, and the quality of the selected image.
- A YouCam score is a model output, not a clinical measurement. Higher health-favorable scores indicate healthier-looking skin for that concern; they do not establish a condition or its cause.
- `focusEstimate` is an application-generated prioritization hint based on `100 - raw_score`, not clinical severity and not a treatment-outcome prediction.
- Routine suggestions use user-selected goals and sensitivity settings. They do not guarantee product effectiveness or suitability.
- Product prices and regional availability are not verified. The app links to official manufacturer information pages rather than retailer checkout pages.
- Product information, ratings, reviews, inventory, discounts, clinical validation, customer trials, and business partnerships are not claimed by this project.
- Use a consented adult portrait and avoid relying on the output for urgent or medical decisions.

## Hackathon context

DERMALENS is a hackathon project demonstrating a secure server-side AI integration, transparent interpretation of model output, evidence-oriented explanations, and responsible cosmetic product guidance. The implementation intentionally favors traceability and clear unknowns over fabricated precision.

## License

The project’s original source code is licensed under the MIT License. See [LICENSE](LICENSE).

That license does not grant ownership of Perfect Corp/YouCam services, manufacturer trademarks or product information, or third-party libraries and assets.
