import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';
import { RepoInfo, RepoDetails } from '@/lib/types';

export async function findRepos(rootPath: string): Promise<RepoInfo[]> {
    const repos: RepoInfo[] = [];

    if (!fs.existsSync(rootPath)) {
        return [];
    }

    // Recursive function with maxDepth
    async function scan(currentPath: string, depth: number) {
        if (depth > 3) return; // User requested max 3 levels deep

        try {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });

            // First check if current directory is a git repo
            if (fs.existsSync(path.join(currentPath, '.git'))) {
                try {
                    const git: SimpleGit = simpleGit(currentPath);
                    const status = await git.status();
                    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

                    let repoStatus: RepoInfo['status'] = 'clean';
                    if (status.files.length > 0) repoStatus = 'dirty';
                    else if (status.ahead > 0 && status.behind > 0) repoStatus = 'diverged';
                    else if (status.ahead > 0) repoStatus = 'ahead';
                    else if (status.behind > 0) repoStatus = 'behind';

                    repos.push({
                        name: path.basename(currentPath),
                        path: currentPath,
                        branch: branch.trim(),
                        status: repoStatus,
                    });
                    // If it's a git repo, stop recursing down this branch
                    return;
                } catch (e) {
                    // If error, maybe still treat as repo or just ignore?
                    // Let's add it as unknown
                }
            }

            // If not a git repo (or even if it was, but we want to be safe, though requirement says stop),
            // The requirement says: "if encounter folder is git then show listing and DO NOT go deeper".
            // My logic above returns after adding repo. 
            // BUT wait, the check above `fs.existsSync(path.join(currentPath, '.git'))` means CURRENT folder is a repo.
            // If the ROOT folder passed to `findRepos` is NOT a repo, we enter the loop.
            // If the ROOT folder IS a repo, we add it and stop?

            // Wait, the logic for `findRepos` previously iterated children. 
            // If I passed `/Workspace`, and it has `repo1`, `repo2`.
            // `repo1` has `.git`. `repo2` has `.git`.

            // My recursive logic:
            // scan('/Workspace', 0)
            //   Check if '/Workspace/.git' exists? No.
            //   Loop children: 'repo1', 'repo2'.
            //   scan('/Workspace/repo1', 1)
            //     Check '/Workspace/repo1/.git' exists? YES.
            //     Add repo1. RETURN.

            // This matches the requirement.

            for (const item of items) {
                if (item.isDirectory() && !item.name.startsWith('.')) {
                    await scan(path.join(currentPath, item.name), depth + 1);
                }
            }
        } catch (e) {
            console.error(`Error scanning ${currentPath}:`, e);
        }
    }

    await scan(rootPath, 0);
    // Sort by name for consistency
    return repos.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRepoDetails(repoPath: string): Promise<RepoDetails | null> {
    if (!fs.existsSync(repoPath)) return null;

    try {
        const git: SimpleGit = simpleGit(repoPath);
        // Force status update
        const status = await git.status();
        const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

        // Parse files
        const files = status.files.map(f => ({
            path: f.path,
            status: f.index === '?' ? '??' : f.working_dir || f.index,
            staged: f.index !== '?' && f.index !== ' '
        }));

        // Get recent commits
        let recentCommits: RepoDetails['recentCommits'] = [];
        try {
            const log = await git.log({ maxCount: 5 });
            recentCommits = log.all.map(c => ({
                hash: c.hash.substring(0, 7),
                message: c.message,
                date: c.date,
                author_name: c.author_name
            }));
        } catch (e) {
            // New repo might not have commits
        }

        let repoStatus: RepoDetails['status'] = 'clean';
        if (status.files.length > 0) repoStatus = 'dirty';
        else if (status.ahead > 0 && status.behind > 0) repoStatus = 'diverged';
        else if (status.ahead > 0) repoStatus = 'ahead';
        else if (status.behind > 0) repoStatus = 'behind';

        return {
            name: path.basename(repoPath),
            path: repoPath,
            branch: branch.trim(),
            status: repoStatus,
            files,
            recentCommits
        };
    } catch (e) {
        console.error('Error getting repo details:', e);
        return null;
    }
}

export type GitAction = 'fetch' | 'pull' | 'push' | 'commit' | 'stage' | 'unstage';

export async function runGitAction(repoPath: string, action: GitAction, args?: any): Promise<{ success: boolean; message?: string }> {
    if (!fs.existsSync(repoPath)) return { success: false, message: 'Repo not found' };

    try {
        const git: SimpleGit = simpleGit(repoPath);
        switch (action) {
            case 'fetch':
                await git.fetch();
                break;
            case 'pull':
                await git.pull();
                break;
            case 'push':
                await git.push();
                break;
            case 'commit':
                if (!args?.message) throw new Error('Commit message required');
                await git.commit(args.message);
                break;
            case 'stage':
                if (args?.files && Array.isArray(args.files)) {
                    await git.add(args.files);
                } else {
                    await git.add('.');
                }
                break;
            case 'unstage':
                if (args?.files && Array.isArray(args.files)) {
                    await git.reset(['HEAD', ...args.files]);
                } else {
                    await git.reset(['HEAD']);
                }
                break;
            default:
                throw new Error('Unknown action');
        }
        return { success: true };
    } catch (e: any) {
        console.error('Git action error:', e);
        return { success: false, message: e.message || 'Unknown error' };
    }
}
