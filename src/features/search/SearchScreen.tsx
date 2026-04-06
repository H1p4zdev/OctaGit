import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { 
  Search as SearchIcon, 
  Github, 
  Star, 
  Circle, 
  ChevronRight, 
  User, 
  BookOpen, 
  History, 
  X,
  Filter,
  ArrowUpDown,
  Code2,
  Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getOctokit } from '../../services/githubService';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'repositories' | 'users' | 'issues'>('repositories');
  const [history, setHistory] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filters
  const [language, setLanguage] = useState<string>('');
  const [sort, setSort] = useState<string>('best-match');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const [minStars, setMinStars] = useState<string>('');

  const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Swift'];

  useEffect(() => {
    const savedHistory = localStorage.getItem('search_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const addToHistory = (q: string) => {
    if (!q || q.length < 2) return;
    const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const removeFromHistory = (q: string) => {
    const newHistory = history.filter(h => h !== q);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const buildQuery = () => {
    let q = query;
    if (language) q += ` language:${language}`;
    if (minStars) q += ` stars:>=${minStars}`;
    return q;
  };

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', searchType, query, language, sort, order, minStars],
    queryFn: async () => {
      if (!query) return null;
      const octokit = getOctokit();
      if (!octokit) return null;
      
      const fullQuery = buildQuery();
      
      const { data } = await octokit.rest.search[searchType]({
        q: fullQuery,
        sort: sort === 'best-match' ? undefined : sort as any,
        order,
        per_page: 20,
      });
      addToHistory(query);
      return data.items;
    },
    enabled: query.length > 2,
  });

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    // Escape special characters for regex
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-blue-100 text-blue-700 rounded-sm px-0.5 font-bold">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Filters Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[101] rounded-t-[40px] shadow-2xl p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900">Search Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-slate-50 rounded-xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Language */}
                <section>
                  <div className="flex items-center space-x-2 mb-4">
                    <Code2 className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Language</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setLanguage('')}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        language === '' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      Any
                    </button>
                    {LANGUAGES.map(lang => (
                      <button 
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          language === lang ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Sort By */}
                <section>
                  <div className="flex items-center space-x-2 mb-4">
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'best-match', label: 'Best Match' },
                      { id: 'stars', label: 'Stars' },
                      { id: 'forks', label: 'Forks' },
                      { id: 'updated', label: 'Recently Updated' }
                    ].map(s => (
                      <button 
                        key={s.id}
                        onClick={() => setSort(s.id)}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-xs font-bold transition-all border",
                          sort === s.id ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-100 text-slate-500"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Min Stars */}
                <section>
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Minimum Stars</h4>
                  </div>
                  <input 
                    type="number"
                    placeholder="e.g. 1000"
                    value={minStars}
                    onChange={(e) => setMinStars(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </section>

                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-transform"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GitHub..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              "p-3 rounded-2xl border transition-all relative",
              (language || minStars || sort !== 'best-match') 
                ? "bg-blue-50 border-blue-200 text-blue-600" 
                : "bg-white border-slate-200 text-slate-400"
            )}
          >
            <Filter className="w-6 h-6" />
            {(language || minStars || sort !== 'best-match') && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
            )}
          </button>
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
          {['repositories', 'users', 'issues'].map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                searchType === type 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {!query ? (
          <div className="p-4 space-y-6">
            {history.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Searches</h3>
                  <button onClick={() => { setHistory([]); localStorage.removeItem('search_history'); }} className="text-[10px] font-bold text-blue-600 uppercase">Clear All</button>
                </div>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <button onClick={() => setQuery(h)} className="flex items-center flex-1 text-sm font-medium text-slate-600">
                        <History className="w-4 h-4 mr-3 text-slate-300" />
                        {h}
                      </button>
                      <button onClick={() => removeFromHistory(h)} className="p-1">
                        <X className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <div className="flex flex-col items-center justify-center pt-12 text-center text-slate-400">
              <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">Search for repositories, users, or issues</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : results?.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No results found for "{query}"
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {results?.map((item: any) => (
              <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors">
                {searchType === 'repositories' ? (
                  <Link to={`/repo/${item.owner.login}/${item.name}`} className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{highlightText(item.full_name, query)}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{item.description}</p>
                        <div className="flex items-center space-x-3 mt-2 text-[10px] font-bold text-slate-400">
                          <div className="flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {item.stargazers_count}
                          </div>
                          <div className="flex items-center">
                            <Circle className="w-2 h-2 mr-1 fill-current text-blue-500" />
                            {item.language}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </Link>
                ) : searchType === 'users' ? (
                  <Link to={`/user/${item.login}`} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={item.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-bold text-slate-900">{highlightText(item.login, query)}</p>
                        <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </Link>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Github className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{highlightText(item.title, query)}</p>
                        <p className="text-xs text-slate-500">#{item.number} in {item.repository_url.split('/').slice(-2).join('/')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
