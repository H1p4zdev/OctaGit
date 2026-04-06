import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService, decodeBase64 } from '../../services/githubService';
import { 
  ArrowLeft, 
  Star, 
  GitBranch, 
  Eye, 
  BookOpen, 
  File, 
  Folder, 
  ChevronRight,
  Clock,
  Circle,
  Github,
  GitFork,
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Code2,
  Users,
  Tag,
  Package,
  MoreVertical,
  Settings,
  Shield,
  Bell,
  Info,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function RepositoryDetailScreen() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'readme' | 'files' | 'commits' | 'actions' | 'details'>('readme');
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: repository, isLoading: loadingRepo } = useQuery({
    queryKey: ['repo', owner, repo],
    queryFn: () => githubService.getRepository(owner!, repo!),
  });

  const { data: readme, isLoading: loadingReadme } = useQuery({
    queryKey: ['readme', owner, repo],
    queryFn: () => githubService.getReadme(owner!, repo!),
    enabled: activeTab === 'readme',
  });

  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['contents', owner, repo, currentPath],
    queryFn: () => githubService.getRepoContents(owner!, repo!, currentPath),
    enabled: activeTab === 'files',
  });

  const { data: commits, isLoading: loadingCommits } = useQuery({
    queryKey: ['commits', owner, repo],
    queryFn: () => githubService.getCommits(owner!, repo!),
    enabled: activeTab === 'commits',
  });

  const { data: actions, isLoading: loadingActions } = useQuery({
    queryKey: ['actions', owner, repo],
    queryFn: () => githubService.getWorkflowRuns(owner!, repo!),
    enabled: activeTab === 'actions',
  });

  const { data: releases } = useQuery({
    queryKey: ['releases', owner, repo],
    queryFn: () => githubService.getReleases(owner!, repo!),
    enabled: activeTab === 'details',
  });

  const { data: contributors } = useQuery({
    queryKey: ['contributors', owner, repo],
    queryFn: () => githubService.getContributors(owner!, repo!),
    enabled: activeTab === 'details',
  });

  const { data: tags } = useQuery({
    queryKey: ['tags', owner, repo],
    queryFn: () => githubService.getTags(owner!, repo!),
    enabled: activeTab === 'details',
  });

  const forkMutation = useMutation({
    mutationFn: () => githubService.forkRepository(owner!, repo!),
    onSuccess: (data) => {
      alert(`Successfully forked to ${data.full_name}`);
      queryClient.invalidateQueries({ queryKey: ['repos'] });
      navigate(`/repo/${data.full_name}`);
    },
  });

  if (loadingRepo) {
    return (
      <div className="flex flex-col h-full bg-white animate-pulse">
        <div className="h-14 border-b border-slate-100" />
        <div className="p-6 space-y-4">
          <div className="h-8 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const renderReadme = () => {
    if (loadingReadme) return <div className="p-8 text-center animate-pulse">Loading README...</div>;
    if (!readme) return <p className="text-slate-400 text-center py-12 italic">No README found.</p>;
    
    try {
      const content = atob(readme.content.replace(/\n/g, ''));
      return (
        <div className="p-6 bg-white">
          <div className="markdown-body text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      );
    } catch (e) {
      return <p className="text-red-500 p-6">Error decoding README</p>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto relative">
      {/* Nav Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-[80%] bg-white z-[101] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">Manage Repo</h3>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-slate-50 rounded-xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <section>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Repository</h4>
                  <div className="space-y-2">
                    {[
                      { icon: Star, label: 'Star Repository', color: 'text-amber-500' },
                      { icon: Bell, label: 'Notifications', color: 'text-blue-500' },
                      { icon: GitFork, label: 'Fork Repository', color: 'text-purple-500' },
                      { icon: Eye, label: 'Watch Repository', color: 'text-green-500' },
                    ].map((item, i) => (
                      <button key={i} className="w-full flex items-center p-4 bg-slate-50 rounded-2xl active:bg-slate-100 transition-colors">
                        <item.icon className={cn("w-5 h-5 mr-4", item.color)} />
                        <span className="font-bold text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Settings</h4>
                  <div className="space-y-2">
                    {[
                      { icon: Settings, label: 'Repo Settings' },
                      { icon: Shield, label: 'Security & Analysis' },
                      { icon: Info, label: 'About this repo' },
                    ].map((item, i) => (
                      <button key={i} className="w-full flex items-center p-4 border border-slate-100 rounded-2xl active:bg-slate-50 transition-colors">
                        <item.icon className="w-5 h-5 mr-4 text-slate-400" />
                        <span className="font-bold text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] text-center text-slate-400 font-medium">
                  GitMobile v1.0.0 • {owner}/{repo}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setIsDrawerOpen(true)} className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>
          <Link to={`/user/${repository.owner.login}`} className="flex items-center space-x-3 mb-2 active:opacity-70 transition-opacity">
            <img src={repository.owner.avatar_url} className="w-6 h-6 rounded-md" />
            <p className="text-slate-400 text-sm font-medium">{repository.owner.login}</p>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight mb-4">{repository.name}</h2>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold backdrop-blur-md">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{(repository.stargazers_count / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold backdrop-blur-md">
              <GitFork className="w-3.5 h-3.5 text-slate-300" />
              <span>{repository.forks_count}</span>
            </div>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold backdrop-blur-md">
              <Eye className="w-3.5 h-3.5 text-slate-300" />
              <span>{repository.watchers_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 -mt-5 relative z-10 flex space-x-3 mb-6 shrink-0">
        <button 
          onClick={() => forkMutation.mutate()}
          disabled={forkMutation.isPending}
          className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <GitFork className={cn("w-5 h-5", forkMutation.isPending && "animate-spin")} />
          <span>{forkMutation.isPending ? 'Forking...' : 'Fork Repo'}</span>
        </button>
        <button className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
          <Star className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-sm py-2">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {[
            { id: 'readme', icon: BookOpen, label: 'README' },
            { id: 'files', icon: File, label: 'Files' },
            { id: 'commits', icon: Clock, label: 'Commits' },
            { id: 'actions', icon: PlayCircle, label: 'Actions' },
            { id: 'details', icon: Info, label: 'Details' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 pb-24">
        {activeTab === 'readme' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingReadme ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-32 bg-slate-100 rounded w-full" />
              </div>
            ) : readme ? (
              <div className="markdown-body text-sm prose prose-slate max-w-none prose-img:rounded-xl prose-img:mx-auto prose-img:max-w-full prose-img:h-auto prose-a:text-blue-600 prose-headings:border-b prose-headings:pb-2 prose-headings:mb-4">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {decodeBase64(readme.content)}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No README found.</p>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {currentPath && (
              <button 
                onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/'))}
                className="w-full flex items-center p-4 border-b border-slate-100 text-blue-600 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to ..
              </button>
            )}
            {loadingContents ? (
              <div className="p-4 space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl" />)}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {Array.isArray(contents) && contents.map((item: any) => (
                  <div 
                    key={item.sha}
                    onClick={() => {
                      if (item.type === 'dir') {
                        setCurrentPath(item.path);
                      } else {
                        navigate(`/repo/${owner}/${repo}/file/${item.path}`);
                      }
                    }}
                    className="flex items-center p-4 active:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {item.type === 'dir' ? (
                      <Folder className="w-5 h-5 text-blue-500 mr-4" />
                    ) : (
                      <File className="w-5 h-5 text-slate-400 mr-4" />
                    )}
                    <span className="flex-1 text-sm font-bold text-slate-700 truncate">{item.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="space-y-3">
            {loadingCommits ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />)
            ) : (
              commits?.map((commit: any) => (
                <Link 
                  key={commit.sha}
                  to={`/repo/${owner}/${repo}/commit/${commit.sha}`}
                  className="block p-4 bg-white rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{commit.commit.message}</p>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {commit.sha.substring(0, 7)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={commit.author?.avatar_url} className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-bold text-slate-500">{commit.author?.login || commit.commit.author.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {formatDistanceToNow(new Date(commit.commit.author.date))} ago
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            {loadingActions ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />)
            ) : (
              actions?.map((run: any) => (
                <Link 
                  key={run.id} 
                  to={`/repo/${owner}/${repo}/actions/${run.id}`}
                  className="block p-4 bg-white rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {run.conclusion === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : run.conclusion === 'failure' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{run.display_title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{run.name}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-500">
                      <span className="flex items-center">
                        <Code2 className="w-3 h-3 mr-1" />
                        {run.head_branch}
                      </span>
                      <span>#{run.run_number}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        githubService.rerunWorkflow(owner!, repo!, run.id);
                      }}
                      className="p-2 bg-slate-50 rounded-lg active:scale-95 transition-transform"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Releases */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-slate-900" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Releases</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{releases?.length || 0} total</span>
              </div>
              <div className="space-y-2">
                {releases?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-white rounded-2xl border border-slate-100 italic">No releases found.</p>
                ) : (
                  releases?.map((release: any) => (
                    <div key={release.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {release.tag_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatDistanceToNow(new Date(release.published_at))} ago
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-1">{release.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{release.body?.replace(/[#*`]/g, '')}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Tags */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-slate-900" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Tags</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{tags?.length || 0} total</span>
              </div>
              <div className="space-y-2">
                {tags?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-white rounded-2xl border border-slate-100 italic">No tags found.</p>
                ) : (
                  tags?.map((tag: any) => (
                    <div key={tag.name} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{tag.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {tag.commit.sha.substring(0, 7)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Contributors */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-900" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Contributors</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {contributors?.map((contributor: any) => (
                  <Link 
                    key={contributor.id} 
                    to={`/user/${contributor.login}`}
                    className="flex items-center p-3 bg-white rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
                  >
                    <img src={contributor.avatar_url} className="w-8 h-8 rounded-full mr-3" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{contributor.login}</p>
                      <p className="text-[10px] font-bold text-slate-400">{contributor.contributions} commits</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Packages Placeholder */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-slate-900" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Packages</h3>
                </div>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
                <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium italic">No packages published.</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
