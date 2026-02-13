'use client';

import { useState, useEffect } from 'react';
import { RepoDetails, RepoInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GitBranch, GitCommit, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface RepoDetailProps {
    repo: RepoInfo;
}

export function RepoDetail({ repo }: RepoDetailProps) {
    const [details, setDetails] = useState<RepoDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchDetails = async () => {
        // Silent update if we already have details, unless explicit refresh needed
        if (!details) setLoading(true);
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
        }
    };

    useEffect(() => {
        if (repo) {
            setDetails(null);
            setLoading(true); // Explicit loading for new repo select
            fetchDetails();
        }
    }, [repo]);

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
                // Refresh details
                await fetchDetails();
                if (action === 'commit') setCommitMessage('');
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
                    </h2>
                    <div className="flex items-center text-muted-foreground mt-2">
                        <GitBranch className="w-4 h-4 mr-2" />
                        {details.branch}
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
                                    details.files.map((file) => (
                                        <div key={file.path} className="flex items-center p-3 hover:bg-muted/50 text-sm">
                                            <span className={`w-8 font-mono font-bold shrink-0 ${file.staged ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {file.staged ? 'Stg' : file.status}
                                            </span>
                                            <span className="truncate flex-1" title={file.path}>{file.path}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* History Column */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="py-4">
                        <CardTitle className="text-base">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
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
        </div>
    );
}
