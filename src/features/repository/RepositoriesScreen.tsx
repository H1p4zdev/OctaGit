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
import { motion } from 'motion/react';

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
    <div className="liquid-bg min-h-full pb-24">
      {/* Header */}
      <div className="glass sticky top-0 z-10 border-b border-white/20">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] truncate">
              Repositories
            </p>
            <h2 className="text-xl font-black text-slate-900 truncate">
              @{username}
            </h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/40 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/60 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 glass rounded-3xl animate-pulse" />
          ))
        ) : filteredRepos?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Github className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold">No repositories found.</p>
          </div>
        ) : (
          filteredRepos?.map((repo, idx) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                to={`/repo/${repo.owner.login}/${repo.name}`}
                className="block p-5 glass rounded-[2rem] border border-white/40 hover:border-blue-500/30 transition-all active:scale-[0.98] group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center border border-white/60 shadow-sm">
                      <Github className="w-7 h-7 text-slate-800" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                        {repo.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1 max-w-[220px]">
                        {repo.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 glass rounded-full flex items-center justify-center border border-white/60 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>

                <div className="flex items-center space-x-5 mt-6 relative z-10">
                  <div className="flex items-center px-3 py-1.5 glass rounded-full border border-white/60 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <Circle className={cn("w-2 h-2 mr-2 fill-current", 
                      repo.language === 'TypeScript' ? 'text-blue-500' : 
                      repo.language === 'JavaScript' ? 'text-yellow-400' :
                      repo.language === 'Python' ? 'text-blue-400' :
                      'text-slate-400'
                    )} />
                    {repo.language || 'Unknown'}
                  </div>
                  <div className="flex items-center px-3 py-1.5 glass rounded-full border border-white/60 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <Star className="w-2.5 h-2.5 mr-1.5 text-amber-400 fill-amber-400" />
                    {repo.stargazers_count}
                  </div>
                  {repo.fork && (
                    <div className="flex items-center px-3 py-1.5 glass rounded-full border border-white/60 text-[10px] font-black uppercase tracking-wider text-blue-600">
                      Forked
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
