#!/usr/bin/env node

import axios from 'axios';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  language: string | null;
}

class GitHubRepoManager {
  private token: string;
  private apiBase = 'https://api.github.com';
  private headers: Record<string, string>;

  constructor(token: string) {
    this.token = token;
    this.headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async fetchRepos(): Promise<Repository[]> {
    const spinner = ora('Fetching your repositories...').start();
    const repos: Repository[] = [];
    let page = 1;
    const perPage = 100;

    try {
      while (true) {
        const response = await axios.get(`${this.apiBase}/user/repos`, {
          headers: this.headers,
          params: {
            per_page: perPage,
            page: page,
            sort: 'updated',
            direction: 'desc'
          }
        });

        repos.push(...response.data);

        const linkHeader = response.headers.link;
        if (!linkHeader || !linkHeader.includes('rel="next"')) {
          break;
        }
        page++;
      }

      spinner.succeed(`Found ${repos.length} repositories`);
      return repos;
    } catch (error) {
      spinner.fail('Failed to fetch repositories');
      if (axios.isAxiosError(error)) {
        console.error(chalk.red(`Error: ${error.response?.data?.message || error.message}`));
        if (error.response?.status === 401) {
          console.error(chalk.yellow('Please ensure your GITHUB_ACCESS_TOKEN has the necessary permissions.'));
        }
      }
      throw error;
    }
  }

  async deleteRepository(repo: Repository): Promise<boolean> {
    try {
      await axios.delete(`${this.apiBase}/repos/${repo.full_name}`, {
        headers: this.headers
      });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(chalk.red(`Failed to delete ${repo.name}: ${error.response?.data?.message || error.message}`));
        if (error.response?.status === 403) {
          console.error(chalk.yellow('Note: You need the "delete_repo" scope for your token.'));
        }
      }
      return false;
    }
  }

  formatRepoInfo(repo: Repository): string {
    const lastUpdated = new Date(repo.updated_at).toLocaleDateString();
    const size = `${(repo.size / 1024).toFixed(2)} MB`;
    const language = repo.language || 'Unknown';
    const visibility = repo.private ? chalk.yellow('[PRIVATE]') : chalk.green('[PUBLIC]');
    
    return `${visibility} ${chalk.bold(repo.name)} - ${language} - ${size} - Last updated: ${lastUpdated}`;
  }
}

async function main() {
  console.log(chalk.blue.bold('\n🗑️  GitHub Repository Bulk Remover\n'));

  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (!token) {
    console.error(chalk.red('Error: GITHUB_ACCESS_TOKEN environment variable is not set.'));
    console.error(chalk.yellow('Please export your GitHub personal access token:'));
    console.error(chalk.gray('export GITHUB_ACCESS_TOKEN="your_token_here"'));
    process.exit(1);
  }

  const manager = new GitHubRepoManager(token);

  try {
    const repos = await manager.fetchRepos();

    if (repos.length === 0) {
      console.log(chalk.yellow('No repositories found.'));
      return;
    }

    console.log(chalk.cyan('\nSelect repositories to delete (use space to select, enter to confirm):\n'));

    const choices = repos.map(repo => ({
      name: manager.formatRepoInfo(repo),
      value: repo,
      checked: false
    }));

    const { selectedRepos } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedRepos',
        message: 'Select repositories to delete:',
        choices: choices,
        pageSize: 15,
        loop: false
      }
    ]);

    if (!selectedRepos || selectedRepos.length === 0) {
      console.log(chalk.yellow('No repositories selected.'));
      return;
    }
    
    console.log(chalk.red.bold(`\n⚠️  WARNING: You are about to delete ${selectedRepos.length} repository(ies):`));
    selectedRepos.forEach((repo: Repository) => {
      console.log(chalk.red(`  - ${repo.name}`));
    });

    const { confirmDelete } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: chalk.red.bold('This action CANNOT be undone. Are you sure?'),
        default: false
      }
    ]);

    if (!confirmDelete) {
      console.log(chalk.green('Operation cancelled.'));
      return;
    }

    const { finalConfirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'finalConfirm',
        message: chalk.red.bold('Are you REALLY sure? This is your last chance!'),
        default: false
      }
    ]);

    if (!finalConfirm) {
      console.log(chalk.green('Operation cancelled.'));
      return;
    }

    console.log(chalk.yellow('\nDeleting repositories...\n'));

    const spinner = ora('Processing deletions...').start();
    let successCount = 0;
    let failCount = 0;

    for (const repo of selectedRepos) {
      spinner.text = `Deleting ${repo.name}...`;
      const success = await manager.deleteRepository(repo);
      
      if (success) {
        successCount++;
        console.log(chalk.green(`✓ Deleted: ${repo.name}`));
      } else {
        failCount++;
        console.log(chalk.red(`✗ Failed: ${repo.name}`));
      }
    }

    spinner.stop();

    console.log(chalk.blue.bold('\n📊 Summary:'));
    console.log(chalk.green(`  Successfully deleted: ${successCount}`));
    if (failCount > 0) {
      console.log(chalk.red(`  Failed: ${failCount}`));
    }

  } catch (error) {
    console.error(chalk.red('\nAn unexpected error occurred:'), error);
    process.exit(1);
  }
}

main().catch(console.error);