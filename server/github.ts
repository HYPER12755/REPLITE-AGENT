// GitHub integration using Octokit - Reference: github blueprint connector
import { Octokit } from "@octokit/rest";

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings?.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" +
      hostname +
      "/api/v2/connection?include_secrets=true&connector_names=github",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error("GitHub not connected");
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// GitHub service functions
export class GitHubService {
  async getAuthenticatedUser() {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.users.getAuthenticated();
    return data;
  }

  async listRepositories(options?: { per_page?: number; page?: number }) {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: options?.per_page || 30,
      page: options?.page || 1,
      sort: "updated",
    });
    return data;
  }

  async getRepository(owner: string, repo: string) {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.repos.get({ owner, repo });
    return data;
  }

  async listBranches(owner: string, repo: string) {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });
    return data.map((b) => b.name);
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromBranch?: string
  ) {
    const octokit = await getUncachableGitHubClient();

    // Get the SHA of the source branch
    const sourceBranch = fromBranch || "main";
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${sourceBranch}`,
    });

    // Create the new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    return branchName;
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    const octokit = await getUncachableGitHubClient();
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      if ("content" in data) {
        return {
          content: Buffer.from(data.content, "base64").toString("utf-8"),
          sha: data.sha,
        };
      }
      throw new Error("Path is a directory, not a file");
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ) {
    const octokit = await getUncachableGitHubClient();

    const params: any = {
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
    };

    if (sha) {
      params.sha = sha;
    }

    const { data } = await octokit.repos.createOrUpdateFileContents(params);
    return data;
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ) {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    });
    return data;
  }

  async listPullRequests(owner: string, repo: string, state?: "open" | "closed" | "all") {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: state || "open",
      per_page: 30,
    });
    return data;
  }

  async createPRComment(owner: string, repo: string, prNumber: number, body: string) {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
    return data;
  }

  async closePullRequest(owner: string, repo: string, prNumber: number) {
    const octokit = await getUncachableGitHubClient();
    const { data } = await octokit.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      state: "closed",
    });
    return data;
  }

  async getCloneUrl(owner: string, repo: string) {
    const accessToken = await getAccessToken();
    return `https://${accessToken}@github.com/${owner}/${repo}.git`;
  }
}

export const githubService = new GitHubService();
