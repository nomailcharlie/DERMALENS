// DERMALENS — analyze-skin edge function
// Proxies the Perfect Corp YouCam Skin Analysis API, keeping the
// YOUCAM_API_KEY secret on the server. Implements the full documented
// workflow: File API register -> upload bytes -> create task -> poll status.
// Passes upstream error_code through to the client for tailored UI guidance.
//
// Reference: https://docs.perfectcorp.com/reference/ai_skin_analysis
// API server: https://yce-api-01.makeupar.com
// Auth: Authorization: Bearer ${YOUCAM_API_KEY}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_BASE = "https://yce-api-01.makeupar.com";
const SD_ACTIONS = ["wrinkle", "pore", "texture", "acne"];

// Polling config — processed results are retained 24h, so intervals can be
// relaxed. We cap total polling to keep the edge function within limits.
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 24; // ~60s ceiling in this function

interface ClientRequest {
  // Base64 data URL of the prepared JPEG (already resized by the browser).
  image: string;
  // Optional: an existing task_id to resume polling (after a prior timeout).
  taskId?: string;
}

interface ApiErrorBody {
  status?: number;
  error?: string;
  error_code?: string;
}

interface FileApiResponse {
  status: number;
  data?: {
    files?: {
      content_type: string;
      file_name: string;
      file_id: string;
      requests: { method: string; url: string; headers: Record<string, string> }[];
    }[];
  };
  error?: string;
  error_code?: string;
}

interface TaskCreateResponse {
  status: number;
  data?: { task_id: string };
  error?: string;
  error_code?: string;
}

interface OutputEntry {
  type: string;
  ui_score?: number;
  raw_score?: number;
  mask_urls?: string[];
}

interface TaskStatusResponse {
  status: number;
  data?: {
    task_status: "running" | "success" | "error";
    results?: { output?: OutputEntry[] };
  };
  error?: string;
  error_code?: string;
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function fail(
  message: string,
  retryable: boolean,
  status = 500,
  errorCode: string | null = null,
): Response {
  return json({ error: message, retryable, ...(errorCode ? { error_code: errorCode } : {}) }, status);
}

function authHeaders(): Record<string, string> {
  const key = Deno.env.get("YOUCAM_API_KEY");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/** Decode a data URL into raw bytes for the S3 PUT. */
function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mimeType: string } {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Malformed image data.");
  const meta = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeTypeMatch = meta.match(/data:([^;]+)/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return { bytes, mimeType };
}

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body.error) {
      const msg = body.error_code ? `${body.error} (${body.error_code})` : body.error;
      return /https?:\/\//.test(msg) ? 'Upstream API error.' : msg;
    }
  } catch {
    // fall through
  }
  return `Upstream returned ${res.status}`;
}

/** Step B: register the file metadata and obtain file_id + upload URL. */
async function registerFile(
  bytes: Uint8Array,
  fileName: string,
  contentType: string,
): Promise<{ fileId: string; uploadUrl: string; method: string; headers: Record<string, string> }> {
  const res = await fetch(`${API_BASE}/s2s/v2.0/file`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: bytes.length }],
    }),
  });
  if (!res.ok) throw new Error(`File registration failed: ${await readApiError(res)}`);
  const body = (await res.json()) as FileApiResponse;
  const file = body.data?.files?.[0];
  if (!file?.file_id || !file.requests?.[0]?.url) {
    throw new Error("File API response missing file_id or upload URL.");
  }
  const req = file.requests[0];
  return { fileId: file.file_id, uploadUrl: req.url, method: req.method, headers: req.headers };
}

/** Step C: upload the actual image bytes to the signed URL. */
async function uploadBytes(
  bytes: Uint8Array,
  uploadUrl: string,
  method: string,
  headers: Record<string, string>,
): Promise<void> {
  // Build clean headers: skip Content-Length (let fetch compute it) and use
  // only the Content-Type from the signed-URL headers. Setting Content-Type
  // both in headers and in the Blob can cause S3 signature mismatches.
  const contentType = headers['Content-Type'] || headers['content-type'] || 'image/jpeg';
  const uploadHeaders: Record<string, string> = { 'Content-Type': contentType };

  const blob = new Blob([bytes], { type: contentType });

  // Retry on connection errors — S3 pre-signed uploads can see transient
  // connection resets that resolve on a second attempt.
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(uploadUrl, {
        method,
        headers: uploadHeaders,
        body: blob,
      });
      if (res.ok) return;
      // Non-connection error (e.g. 403 signature mismatch) — don't retry.
      throw new Error(`Image upload to storage failed (${res.status}).`);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      // Only retry on connection-level errors, not HTTP status errors.
      const isConnError = lastErr.message.includes('Could not upload') === false &&
        !/failed \(\d+\)/.test(lastErr.message);
      if (!isConnError) break;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Could not upload the image to the analysis provider.');
}

/** Step D: create the skin-analysis task and obtain task_id. */
async function createTask(fileId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/s2s/v2.0/task/skin-analysis`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: SD_ACTIONS,
      format: "json",
    }),
  });
  if (!res.ok) throw new Error(`Task creation failed: ${await readApiError(res)}`);
  const body = (await res.json()) as TaskCreateResponse;
  if (!body.data?.task_id) throw new Error("Task creation response missing task_id.");
  return body.data.task_id;
}

/** Step E: poll task status once. */
async function pollTask(taskId: string): Promise<TaskStatusResponse> {
  const res = await fetch(`${API_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Status poll failed: ${await readApiError(res)}`);
  return (await res.json()) as TaskStatusResponse;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return fail("Method not allowed.", false, 405);
  }

  try {
    const key = Deno.env.get("YOUCAM_API_KEY");
    if (!key) {
      return fail(
        "The YouCam API key is not configured on the server. Add the YOUCAM_API_KEY secret to enable skin analysis.",
        false,
        503,
      );
    }

    const payload = (await req.json()) as ClientRequest;
    if (!payload || !payload.image) {
      return fail("No image was provided.", false, 400);
    }

    // If the client supplied an existing task_id, resume polling only — never
    // create a duplicate task.
    let taskId = payload.taskId ?? null;

    if (!taskId) {
      const { bytes, mimeType } = dataUrlToBytes(payload.image);
      const fileName = `dermalens_${Date.now()}.jpg`;
      const contentType = mimeType === "image/png" ? "image/png" : "image/jpeg";

      const reg = await registerFile(bytes, fileName, contentType);
      await uploadBytes(bytes, reg.uploadUrl, reg.method, reg.headers);
      taskId = await createTask(reg.fileId);
    }

    // Poll for completion within this invocation's window. If we hit the
    // ceiling, return the task_id so the client can resume in a follow-up call.
    let last: TaskStatusResponse | null = null;
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      last = await pollTask(taskId);
      const status = last.data?.task_status;
      if (status === "success") {
        return json({ task_id: taskId, status: "success", result: last.data?.results ?? null });
      }
      if (status === "error") {
        const upstreamError = last.data?.error ?? last.error ?? "The analysis engine reported an error.";
        return fail(
          upstreamError,
          true,
          502,
          last.error_code ?? null,
        );
      }
    }

    // Still running — hand the task_id back so the client can continue polling.
    return json({ task_id: taskId, status: "running" }, 202);
  } catch (err) {
    // Sanitize: never leak signed upload URLs, credentials, or upstream
    // connection details. If the error mentions a URL, replace it.
    let message = err instanceof Error ? err.message : 'Unexpected server error.';
    if (/https?:\/\//.test(message)) {
      message = 'The analysis service encountered a connection error. Please try again.';
    }
    return fail(message, true);
  }
});
