import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { Bell, CheckCircle2, MessageSquare, GitPullRequest, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';

export function NotificationsScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    notificationService.requestPermissions();
  }, []);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: githubService.getNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => githubService.markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => githubService.markAllNotificationsAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'Issue': return <AlertCircle className="w-5 h-5 text-green-600" />;
      case 'PullRequest': return <GitPullRequest className="w-5 h-5 text-blue-600" />;
      case 'Commit': return <CheckCircle2 className="w-5 h-5 text-slate-600" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.unread) {
      markAsReadMutation.mutate(notification.id);
    }
    
    const repoFullName = notification.repository.full_name;
    let deepLink = `/repo/${repoFullName}`;

    if (notification.subject.type === 'Commit') {
      const commitSha = notification.subject.url.split('/').pop();
      deepLink = `/repo/${repoFullName}/commit/${commitSha}`;
    }

    navigate(deepLink);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-xl font-bold">Inbox</h2>
        <button 
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending || notifications?.length === 0}
          className="text-blue-600 text-sm font-semibold disabled:opacity-50"
        >
          {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 border-b border-slate-50 animate-pulse flex space-x-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : notifications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 text-sm mt-1">You have no unread notifications.</p>
          </div>
        ) : (
          notifications?.map(notification => (
            <div 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "p-4 border-b border-slate-50 flex items-start space-x-4 active:bg-slate-50 transition-colors cursor-pointer",
                notification.unread ? "bg-blue-50/30" : "bg-white"
              )}
            >
              <div className="mt-1 shrink-0">
                {getIcon(notification.subject.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-400 truncate uppercase tracking-wider">
                    {notification.repository.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                    {formatDistanceToNow(new Date(notification.updated_at))} ago
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">
                  {notification.subject.title}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold uppercase tracking-tighter">
                    {notification.reason.replace(/_/g, ' ')}
                  </span>
                  {notification.unread && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 mt-1" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
