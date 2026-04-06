import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { ArrowLeft, File, ChevronRight, Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CommitDiffScreen() {
  const { owner, repo, ref } = useParams<{ owner: string; repo: string; ref: string }>();
  const navigate = useNavigate();

  const { data: files, isLoading } = useQuery({
    queryKey: ['commitDiff', owner, repo, ref],
    queryFn: () => githubService.getCommitDiff(owner!, repo!, ref!),
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading diff...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              Commit Diff
            </p>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {ref?.substring(0, 7)}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {files?.map((file: any) => (
          <div key={file.filename} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <File className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-700 truncate">{file.filename}</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold">
                <span className="text-green-600">+{file.additions}</span>
                <span className="text-red-600">-{file.deletions}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <pre className="p-4 text-[10px] font-mono leading-relaxed">
                {file.patch?.split('\n').map((line: string, i: number) => {
                  const isAdded = line.startsWith('+');
                  const isRemoved = line.startsWith('-');
                  const isHeader = line.startsWith('@@');
                  
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "whitespace-pre",
                        isAdded && "bg-green-50 text-green-700 -mx-4 px-4",
                        isRemoved && "bg-red-50 text-red-700 -mx-4 px-4",
                        isHeader && "text-blue-500 font-bold"
                      )}
                    >
                      {line}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
