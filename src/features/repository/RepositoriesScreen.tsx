import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { 
  ArrowLeft, 
  Github, 
  Star, 
  Circle, 
  ChevronRight,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function RepositoriesScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: repos, isLoading } = useQuery({
    queryKey: ['userAllRepos', username],
    queryFn: () => githubService.getAllUserRepositories(username!),
    enabled: !!username,
  });

  const filteredRepos = repos?.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-full pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              Repositories
            </p>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              @{username}
            </h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))
        ) : filteredRepos?.length === 0 ? (
          <div className="text-center py-12">
            <Github className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No repositories found.</p>
          </div>
        ) : (
          filteredRepos?.map(repo => (
            <Link 
              key={repo.id} 
              to={`/repo/${repo.owner.login}/${repo.name}`}
              className="block p-4 bg-white rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                    <Github className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{repo.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{repo.description || 'No description'}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex items-center space-x-4 mt-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center">
                  <Circle className={cn("w-2 h-2 mr-1.5 fill-current", repo.language === 'TypeScript' ? 'text-blue-500' : 'text-slate-400')} />
                  {repo.language || 'Unknown'}
                </div>
                <div className="flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  {repo.stargazers_count}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
