# Git Management Tool

A simple, modern, and visual Git management tool built with Next.js, TailwindCSS, and shadcn/ui.

## Features

- **Workspace Discovery**: Recursively scan your workspace for Git repositories.
- **Visual Dashboard**: View repository status (clean, dirty, ahead/behind) at a glance.
- **Detailed View**: Inspect file changes, staging status, and commit history.
- **Git Operations**: Stage, unstage, commit, fetch, pull, and push directly from the UI.
- **Smart Grouping**: Repositories are grouped by their parent folder for easy navigation.
- **Local Storage Persistence**: Automatically remembers your last opened workspace.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Git

### Installation

1.  Clone the repository:
    ```bash
    git clone git@github.com:ndanhit/git-management.git
    cd git-management
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the application:
    ```bash
    # Start the app
    ./run.sh start  # or just ./run.sh
    
    # Stop the app
    ./run.sh stop
    
    # Restart the app
    ./run.sh restart
    ```

4.  Open [http://localhost:3333](http://localhost:3333) with your browser.

## Tech Stack

- **Frontend**: Next.js (App Router), React, TailwindCSS, shadcn/ui, Lucide React.
- **Backend**: Next.js API Routes.
- **Git Engine**: `simple-git` via Node.js.

## License

MIT
