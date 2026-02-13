import { NextResponse } from 'next/server';
import { getRepoDetails } from '@/lib/git';
import { RepoDetails } from '@/lib/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const repoPath = searchParams.get('path');

    if (!repoPath) {
        return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    try {
        const details = await getRepoDetails(repoPath);
        if (!details) {
            return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
        }
        return NextResponse.json({ details });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to get repo details' }, { status: 500 });
    }
}
