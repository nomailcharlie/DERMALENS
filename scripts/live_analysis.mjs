// One-shot live analysis driver. Calls the deployed analyze-skin edge
// function with a real image and follows the same poll-resumption flow the
// browser client uses. Prints a sanitized summary of the result.

import { readFileSync, writeFileSync } from 'node:fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const IMAGE_PATH = '/tmp/face_test.jpg';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars.');
  process.exit(1);
}

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/analyze-skin`;
const IMAGE_B64 = readFileSync(IMAGE_PATH).toString('base64');
const DATA_URL = `data:image/jpeg;base64,${IMAGE_B64}`;

const POLL_INTERVAL_MS = 3000;
const MAX_RESUMPTIONS = 8;

function headers() {
  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function callEdge(taskId) {
  const body = taskId ? { image: DATA_URL, taskId } : { image: DATA_URL };
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return { status: res.status, body: parsed };
}

async function main() {
  let taskId = null;
  for (let attempt = 0; attempt <= MAX_RESUMPTIONS; attempt += 1) {
    console.log(`[attempt ${attempt}] calling edge function${taskId ? ' (resume ' + taskId.slice(0, 12) + '...)' : ''}...`);
    const { status, body } = await callEdge(taskId);
    console.log(`  HTTP ${status}`);

    if (status >= 400) {
      console.error('  EDGE ERROR:', JSON.stringify(body, null, 2));
      process.exit(2);
    }

    if (body.status === 'success') {
      console.log('  SUCCESS — task_id:', body.task_id);
      const output = body.result?.output;
      if (!output || output.length === 0) {
        console.log('  No output entries returned.');
      } else {
        console.log(`  ${output.length} concern entries:`);
        for (const e of output) {
          const masks = Array.isArray(e.mask_urls) ? e.mask_urls.length : 0;
          console.log(
            `    type=${e.type}  ui_score=${e.ui_score}  raw_score=${e.raw_score}  masks=${masks}`,
          );
        }
      }
      writeFileSync('/tmp/live_result.json', JSON.stringify(body, null, 2));
      console.log('  Full result saved to /tmp/live_result.json');
      return;
    }

    if (body.status === 'running') {
      taskId = body.task_id;
      console.log('  RUNNING — task_id:', taskId);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    console.error('  UNEXPECTED body:', JSON.stringify(body, null, 2));
    process.exit(3);
  }
  console.error('Exhausted poll resumptions. Last task_id:', taskId);
  process.exit(4);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(5);
});
