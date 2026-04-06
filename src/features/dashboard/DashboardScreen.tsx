import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { 
  Star, 
  Circle, 
  Clock, 
  ChevronRight, 
  GitPullRequest, 
  AlertCircle, 
  Github,
  TrendingUp,
  Compass,
  LayoutGrid,
  MessageSquare,
  GitCommit,
  UserPlus,
  Eye,
  Package,
  BookOpen,
  GitBranch
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export function DashboardScreen() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['authenticatedUser'],
    queryFn: githubService.getAuthenticatedUser,
  });

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: githubService.getEvents,
  });

  const { data: issues } = useQuery({
    queryKey: ['issues'],
    queryFn: githubService.getUserIssues,
  });

  const { data: prs } = useQuery({
    queryKey: ['prs'],
    queryFn: githubService.getUserPullRequests,
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PushEvent': return <GitCommit className="w-4 h-4 text-blue-500" />;
      case 'WatchEvent': return <Star className="w-4 h-4 text-amber-500" />;
      case 'CreateEvent': return <Package className="w-4 h-4 text-green-500" />;
      case 'PullRequestEvent': return <GitPullRequest className="w-4 h-4 text-purple-500" />;
      case 'IssuesEvent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'IssueCommentEvent': return <MessageSquare className="w-4 h-4 text-slate-500" />;
      case 'FollowEvent': return <UserPlus className="w-4 h-4 text-pink-500" />;
      case 'ForkEvent': return <GitBranch className="w-4 h-4 text-indigo-500" />;
      default: return <Github className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatEventAction = (event: any) => {
    const { type, payload, repo } = event;
    const repoName = repo.name;
    
    switch (type) {
      case 'PushEvent':
        return (
          <span>
            pushed to <span className="font-bold text-slate-900">{payload.ref.replace('refs/heads/', '')}</span> in <Link to={`/repo/${repoName}`} className="font-bold text-blue-600">{repoName}</Link>
          </span>
        );
      case 'WatchEvent':
        return (
          <span>
            starred <Link to={`/repo/${repoName}`} className="font-bold text-blue-600">{repoName}</Link>
          </span>
        );
      case 'CreateEvent':
        return (
          <span>
            created {payload.ref_type} <span className="font-bold text-slate-900">{payload.ref || repoName}</span>
          </span>
        );
      case 'PullRequestEvent':
        return (
          <span>
            {payload.action} pull request <span className="font-bold text-slate-900">#{payload.number}</span> in <Link to={`/repo/${repoName}`} className="font-bold text-blue-600">{repoName}</Link>
          </span>
        );
      case 'IssuesEvent':
        return (
          <span>
            {payload.action} issue <span className="font-bold text-slate-900">#{payload.issue.number}</span> in <Link to={`/repo/${repoName}`} className="font-bold text-blue-600">{repoName}</Link>
          </span>
        );
      case 'IssueCommentEvent':
        return (
          <span>
            commented on issue <span className="font-bold text-slate-900">#{payload.issue.number}</span> in <Link to={`/repo/${repoName}`} className="font-bold text-blue-600">{repoName}</Link>
          </span>
        );
      case 'ForkEvent':
        return (
          <span>
            forked <Link to={`/repo/${repoName}`} className="font-bold text-blue-600">{repoName}</Link>
          </span>
        );
      case 'FollowEvent':
        return (
          <span>
            started following <Link to={`/user/${payload.target.login}`} className="font-bold text-blue-600">{payload.target.login}</Link>
          </span>
        );
      default:
        return <span>performed an action in <span className="font-bold">{repoName}</span></span>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-full pb-24">
      {/* Hero Banner */}
      <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight mb-1">Activity Feed</h2>
          <p className="text-slate-400 text-sm font-medium">Stay updated with your network.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-6 relative z-10 grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{issues?.length || 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open Issues</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <GitPullRequest className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{prs?.length || 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pull Requests</p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Feed Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-slate-900" />
              <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {loadingEvents ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              events?.map((event: any) => (
                <div 
                  key={event.id} 
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <Link to={`/user/${event.actor.login}`} className="flex-shrink-0 active:opacity-70 transition-opacity">
                      <img 
                        src={event.actor.avatar_url} 
                        alt={event.actor.login} 
                        className="w-10 h-10 rounded-full border border-slate-100" 
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1 bg-slate-50 rounded-lg">
                          {getEventIcon(event.type)}
                        </div>
                        <p className="text-sm text-slate-600 leading-snug">
                          <Link to={`/user/${event.actor.login}`} className="font-bold text-slate-900 hover:text-blue-600">
                            {event.actor.login}
                          </Link>{' '}
                          {formatEventAction(event)}
                        </p>
                      </div>
                      <div className="flex items-center text-[10px] font-bold text-slate-400 mt-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </div>
                      
                      {/* Event Specific Content */}
                      {event.type === 'PushEvent' && event.payload.commits && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          {event.payload.commits.slice(0, 2).map((commit: any, idx: number) => (
                            <div key={idx} className="flex items-start space-x-2 mb-1 last:mb-0">
                              <GitCommit className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0" />
                              <p className="text-[11px] text-slate-600 line-clamp-1 font-mono">
                                {commit.message}
                              </p>
                            </div>
                          ))}
                          {event.payload.commits.length > 2 && (
                            <p className="text-[10px] text-slate-400 font-bold mt-1 ml-5">
                              + {event.payload.commits.length - 2} more commits
                            </p>
                          )}
                        </div>
                      )}

                      {event.type === 'IssueCommentEvent' && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-[11px] text-slate-500 line-clamp-2">
                          "{event.payload.comment.body}"
                        </div>
                      )}
                    </div>
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
