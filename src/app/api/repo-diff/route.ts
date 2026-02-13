import { NextResponse } from 'next/server';
import { getFileDiff } from '@/lib/git';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const file = searchParams.get('file');

    if (!path || !file) {
        return NextResponse.json({ error: 'Path and file are required' }, { status: 400 });
    }

    try {
        const diff = await getFileDiff(path, file);
        return NextResponse.json({ diff });
    } catch (error) {
        console.error('Diff API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch diff' }, { status: 500 });
    }
}
