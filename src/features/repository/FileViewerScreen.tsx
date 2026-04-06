import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { ArrowLeft, FileText, Download, Share2, Edit3 } from 'lucide-react';
import { CodeSnippet } from '../../components/ui/CodeSnippet';

export function FileViewerScreen() {
  const { owner, repo, '*': path } = useParams<{ owner: string; repo: string; '*': string }>();
  const navigate = useNavigate();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['fileContent', owner, repo, path],
    queryFn: () => githubService.getFileContent(owner!, repo!, path!),
    enabled: !!owner && !!repo && !!path,
  });

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'jsx': return 'jsx';
      case 'py': return 'python';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'cs': return 'csharp';
      case 'php': return 'php';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'yml':
      case 'yaml': return 'yaml';
      case 'sh': return 'bash';
      default: return 'text';
    }
  };

  const filename = path?.split('/').pop() || 'File';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              {repo}
            </p>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {filename}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate(`/repo/${owner}/${repo}/edit/${path}`)}
              className="p-2 text-slate-500 active:scale-95 transition-transform"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 pb-24">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="h-4 bg-slate-200 rounded w-4/6" />
            <div className="h-4 bg-slate-200 rounded w-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
            <p className="font-bold mb-2">Error loading file</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        ) : content ? (
          <CodeSnippet code={content} language={getLanguage(filename)} />
        ) : (
          <div className="p-8 text-center text-slate-400 italic">
            No content available.
          </div>
        )}
      </div>
    </div>
  );
}
