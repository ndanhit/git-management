import { NextResponse } from 'next/server';
import { findRepos } from '@/lib/git';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rootPath = searchParams.get('path');

    if (!rootPath) {
        return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    try {
        const repos = await findRepos(rootPath);
        return NextResponse.json({ repos });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to scan repositories' }, { status: 500 });
    }
}
