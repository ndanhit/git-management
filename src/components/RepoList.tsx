"use client";

import { useState, useMemo } from 'react';
import { RepoInfo } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FolderGit2, GitBranch, AlertCircle, CheckCircle, ArrowUpCircle, ArrowDownCircle, ChevronRight, ChevronDown } from 'lucide-react';

interface RepoListProps {
    repos: RepoInfo[];
    selectedRepo: RepoInfo | null;
    onSelect: (repo: RepoInfo) => void;
    rootPath: string;
}

const statusMap: Record<RepoInfo['status'], { icon: any, color: string }> = {
    clean: { icon: CheckCircle, color: 'text-green-500' },
    dirty: { icon: AlertCircle, color: 'text-yellow-500' },
    ahead: { icon: ArrowUpCircle, color: 'text-blue-500' },
    behind: { icon: ArrowDownCircle, color: 'text-red-500' },
    diverged: { icon: AlertCircle, color: 'text-red-500' },
    unknown: { icon: AlertCircle, color: 'text-gray-500' },
};

export function RepoList({ repos, selectedRepo, onSelect, rootPath }: RepoListProps) {
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (group: string) => {
        setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const groupedRepos = useMemo(() => {
        const groups: Record<string, RepoInfo[]> = {};

        repos.forEach(repo => {
            // Simple relative path logic
            let relative = repo.path;
            if (repo.path.startsWith(rootPath)) {
                relative = repo.path.substring(rootPath.length);
                if (relative.startsWith('/')) relative = relative.substring(1);
            }

            const parts = relative.split('/');
            // If parts.length > 1, the first part is the group/parent folder
            // If parts.length === 1, it's directly in root
            const groupName = parts.length > 1 ? parts[0] : 'Root';

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(repo);
        });

        return groups;
    }, [repos, rootPath]);

    if (repos.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground text-center">No repositories found.</div>;
    }

    const groups = Object.keys(groupedRepos).sort((a, b) => {
        if (a === 'Root') return -1;
        if (b === 'Root') return 1;
        return a.localeCompare(b);
    });

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {groups.map(group => {
                    const groupRepos = groupedRepos[group];
                    const isCollapsed = collapsedGroups[group];

                    if (group === 'Root') {
                        return groupRepos.map(repo => <RepoItem key={repo.path} repo={repo} selectedRepo={selectedRepo} onSelect={onSelect} />);
                    }

                    return (
                        <div key={group} className="flex flex-col">
                            <Button
                                variant="ghost"
                                className="justify-start h-8 px-2 font-semibold text-muted-foreground hover:text-foreground mb-1"
                                onClick={() => toggleGroup(group)}
                            >
                                {isCollapsed ? <ChevronRight className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                {group}
                                <span className="ml-2 text-xs font-normal opacity-60">({groupRepos.length})</span>
                            </Button>

                            {!isCollapsed && (
                                <div className="pl-4 flex flex-col gap-1 border-l ml-3 mb-2">
                                    {groupRepos.map(repo => <RepoItem key={repo.path} repo={repo} selectedRepo={selectedRepo} onSelect={onSelect} />)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

function RepoItem({ repo, selectedRepo, onSelect }: { repo: RepoInfo, selectedRepo: RepoInfo | null, onSelect: (repo: RepoInfo) => void }) {
    const StatusIcon = statusMap[repo.status]?.icon || AlertCircle;
    const statusColor = statusMap[repo.status]?.color || 'text-gray-500';

    return (
        <Button
            variant={selectedRepo?.path === repo.path ? "secondary" : "ghost"}
            className={cn("justify-start h-auto py-2 px-3", selectedRepo?.path === repo.path && "bg-secondary")}
            onClick={() => onSelect(repo)}
        >
            <div className="flex items-center w-full min-w-0">
                <StatusIcon className={cn("w-4 h-4 mr-3 shrink-0", statusColor)} />
                <div className="flex flex-col items-start overflow-hidden min-w-0">
                    <span className="text-sm font-medium truncate w-full text-left">{repo.name}</span>
                    <div className="flex items-center text-xs text-muted-foreground mt-0.5 w-full">
                        <GitBranch className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{repo.branch || '...'}</span>
                    </div>
                </div>
            </div>
        </Button>
    );
}
