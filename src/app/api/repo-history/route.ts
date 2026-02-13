import { NextResponse } from 'next/server';
import { getFileHistory } from '@/lib/git';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const file = searchParams.get('file');

    if (!path || !file) {
        return NextResponse.json({ error: 'Path and file are required' }, { status: 400 });
    }

    try {
        const history = await getFileHistory(path, file);
        return NextResponse.json({ history });
    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
