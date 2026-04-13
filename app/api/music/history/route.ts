import { NextRequest, NextResponse } from 'next/server';
import { getMusicList, getMusicAudio, getMusicCover, deleteMusic } from '@/lib/storage/local-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');

  if (id && type === 'audio') {
    const buffer = await getMusicAudio(id);
    if (!buffer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  if (id && type === 'cover') {
    const buffer = await getMusicCover(id);
    if (!buffer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }

  const list = await getMusicList();
  return NextResponse.json(list);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  const ok = await deleteMusic(id);
  if (!ok) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

  return NextResponse.json({ success: true });
}
