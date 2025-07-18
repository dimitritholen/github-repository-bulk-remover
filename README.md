# GitHub Repository Bulk Remover

A CLI tool to list and bulk delete GitHub repositories (both public and private) with an interactive checkbox interface.

## Features

- Lists all your GitHub repositories (both public and private)
- Visual indicators for repository visibility ([PRIVATE] / [PUBLIC])
- Interactive checkbox selection (use space to select, enter to confirm)
- Shows repository details: name, language, size, and last update date
- Double confirmation before deletion to prevent accidents
- Progress tracking with visual feedback
- Detailed error messages with helpful guidance

## Prerequisites

- Node.js 16 or higher
- GitHub Personal Access Token with `delete_repo` scope

## Installation

```bash
npm install
npm run build
```

## Setup

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Click "Generate new token (classic)"
   - Select the `delete_repo` scope
   - Copy the generated token

2. Export the token as an environment variable:
   ```bash
   export GITHUB_ACCESS_TOKEN="your_token_here"
   ```

## Usage

Run the tool:
```bash
npm start
```

Or directly:
```bash
node dist/index.js
```

## How it works

1. The tool fetches all your repositories (both public and private)
2. Displays them in an interactive checkbox list
3. Use space to select/deselect repositories
4. Press enter to confirm your selection
5. Provides two confirmation prompts before deletion
6. Shows progress and results for each deletion

## Safety Features

- Lists both public and private repositories with clear visibility indicators
- Requires explicit selection of repositories to delete
- Double confirmation before any deletion
- Clear warnings about the irreversible nature of deletion
- Detailed error messages if something goes wrong

## API Information

The tool uses the GitHub REST API v3 with the following endpoints:
- `GET /user/repos` - List repositories
- `DELETE /repos/{owner}/{repo}` - Delete a repository

## Important Notes

- Deleting a repository is **permanent** and cannot be undone
- Deleting a repository will also delete all its forks
- Be extra careful when deleting public repositories as they may be used by others
- You need appropriate permissions to delete repositories
- The token must have the `delete_repo` scope

## Error Handling

The tool provides clear error messages for common issues:
- Missing or invalid token
- Insufficient permissions
- Network errors
- API rate limiting

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev

# Clean build artifacts
npm run clean
```