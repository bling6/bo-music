import axios from 'axios';
import { z } from 'zod';

const imageRequestSchema = z.object({
  model: z.literal('image-01'),
  prompt: z.string().min(1).max(1500),
  aspect_ratio: z.literal('1:1').optional(),
  response_format: z.enum(['url', 'base64']).default('url'),
  n: z.literal(1).optional(),
  prompt_optimizer: z.boolean().default(true),
  seed: z.number().optional(),
  aigc_watermark: z.boolean().optional(),
});

export type ImageRequest = z.infer<typeof imageRequestSchema>;

export interface ImageResponse {
  data: {
    image_urls?: string[];
    image_base64?: string[];
  };
  metadata: {
    success_count: number;
    failed_count: number;
  };
  id: string;
  base_resp: { status_code: number };
}

export function buildCoverPrompt(songDescription: string, styleTags: string): string {
  const parts = ['A vibrant album cover'];
  if (styleTags) {
    parts.push(`in ${styleTags} style`);
  }
  if (songDescription) {
    parts.push(`inspired by: ${songDescription}`);
  }
  return parts.join(', ');
}

export async function generateCoverImage(
  apiKey: string,
  params: { prompt: string; responseFormat?: 'url' | 'base64' }
): Promise<ImageResponse> {
  const validated = imageRequestSchema.parse({
    model: 'image-01',
    prompt: params.prompt,
    aspect_ratio: '1:1',
    response_format: params.responseFormat || 'url',
    n: 1,
    prompt_optimizer: true,
  });

  const { data } = await axios.post<ImageResponse>(
    'https://api.minimaxi.com/v1/image_generation',
    validated,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );

  if (data.base_resp.status_code !== 0) {
    const err = new Error(`Image generation failed with status code: ${data.base_resp.status_code}`);
    (err as any).apiResponse = data;
    throw err;
  }

  return data;
}
