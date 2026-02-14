export interface RepoInfo {
    name: string;
    path: string;
    branch: string;
    status: 'clean' | 'dirty' | 'ahead' | 'behind' | 'diverged' | 'unknown';
    remoteUrl?: string;
}

export interface FileStatus {
    path: string;
    status: string;
    staged: boolean;
}

export interface CommitInfo {
    hash: string;
    message: string;
    date: string;
    author_name: string;
}

export interface RepoDetails extends RepoInfo {
    files: FileStatus[];
    recentCommits: CommitInfo[];
}
