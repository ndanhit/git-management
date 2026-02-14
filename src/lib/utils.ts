import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWebUrlFromGit(gitUrl: string, branch?: string): string {
  if (!gitUrl) return '';

  let baseUrl = '';
  // Handle SSH format: git@github.com:user/repo.git
  if (gitUrl.startsWith('git@')) {
    baseUrl = 'https://' + gitUrl
      .slice(4)
      .replace(':', '/')
      .replace(/\.git$/, '');
  } else {
    // Handle HTTPS format: https://github.com/user/repo.git
    baseUrl = gitUrl.replace(/\.git$/, '');
  }

  if (branch) {
    if (baseUrl.includes('github.com')) {
      return `${baseUrl}/tree/${branch}`;
    }
    if (baseUrl.includes('gitlab.com')) {
      return `${baseUrl}/-/tree/${branch}`;
    }
  }

  return baseUrl;
}
