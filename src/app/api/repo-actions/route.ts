import { NextResponse } from 'next/server';
import { runGitAction, GitAction } from '@/lib/git';
import { exec } from 'child_process';
import os from 'os';

function executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { path, action, args } = body;

        if (!path || !action) {
            return NextResponse.json({ error: 'Path and action are required' }, { status: 400 });
        }

        // Handle system actions
        if (action === 'open-folder') {
            const platform = os.platform();
            let command = '';
            if (platform === 'darwin') command = `open "${path}"`;
            else if (platform === 'win32') command = `explorer "${path}"`;
            else command = `xdg-open "${path}"`; // Linux

            await executeCommand(command);
            return NextResponse.json({ success: true });
        }

        if (action === 'open-terminal') {
            const platform = os.platform();
            let command = '';
            if (platform === 'darwin') command = `open -a Terminal "${path}"`;
            else if (platform === 'win32') command = `start cmd /k "cd /d ${path}"`;
            else command = `gnome-terminal --working-directory="${path}"`; // Linux (generic)

            await executeCommand(command);
            return NextResponse.json({ success: true });
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
