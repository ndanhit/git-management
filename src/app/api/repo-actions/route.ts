import { NextResponse } from 'next/server';
import { runGitAction, GitAction } from '@/lib/git';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { path, action, args } = body;

        if (!path || !action) {
            return NextResponse.json({ error: 'Path and action are required' }, { status: 400 });
        }

        const result = await runGitAction(path, action as GitAction, args);

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error('API Action Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
