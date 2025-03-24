#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration: Token file located in the user's home directory.
const TOKEN_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.gitlab_token');

// Helper: Run a shell command and return trimmed output.
function runCommand(command) {
  try {
    return execSync(command).toString().trim();
  } catch (error) {
    console.error(`Error running command "${command}"`, error);
    process.exit(1);
  }
}

// Get the git remote URL (assuming 'origin' remote)
const remoteUrl = runCommand('git config --get remote.origin.url');
console.log(`Remote URL: ${remoteUrl}`);

// Discover GitLab URL and project path from remote URL.
// Supports HTTPS and SSH formats.
function parseRemote(url) {
  let gitlabUrl = '';
  let projectPath = '';

  if (url.startsWith('git@')) {
    // e.g. git@gitlab.com:namespace/project.git
    // Split "git@" then split the remainder at the colon.
    const afterAt = url.slice(4);
    const [domain, repoPath] = afterAt.split(':');
    gitlabUrl = `https://${domain}`;
    projectPath = repoPath;
  } else if (url.startsWith('https://')) {
    // e.g. https://gitlab.com/namespace/project.git
    const urlObj = new URL(url);
    gitlabUrl = `${urlObj.protocol}//${urlObj.host}`;
    projectPath = urlObj.pathname.slice(1);
  }

  // Remove trailing .git if present.
  if (projectPath.endsWith('.git')) {
    projectPath = projectPath.slice(0, -4);
  }
  return { gitlabUrl, projectPath };
}

const { gitlabUrl, projectPath } = parseRemote(remoteUrl);
console.log(`GitLab URL: ${gitlabUrl}`);
console.log(`Project Path: ${projectPath}`);

// Read GitLab token from file.
let GITLAB_TOKEN = '';
try {
  GITLAB_TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  if (!GITLAB_TOKEN) {
    throw new Error('Token file is empty');
  }
} catch (err) {
  console.error(`Error reading token from file '${TOKEN_FILE}'`, err);
  process.exit(1);
}

const API_BASE = `${gitlabUrl}/api/v4`;

// Get the local branch name.
const localBranch = runCommand('git rev-parse --abbrev-ref HEAD');
console.log(`Local branch: ${localBranch}`);

// Encode project path to be used in API calls.
const encodedProjectPath = encodeURIComponent(projectPath);

// Function to get project details (to retrieve project ID)
async function getProject() {
  const url = `${API_BASE}/projects/${encodedProjectPath}`;
  try {
    const res = await axios.get(url, {
      headers: { 'Private-Token': GITLAB_TOKEN }
    });
    return res.data;
  } catch (error) {
    console.error(`Failed to get project details`, error);
    process.exit(1);
  }
}

// Function to unprotect a branch by name.
async function unprotectBranch(projectId, branch) {
  const url = `${API_BASE}/projects/${projectId}/protected_branches/${encodeURIComponent(branch)}`;
  try {
    // GitLab API: DELETE /projects/:id/protected_branches/:branch unprotects the branch.
    await axios.delete(url, {
      headers: { 'Private-Token': GITLAB_TOKEN }
    });
    console.log(`Branch '${branch}' is now unprotected.`);
  } catch (error) {
    // If the branch is not protected, GitLab might return a 404.
    if (error.response && error.response.status === 404) {
      console.log(`Branch '${branch}' is not protected or does not exist.`);
    } else {
      console.error(`Error unprotecting branch '${branch}'`, error);
    }
  }
}

// Main async function.
async function main() {
  const project = await getProject();
  console.log(`Project ID: ${project.id}`);

  console.log(`Attempting to unprotect local branch '${localBranch}'...`);
  await unprotectBranch(project.id, localBranch);
}

main();

