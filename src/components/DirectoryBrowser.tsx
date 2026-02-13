"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, ArrowLeft, Loader2 } from "lucide-react";

interface DirectoryBrowserProps {
    onSelect: (path: string) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface DirItem {
    name: string;
    path: string;
}

export function DirectoryBrowser({ onSelect, open, onOpenChange }: DirectoryBrowserProps) {
    const [currentPath, setCurrentPath] = useState<string>("");
    const [directories, setDirectories] = useState<DirItem[]>([]);
    const [parentPath, setParentPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDirs = async (path?: string) => {
        setLoading(true);
        try {
            const url = path ? `/api/fs?path=${encodeURIComponent(path)}` : '/api/fs';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCurrentPath(data.path);
                setParentPath(data.parent);
                setDirectories(data.directories || []);
            }
        } catch (e) {
            console.error("Failed to fetch directories", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchDirs(currentPath || undefined);
        }
    }, [open]); // Don't add currentPath here to avoid loops, only refresh on open or manual navigation

    const handleNavigate = (path: string) => {
        fetchDirs(path);
    };

    const handleSelect = () => {
        onSelect(currentPath);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Repository Folder</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm font-mono truncate">
                    <span className="truncate flex-1" title={currentPath}>{currentPath}</span>
                </div>

                <div className="flex-1 border rounded-md overflow-hidden">
                    <ScrollArea className="h-full">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="p-1">
                                {parentPath && (
                                    <Button variant="ghost" className="w-full justify-start text-muted-foreground h-8" onClick={() => handleNavigate(parentPath)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        ..
                                    </Button>
                                )}
                                {directories.map((dir) => (
                                    <Button
                                        key={dir.path}
                                        variant="ghost"
                                        className="w-full justify-start h-9 px-2"
                                        onClick={() => handleNavigate(dir.path)}
                                    >
                                        <Folder className="w-4 h-4 mr-2 text-blue-500 fill-current" />
                                        <span className="truncate">{dir.name}</span>
                                    </Button>
                                ))}
                                {directories.length === 0 && !loading && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Empty directory</div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSelect}>Select This Folder</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
