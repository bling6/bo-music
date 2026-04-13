import axios from "axios";
import { z } from "zod";

const lyricsRequestSchema = z.object({
  mode: z.enum(["write_full_song", "edit"]),
  prompt: z.string().optional(),
  lyrics: z.string().optional(),
  title: z.string().optional(),
});

export type LyricsRequest = z.infer<typeof lyricsRequestSchema>;

export interface LyricsResponse {
  song_title: string;
  style_tags: string;
  lyrics: string;
  base_resp: { status_code: number };
}

export async function generateLyrics(
  apiKey: string,
  params: LyricsRequest,
): Promise<LyricsResponse> {
  const validated = lyricsRequestSchema.parse(params);

  const { data } = await axios.post<LyricsResponse>(
    "https://api.minimaxi.com/v1/lyrics_generation",
    validated,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60 * 1000 * 5,
    },
  );

  if (data.base_resp.status_code !== 0) {
    const err = new Error(
      `Lyrics generation failed with status code: ${data.base_resp.status_code}`,
    );
    (err as any).apiResponse = data;
    throw err;
  }

  return data;
}
