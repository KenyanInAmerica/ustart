// Server-side PDF fetch + watermark pipeline.
// Generates a short-lived signed URL from Supabase Storage, downloads the
// raw PDF bytes, stamps them with the user's email via watermarkPdf(), and
// returns the watermarked bytes as a Uint8Array ready to be streamed.
// This file must only be imported in Server Actions and Route Handlers.

import { createServiceClient } from "@/lib/supabase/service";
import { watermarkPdf } from "@/lib/pdf/watermark";

// Fetches a PDF from the private pdfs bucket, watermarks it with the given
// email, and returns the raw watermarked bytes.
// Throws on storage or network errors so the caller can return an appropriate
// HTTP response.
export async function fetchAndWatermarkPdf(
  filePath: string,
  email: string
): Promise<Uint8Array> {
  const service = createServiceClient();

  // 5-minute signed URL — long enough to survive a slow fetch but short enough
  // to limit exposure if the URL is somehow leaked before use.
  const { data, error } = await service.storage
    .from("pdfs")
    .createSignedUrl(filePath, 5 * 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Storage error: ${error?.message ?? "no signed URL"}`);
  }

  const response = await fetch(data.signedUrl);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return watermarkPdf(new Uint8Array(buffer), email);
}
