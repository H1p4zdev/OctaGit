import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { 
  Compass, 
  Star, 
  ChevronRight,
  TrendingUp,
  Search,
  Zap,
  Flame,
  Trophy,
  Code,
  Globe,
  Cpu,
  Layout,
  Database,
  Smartphone,
  Terminal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getOctokit } from '../../services/githubService';

const TOPICS = [
  { id: 'react', label: 'React', icon: Layout, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'typescript', label: 'TypeScript', icon: Code, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'nodejs', label: 'Node.js', icon: Terminal, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'python', label: 'Python', icon: Globe, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'rust', label: 'Rust', icon: Cpu, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'android', label: 'Android', icon: Smartphone, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'database', label: 'Database', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export function ExploreScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLang, setSelectedLang] = React.useState<string | null>(null);

  const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Swift', 'Kotlin'];

  const { data: trendingRepos, isLoading } = useQuery({
    queryKey: ['exploreTrending', selectedLang],
    queryFn: async () => {
      const octokit = getOctokit();
      if (!octokit) return [];
      const q = selectedLang ? `stars:>10000 language:${selectedLang}` : 'stars:>10000';
      const { data } = await octokit.rest.search.repos({
        q,
        sort: 'stars',
        per_page: 20,
      });
      return data.items;
    },
  });

  const filteredRepos = trendingRepos?.filter(repo => 
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-full pb-24">
      {/* Hero Header */}
      <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight mb-1">Explore</h2>
          <p className="text-slate-400 text-sm font-medium">Discover the next big thing.</p>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search trending repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>

        {/* Topics Grid */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Popular Topics</h3>
          </div>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
            {TOPICS.map(topic => (
              <button 
                key={topic.id}
                onClick={() => setSelectedLang(topic.label)}
                className="flex flex-col items-center space-y-2 shrink-0 group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm transition-all active:scale-95 group-hover:shadow-md",
                  topic.bg
                )}>
                  <topic.icon className={cn("w-8 h-8", topic.color)} />
                </div>
                <span className="text-[10px] font-bold text-slate-600">{topic.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-slate-900" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trending Repos</h3>
            </div>
            <div className="flex space-x-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setSelectedLang(null)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  selectedLang === null ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                All
              </button>
              {LANGUAGES.map(lang => (
                <button 
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                    selectedLang === lang ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
              ))
            ) : (
              filteredRepos?.map(repo => (
                <div 
                  key={repo.id} 
                  className="block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
                >
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <Link to={`/user/${repo.owner.login}`} className="flex items-center space-x-3 active:opacity-70 transition-opacity">
                        <img src={repo.owner.avatar_url} className="w-8 h-8 rounded-lg" />
                        <p className="font-bold text-slate-900 truncate max-w-[180px]">{repo.full_name}</p>
                      </Link>
                      <div className="flex items-center space-x-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{(repo.stargazers_count / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                    <Link to={`/repo/${repo.owner.login}/${repo.name}`}>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {repo.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {repo.language}
                        </span>
                        {repo.topics?.slice(0, 2).map((t: string) => (
                          <span key={t} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
