import { Octokit } from 'octokit';
import { useAuthStore } from '../stores/useAuthStore';

export const getOctokit = () => {
  const session = useAuthStore.getState().session;
  const hosts = useAuthStore.getState().hosts;
  
  if (!session) return null;
  
  const host = hosts.find(h => h.id === session.hostId);
  if (!host) return null;

  return new Octokit({
    auth: session.token,
    baseUrl: host.apiUrl,
  });
};

export const decodeBase64 = (base64: string) => {
  const binString = atob(base64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

export const githubService = {
  getNotifications: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.activity.listNotificationsForAuthenticatedUser({
      all: true,
    });
    return data;
  },
  
  getRepositories: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 10,
    });
    return data;
  },
  
  getUserIssues: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.issues.listForAuthenticatedUser({
      filter: 'assigned',
      state: 'open',
      sort: 'updated',
    });
    return data;
  },

  getUserPullRequests: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    // GitHub API doesn't have a direct "list PRs for user" like issues, 
    // so we search for them
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: 'is:pr is:open author:@me',
      sort: 'updated',
    });
    return data.items;
  },

  getRepository: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return data;
  },

  getReadme: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    return data;
  },

  getRepoContents: async (owner: string, repo: string, path: string = '') => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    return data;
  },

  getAuthenticatedUser: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
  },

  getUser: async (username: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.users.getByUsername({ username });
    return data;
  },

  getUserRecentRepos: async (username: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 5,
    });
    return data;
  },

  getReleases: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.listReleases({ owner, repo, per_page: 5 });
    return data;
  },

  getContributors: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.listContributors({ owner, repo, per_page: 10 });
    return data;
  },

  getTags: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.listTags({ owner, repo, per_page: 20 });
    return data;
  },

  getWorkflowRunLogs: async (owner: string, repo: string, run_id: number) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.actions.downloadWorkflowRunLogs({ owner, repo, run_id });
    return data;
  },

  getWorkflowRunArtifacts: async (owner: string, repo: string, run_id: number) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({ owner, repo, run_id });
    return data.artifacts;
  },

  getWorkflowRunUsage: async (owner: string, repo: string, run_id: number) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.actions.getWorkflowRunUsage({ owner, repo, run_id });
    return data;
  },

  searchUsers: async (q: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.search.users({ q, per_page: 20 });
    return data.items;
  },

  searchRepos: async (q: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.search.repos({ q, per_page: 20 });
    return data.items;
  },

  getFileContent: async (owner: string, repo: string, path: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });
    
    if ('content' in data && typeof data.content === 'string') {
      return decodeBase64(data.content);
    }
    throw new Error('Not a file or content not available');
  },

  getCommits: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.listCommits({ owner, repo, per_page: 20 });
    return data;
  },

  getCommitDiff: async (owner: string, repo: string, ref: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref });
    return data.files;
  },

  updateFile: async (owner: string, repo: string, path: string, content: string, message: string, sha: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: btoa(content),
      sha,
    });
    return data;
  },

  forkRepository: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.createFork({ owner, repo });
    return data;
  },

  getWorkflowRuns: async (owner: string, repo: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({ owner, repo, per_page: 10 });
    return data.workflow_runs;
  },

  rerunWorkflow: async (owner: string, repo: string, run_id: number) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    await octokit.rest.actions.reRunWorkflow({ owner, repo, run_id });
  },

  markNotificationAsRead: async (thread_id: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    await octokit.rest.activity.markThreadAsRead({ thread_id: parseInt(thread_id) });
  },

  markAllNotificationsAsRead: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    await octokit.rest.activity.markNotificationsAsRead();
  },

  getExploreTopics: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    // Searching for popular topics
    const { data } = await octokit.rest.search.repos({
      q: 'stars:>10000',
      sort: 'stars',
      per_page: 10,
    });
    return data.items;
  },

  getAllUserRepositories: async (username: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 100,
    });
    return data;
  },

  getEvents: async () => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const user = await githubService.getAuthenticatedUser();
    const { data } = await octokit.rest.activity.listReceivedEventsForUser({
      username: user.login,
      per_page: 30,
    });
    return data;
  },

  getUserEvents: async (username: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    const { data } = await octokit.rest.activity.listEventsForAuthenticatedUser({
      username,
      per_page: 30,
    });
    return data;
  },

  getProfileReadme: async (username: string) => {
    const octokit = getOctokit();
    if (!octokit) throw new Error('Not authenticated');
    try {
      const { data } = await octokit.rest.repos.getReadme({
        owner: username,
        repo: username,
      });
      return data;
    } catch (e) {
      return null;
    }
  }
};
