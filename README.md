# gitlab-unprotect CLI

A simple Node.js CLI tool to quickly unprotect the current Git branch in your GitLab repository.

## What It Does

- Discovers your GitLab URL and repository from the current Git remote origin.
- Detects your currently checked-out branch.
- Uses the GitLab API to unprotect the current branch.

## Requirements

- **Node.js** installed (v14+ recommended)
- **Git** installed
- A GitLab **Personal Access Token** with API permissions.

## Installation

1. **Clone or download the repository.**

2. **Install globally using npm:**

```bash
npm i -g .
```

3. **Create a GitLab Personal Access Token:**

- Go to your GitLab account settings (`https://gitlab.com/-/profile/personal_access_tokens`).
- Create a token with API access.
- Save this token to `~/.gitlab_token`:

```bash
echo "YOUR_TOKEN_HERE" > ~/.gitlab_token
chmod 600 ~/.gitlab_token
```

## Usage

Simply run the CLI within a Git repository:

```bash
gitlab-unprotect
```

Example output:

```
Remote URL: git@gitlab.com:username/project.git
GitLab URL: https://gitlab.com
Project Path: username/project
Local branch: feature-branch
Project ID: 123456
Attempting to unprotect local branch 'feature-branch'...
Branch 'feature-branch' is now unprotected.
```

## Notes

- Ensure your token has sufficient permissions to modify repository settings.
- Useful in automation scripts or for quick command-line management of GitLab branch protections.