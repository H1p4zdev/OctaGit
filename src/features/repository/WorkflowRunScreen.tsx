import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { 
  ArrowLeft, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Package,
  Terminal,
  ChevronRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function WorkflowRunScreen() {
  const { owner, repo, runId } = useParams<{ owner: string; repo: string; runId: string }>();
  const navigate = useNavigate();
  const run_id = parseInt(runId!);

  const { data: run, isLoading: loadingRun } = useQuery({
    queryKey: ['workflowRun', owner, repo, run_id],
    queryFn: async () => {
      const octokit = (githubService as any).getOctokit();
      if (!octokit) throw new Error('Not authenticated');
      const { data } = await octokit.rest.actions.getWorkflowRun({ owner, repo, run_id });
      return data;
    },
    enabled: !!owner && !!repo && !!run_id,
  });

  const { data: artifacts, isLoading: loadingArtifacts } = useQuery({
    queryKey: ['workflowArtifacts', owner, repo, run_id],
    queryFn: () => githubService.getWorkflowRunArtifacts(owner!, repo!, run_id),
    enabled: !!owner && !!repo && !!run_id,
  });

  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['workflowUsage', owner, repo, run_id],
    queryFn: () => githubService.getWorkflowRunUsage(owner!, repo!, run_id),
    enabled: !!owner && !!repo && !!run_id,
  });

  if (loadingRun) {
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

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold backdrop-blur-md">
              <Terminal className="w-3.5 h-3.5" />
              <span>RUN #{run?.run_number}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            {run?.conclusion === 'success' ? (
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            ) : run?.conclusion === 'failure' ? (
              <XCircle className="w-8 h-8 text-red-400" />
            ) : (
              <Clock className="w-8 h-8 text-amber-400" />
            )}
            <div>
              <h2 className="text-xl font-extrabold tracking-tight leading-tight">{run?.display_title}</h2>
              <p className="text-slate-400 text-xs font-medium mt-1">{run?.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold backdrop-blur-md">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>{run?.updated_at ? formatDistanceToNow(new Date(run.updated_at)) : ''} ago</span>
            </div>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold backdrop-blur-md">
              <RefreshCw className="w-3 h-3 text-slate-300" />
              <span>{run?.run_attempt} attempts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 space-y-6">
        {/* Summary Card */}
        <section className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xl shadow-slate-200/50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Run Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
              <p className="text-sm font-bold text-slate-900 capitalize">{run?.status}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Conclusion</p>
              <p className={cn(
                "text-sm font-bold capitalize",
                run?.conclusion === 'success' ? "text-green-600" : "text-red-600"
              )}>{run?.conclusion || 'pending'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Event</p>
              <p className="text-sm font-bold text-slate-900 capitalize">{run?.event}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duration</p>
              <p className="text-sm font-bold text-slate-900">
                {usage?.run_duration_ms ? `${Math.floor(usage.run_duration_ms / 1000)}s` : 'N/A'}
              </p>
            </div>
          </div>
        </section>

        {/* Logs Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-900" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Logs</h3>
            </div>
          </div>
          <button 
            onClick={() => window.open(run?.html_url + '/logs', '_blank')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <Terminal className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">View Full Logs</p>
                <p className="text-[10px] font-bold text-slate-400">Open in GitHub Browser</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-300" />
          </button>
        </section>

        {/* Artifacts Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-slate-900" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Artifacts</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{artifacts?.length || 0} total</span>
          </div>
          <div className="space-y-2">
            {loadingArtifacts ? (
              <div className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ) : artifacts?.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
                <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium italic">No artifacts produced.</p>
              </div>
            ) : (
              artifacts?.map((artifact: any) => (
                <div key={artifact.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{artifact.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{(artifact.size_in_bytes / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button className="p-2 bg-slate-50 rounded-lg active:scale-95 transition-transform">
                    <Download className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
