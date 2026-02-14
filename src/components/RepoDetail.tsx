'use client';

import { useState, useEffect } from 'react';
import { RepoDetails, RepoInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GitBranch, GitCommit, FileText, CheckCircle, AlertCircle, RefreshCw, Folder, Terminal, Plus, Minus, RotateCcw, History, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getWebUrlFromGit, cn } from '@/lib/utils';

interface RepoDetailProps {
    repo: RepoInfo;
}

export function RepoDetail({ repo }: RepoDetailProps) {
    const [details, setDetails] = useState<RepoDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileDiff, setFileDiff] = useState<string | null>(null);
    const [diffLoading, setDiffLoading] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [fileHistory, setFileHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchDetails = async () => {
        // Silent update if we already have details, unless explicit refresh needed
        if (!details) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch(`/api/repo-details?path=${encodeURIComponent(repo.path)}`);
            const data = await res.json();
            if (res.ok) {
                setDetails(data.details);
            }
        } catch (error) {
            console.error('Failed to fetch repo details', error);
        } finally {
            if (!details) setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchDiff = async (filePath: string) => {
        setDiffLoading(true);
        try {
            const res = await fetch(`/api/repo-diff?path=${encodeURIComponent(repo.path)}&file=${encodeURIComponent(filePath)}`);
            const data = await res.json();
            if (res.ok) {
                setFileDiff(data.diff);
            }
        } catch (error) {
            console.error('Failed to fetch diff', error);
        } finally {
            setDiffLoading(false);
        }
    };

    const fetchFileHistory = async (filePath: string) => {
        setHistoryLoading(true);
        setHistoryModalOpen(true);
        try {
            const res = await fetch(`/api/repo-history?path=${encodeURIComponent(repo.path)}&file=${encodeURIComponent(filePath)}`);
            const data = await res.json();
            if (res.ok) {
                setFileHistory(data.history);
            }
        } catch (error) {
            console.error('Failed to fetch file history', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (repo) {
            setDetails(null);
            setSelectedFile(null);
            setFileDiff(null);
            setLoading(true); // Explicit loading for new repo select
            fetchDetails();
        }
    }, [repo]);

    const handleFileSelect = (filePath: string) => {
        if (selectedFile === filePath) {
            setSelectedFile(null);
            setFileDiff(null);
        } else {
            setSelectedFile(filePath);
            fetchDiff(filePath);
        }
    };

    const handleAction = async (action: string, args: any = {}) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/repo-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: repo.path, action, args }),
            });

            const data = await res.json();
            if (res.ok) {
                if (action === 'commit' || action === 'stage' || action === 'unstage' || action === 'pull' || action === 'fetch' || action === 'discard') {
                    await fetchDetails();
                    // If the selected file was affected, update diff
                    if (args.files?.includes(selectedFile) || action === 'commit') {
                        if (selectedFile) fetchDiff(selectedFile);
                    }
                    if (action === 'discard' && args.files?.includes(selectedFile)) {
                        setSelectedFile(null);
                        setFileDiff(null);
                    }
                }
                if (action === 'commit') {
                    setCommitMessage('');
                    setSelectedFile(null);
                    setFileDiff(null);
                }
            } else {
                alert(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Action error', error);
            alert('Failed to perform action');
        } finally {
            setProcessing(false);
        }
    };

    if (loading && !details) {
        return <div className="p-8">Loading details...</div>;
    }

    if (!details) {
        return <div className="p-8">Select a repository.</div>;
    }

    const stagedFiles = details.files.filter(f => f.staged);
    const unstagedFiles = details.files.filter(f => !f.staged);

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        {details.name}
                        <Badge variant={details.status === 'clean' ? 'outline' : 'destructive'}>{details.status}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => fetchDetails()} disabled={refreshing} title="Refresh Status">
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('open-folder')} title="Open in File Explorer">
                            <Folder className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('open-terminal')} title="Open in Terminal">
                            <Terminal className="w-4 h-4" />
                        </Button>
                    </h2>
                    <div className="flex items-center text-muted-foreground mt-2">
                        <GitBranch className="w-4 h-4 mr-2" />
                        <span
                            className={cn(
                                "hover:text-primary transition-colors cursor-pointer",
                                details.remoteUrl && "hover:underline"
                            )}
                            onClick={() => {
                                if (details.remoteUrl) {
                                    window.open(getWebUrlFromGit(details.remoteUrl, details.branch), '_blank');
                                }
                            }}
                            title={details.remoteUrl ? "Open branch on remote" : ""}
                        >
                            {details.branch}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="text-xs font-mono opacity-70">{details.path}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAction('fetch')} disabled={processing}>Fetch</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction('pull')} disabled={processing}>Pull</Button>
                    <Button size="sm" onClick={() => handleAction('push')} disabled={processing}>Push</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-0">
                {/* Changes Column */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Changes ({details.files.length})</CardTitle>
                        {unstagedFiles.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => handleAction('stage')} disabled={processing} className="h-6 text-xs">
                                Stage All
                            </Button>
                        )}
                        {stagedFiles.length > 0 && unstagedFiles.length === 0 && (
                            <Button variant="ghost" size="sm" onClick={() => handleAction('unstage')} disabled={processing} className="h-6 text-xs">
                                Unstage All
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col divide-y">
                                {details.files.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No changes to commit (working tree clean)
                                    </div>
                                ) : (
                                    details.files.map((file) => {
                                        const fileName = file.path.split('/').pop();
                                        const filePath = file.path.split('/').slice(0, -1).join('/');
                                        const isSelected = selectedFile === file.path;

                                        return (
                                            <div
                                                key={file.path}
                                                className={`group flex items-center p-3 hover:bg-muted/50 text-sm gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                                                onClick={() => handleFileSelect(file.path)}
                                            >
                                                <span className={`w-10 font-mono font-bold shrink-0 ${file.staged ? 'text-green-500' : 'text-yellow-500'}`}>
                                                    {file.staged ? 'Stg' : file.status}
                                                </span>
                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <span className="font-medium truncate text-foreground" title={file.path}>
                                                        {fileName}
                                                    </span>
                                                    {filePath && (
                                                        <span className="text-[10px] text-muted-foreground truncate opacity-70">
                                                            {filePath}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    {!file.staged ? (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAction('stage', { files: [file.path] })} disabled={processing} title="Stage file">
                                                            <Plus className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAction('unstage', { files: [file.path] })} disabled={processing} title="Unstage file">
                                                            <Minus className="w-4 h-4 text-yellow-600" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={() => {
                                                        if (confirm(`Discard changes in ${file.path}?`)) {
                                                            handleAction('discard', { files: [file.path] });
                                                        }
                                                    }} disabled={processing} title="Discard changes">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right Column: History or Diff */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">
                            {selectedFile ? `Diff: ${selectedFile.split('/').pop()}` : 'Recent Activity'}
                        </CardTitle>
                        {selectedFile && (
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => fetchFileHistory(selectedFile)} className="h-6 gap-1 text-xs">
                                    <History className="w-3 h-3" /> History
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedFile(null); setFileDiff(null); }} className="h-6 gap-1 text-xs">
                                    <X className="w-3 h-3" /> Close
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
                            {selectedFile ? (
                                <div className="p-0 font-mono text-[11px] leading-relaxed whitespace-pre">
                                    {diffLoading ? (
                                        <div className="p-4 text-muted-foreground italic">Loading diff...</div>
                                    ) : fileDiff ? (
                                        <div className="flex flex-col">
                                            {fileDiff.split('\n').map((line, i) => {
                                                const isAddition = line.startsWith('+');
                                                const isDeletion = line.startsWith('-');
                                                const isHeader = line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@');

                                                let bgColor = '';
                                                let textColor = 'text-foreground';
                                                if (isAddition) {
                                                    bgColor = 'bg-green-50/50 dark:bg-green-900/20';
                                                    textColor = 'text-green-600 dark:text-green-400';
                                                } else if (isDeletion) {
                                                    bgColor = 'bg-red-50/50 dark:bg-red-900/20';
                                                    textColor = 'text-red-600 dark:text-red-400';
                                                } else if (isHeader) {
                                                    textColor = 'text-muted-foreground opacity-60';
                                                }

                                                return (
                                                    <div key={i} className={`px-3 py-[1px] border-b border-transparent ${bgColor} ${textColor}`}>
                                                        {line || ' '}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-muted-foreground italic text-center">No changes found.</div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y">
                                    {details.recentCommits?.length === 0 ? (
                                        <div className="p-4 text-sm text-center">No recent commits</div>
                                    ) : (
                                        details.recentCommits?.map((commit) => (
                                            <div key={commit.hash} className="p-3 hover:bg-muted/50">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-sm truncate">{commit.message}</span>
                                                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1 rounded">{commit.hash}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{commit.author_name}</span>
                                                    <span>{new Date(commit.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Action Area (Commit) */}
            <div className="mt-4 shrink-0">
                <Card>
                    <CardContent className="p-4 flex gap-2">
                        <Input
                            placeholder="Commit message (summary)"
                            className="flex-1"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && commitMessage && stagedFiles.length > 0) {
                                    handleAction('commit', { message: commitMessage });
                                }
                            }}
                        />
                        <Button
                            disabled={processing || !commitMessage || stagedFiles.length === 0}
                            onClick={() => handleAction('commit', { message: commitMessage })}
                        >
                            {processing ? '...' : 'Commit'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            File History: {selectedFile?.split('/').pop()}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden mt-4">
                        <ScrollArea className="h-full pr-4">
                            {historyLoading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading history...</div>
                            ) : fileHistory.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No commit history found for this file.</div>
                            ) : (
                                <div className="flex flex-col divide-y">
                                    {fileHistory.map((commit) => (
                                        <div key={commit.hash} className="py-4 first:pt-0">
                                            <div className="flex items-center justify-between mb-1 text-sm">
                                                <span className="font-semibold">{commit.message}</span>
                                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded opacity-70">{commit.hash}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal opacity-70">
                                                        {commit.author_name}
                                                    </Badge>
                                                </span>
                                                <span>{new Date(commit.date).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
