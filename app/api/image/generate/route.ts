import { NextRequest, NextResponse } from 'next/server';
import { generateCoverImage } from '@/lib/minimax/image';
import { getErrorMessage } from '@/lib/minimax/errors';
import { isDev } from '@/lib/env';
import { saveCoverImage } from '@/lib/storage/local-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = body.apiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
    }

    if (!body.prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await generateCoverImage(apiKey, {
      prompt: body.prompt,
      responseFormat: body.response_format || 'url',
    });

    // Save cover image to local storage in dev environment
    if (isDev && body.recordId && result.data?.image_urls?.[0]) {
      try {
        const imageRes = await fetch(result.data.image_urls[0]);
        if (imageRes.ok) {
          const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
          await saveCoverImage(body.recordId, imageBuffer);
        }
      } catch {
        // Cover save failure is non-blocking
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const extracted = extractApiError(error);
    if (extracted.statusCode) {
      return NextResponse.json(
        { error: getErrorMessage(extracted.statusCode), statusCode: extracted.statusCode, rawError: extracted.rawMessage || message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface ExtractedError {
  statusCode: number | null;
  rawMessage?: string;
}

function extractApiError(error: unknown): ExtractedError {
  // Case 1: error has apiResponse attached (from our own throw)
  if (error && typeof error === 'object' && 'apiResponse' in error) {
    const apiResp = (error as { apiResponse?: { base_resp?: { status_code?: number; status_msg?: string } } }).apiResponse;
    if (apiResp?.base_resp) {
      return {
        statusCode: apiResp.base_resp.status_code ?? null,
        rawMessage: apiResp.base_resp.status_msg,
      };
    }
  }
  // Case 2: axios error with response data
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { base_resp?: { status_code?: number; status_msg?: string } } } }).response;
    if (resp?.data?.base_resp) {
      return {
        statusCode: resp.data.base_resp.status_code ?? null,
        rawMessage: resp.data.base_resp.status_msg,
      };
    }
  }
  return { statusCode: null };
}
