'use client';

import { useState, useEffect } from 'react';
import { RepoInfo } from '@/lib/types';
import { RepoList } from '@/components/RepoList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderSearch, FolderGit2, GitBranch } from 'lucide-react';
import { RepoDetail } from '@/components/RepoDetail';
import { DirectoryBrowser } from '@/components/DirectoryBrowser';



export default function Home() {
  const [rootPath, setRootPath] = useState<string>('');
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  // Initial state true to prevent flashing landing page if path is saved
  const [initializing, setInitializing] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);


  useEffect(() => {
    const savedPath = localStorage.getItem('git-manager-root-path');
    if (savedPath) {
      setRootPath(savedPath);
      fetchRepos(savedPath);
    } else {
      setInitializing(false);
    }
  }, []);

  const fetchRepos = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repos?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok) {
        setRepos(data.repos);
        localStorage.setItem('git-manager-root-path', path);
      } else {
        console.error(data.error);
        setRepos([]);
        // Don't clear path on error, let user correct it
      }
    } catch (err) {
      console.error('Failed to fetch repositories', err);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rootPath) {
      fetchRepos(rootPath);
    }
  };

  const clearPath = () => {
    setRootPath('');
    setRepos([]);
    setSelectedRepo(null);
    localStorage.removeItem('git-manager-root-path');
  };

  const handleFolderSelect = (path: string) => {
    setRootPath(path);
    fetchRepos(path);
    setPickerOpen(false);
  };



  if (initializing) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If no path is set (and not loading initial path), show landing
  if (!rootPath && !loading && repos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle>Open Workspace</CardTitle>
            <CardDescription>Enter the absolute path to your folder containing git repositories.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePathSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="/Users/username/Workspace"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setPickerOpen(true)}>
                  <FolderSearch className="w-4 h-4 mr-2" />
                  Browse Folder
                </Button>
                <Button type="submit" className="flex-1">Open</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <DirectoryBrowser open={pickerOpen} onOpenChange={setPickerOpen} onSelect={handleFolderSelect} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b flex items-center gap-2 justify-between bg-background">
          <div className="font-semibold text-sm truncate flex-1" title={rootPath}>
            {rootPath.split('/').pop() || rootPath}
          </div>
          <Button variant="ghost" size="icon" onClick={clearPath} title="Change Folder" className="h-8 w-8">
            <FolderSearch className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Scanning...</div>
          ) : (
            <RepoList repos={repos} selectedRepo={selectedRepo} onSelect={setSelectedRepo} rootPath={rootPath} />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto h-screen">
        {selectedRepo ? (
          <RepoDetail repo={selectedRepo} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FolderGit2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Select a repository to manage</p>
          </div>
        )}
      </div>
    </div>
  );
}
