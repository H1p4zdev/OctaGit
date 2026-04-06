export interface GitHubHost {
  id: string;
  name: string;
  baseUrl: string;
  apiUrl: string;
  isEnterprise: boolean;
}

export interface GitHubSession {
  token: string;
  hostId: string;
  user: {
    login: string;
    avatarUrl: string;
    name?: string;
  };
}

export const DEFAULT_HOSTS: GitHubHost[] = [
  {
    id: 'github.com',
    name: 'GitHub.com',
    baseUrl: 'https://github.com',
    apiUrl: 'https://api.github.com',
    isEnterprise: false,
  },
];
