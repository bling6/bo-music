import axios from 'axios';
import { z } from 'zod';

const audioSettingSchema = z.object({
  sample_rate: z.coerce.number().int().optional(),
  bitrate: z.coerce.number().int().optional(),
  format: z.enum(['mp3', 'wav', 'pcm']).optional(),
});

const musicRequestSchema = z.object({
  model: z.enum(['music-2.6', 'music-2.6-free']),
  prompt: z.string().optional(),
  lyrics: z.string().optional(),
  lyrics_optimizer: z.boolean().optional(),
  is_instrumental: z.boolean().optional(),
  output_format: z.enum(['url', 'hex']).default('hex'),
  audio_setting: audioSettingSchema.optional(),
  aigc_watermark: z.boolean().optional(),
});

export type MusicRequest = z.infer<typeof musicRequestSchema>;

export interface MusicResponse {
  data: {
    audio: string;
    status: number;
  };
  extra_info: {
    music_duration: number;
    music_sample_rate: number;
    music_channel: number;
    bitrate: number;
    music_size: number;
  };
  base_resp: { status_code: number };
}

export async function generateMusic(apiKey: string, params: MusicRequest): Promise<MusicResponse> {
  const validated = musicRequestSchema.parse(params);

  const { data } = await axios.post<MusicResponse>(
    'https://api.minimaxi.com/v1/music_generation',
    validated,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 1000 * 60 * 20, // 20 minutes for music generation
    }
  );

  if (data.base_resp.status_code !== 0) {
    const err = new Error(`Music generation failed with status code: ${data.base_resp.status_code}`);
    (err as any).apiResponse = data;
    throw err;
  }

  return data;
}
