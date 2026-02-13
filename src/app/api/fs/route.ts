import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let dirPath = searchParams.get('path');

    // Default to user home directory if no path provided
    if (!dirPath) {
        dirPath = os.homedir();
    }

    try {
        if (!fs.existsSync(dirPath)) {
            return NextResponse.json({ error: 'Path does not exist' }, { status: 404 });
        }

        // Security check: prevent going above root (though FS usually handles this, we might want to restrict?)
        // For a local tool, we usually want full access.

        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        const directories = items
            .filter(item => item.isDirectory() && !item.name.startsWith('.')) // Hide dotfiles for simplicity
            .map(item => ({
                name: item.name,
                path: path.join(dirPath as string, item.name),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const parent = path.dirname(dirPath);

        return NextResponse.json({
            path: dirPath,
            parent: parent === dirPath ? null : parent, // Stop at root
            directories
        });
    } catch (error) {
        console.error('FS API Error:', error);
        return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
    }
}
