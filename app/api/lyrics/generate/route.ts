import { NextRequest, NextResponse } from 'next/server';
import { generateLyrics } from '@/lib/minimax/lyrics';
import { getErrorMessage } from '@/lib/minimax/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = body.apiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
    }

    const result = await generateLyrics(apiKey, {
      mode: body.mode,
      prompt: body.prompt,
      lyrics: body.lyrics,
      title: body.title,
    });

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
