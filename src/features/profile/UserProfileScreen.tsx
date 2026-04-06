import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubService, decodeBase64 } from '../../services/githubService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Link as LinkIcon, 
  Twitter, 
  Github, 
  ChevronRight,
  Star,
  Circle,
  BookOpen,
  GitFork,
  Trophy,
  Flame,
  Zap,
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function UserProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [isAchievementsOpen, setIsAchievementsOpen] = React.useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => githubService.getUser(username!),
    enabled: !!username,
  });

  const { data: repos, isLoading: loadingRepos } = useQuery({
    queryKey: ['userRecentRepos', username],
    queryFn: () => githubService.getUserRecentRepos(username!),
    enabled: !!username,
  });

  const { data: profileReadme, isLoading: loadingReadme } = useQuery({
    queryKey: ['profileReadme', username],
    queryFn: () => githubService.getProfileReadme(username!),
    enabled: !!username,
  });

  if (loadingUser) {
    return (
      <div className="bg-slate-50 min-h-full animate-pulse">
        <div className="bg-white p-6 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl" />
            <div className="space-y-2">
              <div className="h-6 bg-slate-100 rounded w-32" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 truncate">
            {user?.login}
          </h2>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-6 border-b border-slate-200">
        <div className="flex items-center space-x-4 mb-4">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={user?.avatar_url} 
            alt="Avatar" 
            className="w-20 h-20 rounded-3xl shadow-lg border-2 border-white" 
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{user?.name || user?.login}</h2>
            <p className="text-slate-500 font-medium">@{user?.login}</p>
          </div>
        </div>

        {user?.bio && (
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            {user.bio}
          </p>
        )}

        <div className="flex items-center space-x-4 text-sm font-medium text-slate-500 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1.5" />
            <span className="text-slate-900 font-bold mr-1">{user?.followers}</span> followers
          </div>
          <div className="flex items-center">
            <span className="text-slate-900 font-bold mr-1">{user?.following}</span> following
          </div>
        </div>

        <div className="space-y-2">
          {user?.location && (
            <div className="flex items-center text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 mr-2" />
              {user.location}
            </div>
          )}
          {user?.blog && (
            <div className="flex items-center text-xs text-slate-500">
              <LinkIcon className="w-3.5 h-3.5 mr-2" />
              <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer" className="text-blue-600 truncate">
                {user.blog}
              </a>
            </div>
          )}
          {user?.twitter_username && (
            <div className="flex items-center text-xs text-slate-500">
              <Twitter className="w-3.5 h-3.5 mr-2" />
              @{user.twitter_username}
            </div>
          )}
        </div>
      </div>

      {/* Profile README */}
      {profileReadme && (
        <div className="p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 text-slate-400">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{user?.login} / README.md</span>
            </div>
            <div className="markdown-body text-sm prose prose-slate max-w-none prose-img:rounded-xl prose-img:mx-auto prose-img:max-w-full prose-img:h-auto prose-a:text-blue-600 prose-headings:border-b prose-headings:pb-2 prose-headings:mb-4">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {decodeBase64(profileReadme.content)}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      <div className="p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Achievements</h3>
            </div>
            <button 
              onClick={() => setIsAchievementsOpen(true)}
              className="text-blue-600 text-xs font-bold"
            >
              View all
            </button>
          </div>
          
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-1">
            {[
              { icon: Flame, label: 'Arctic Code Vault Contributor', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Zap, label: 'Pull Shark', color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: Award, label: 'YOLO', color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: Star, label: 'Pro', color: 'text-slate-900', bg: 'bg-slate-100' }
            ].map((achievement, i) => (
              <div key={i} className="flex flex-col items-center space-y-2 shrink-0">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center border-2 border-white shadow-sm", achievement.bg)}>
                  <achievement.icon className={cn("w-7 h-7", achievement.color)} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 text-center max-w-[70px] leading-tight">
                  {achievement.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Drawer */}
      <AnimatePresence>
        {isAchievementsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAchievementsOpen(false)}
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
                <h3 className="text-2xl font-bold text-slate-900">Achievements</h3>
                <button onClick={() => setIsAchievementsOpen(false)} className="p-2 bg-slate-50 rounded-xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Flame, label: 'Arctic Code Vault Contributor', desc: 'Contributed code to repositories in the 2020 GitHub Archive Program.' },
                  { icon: Zap, label: 'Pull Shark', desc: 'Opened pull requests that have been merged.' },
                  { icon: Award, label: 'YOLO', desc: 'Merged a pull request without code review.' },
                  { icon: Star, label: 'Pro', desc: 'Active GitHub Pro subscriber.' },
                  { icon: Github, label: 'Public Sponsor', desc: 'Sponsoring open source projects.' },
                  { icon: Users, label: 'Galaxy Brain', desc: 'Answered discussions that were marked as the answer.' }
                ].map((achievement, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <achievement.icon className="w-8 h-8 text-slate-700" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{achievement.label}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{achievement.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Repositories */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Popular Repositories</h3>
          <Link 
            to={`/profile/${user?.login}/repos`}
            className="text-blue-600 text-xs font-bold"
          >
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {loadingRepos ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))
          ) : (
            repos?.map(repo => (
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
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{repo.name}</p>
                      <p className="text-xs text-slate-500 truncate">{repo.description || 'No description'}</p>
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
                  <div className="flex items-center">
                    <GitFork className="w-3 h-3 mr-1" />
                    {repo.forks_count}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
