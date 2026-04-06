import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService, getOctokit } from '../../services/githubService';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export function CodeEditorScreen() {
  const { owner, repo, '*': path } = useParams<{ owner: string; repo: string; '*': string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: fileData, isLoading } = useQuery({
    queryKey: ['fileRaw', owner, repo, path],
    queryFn: async () => {
      const octokit = getOctokit();
      if (!octokit) throw new Error('Not authenticated');
      const { data } = await octokit.rest.repos.getContent({
        owner: owner!,
        repo: repo!,
        path: path!,
      });
      return data as any;
    },
  });

  useEffect(() => {
    if (fileData?.content) {
      setContent(atob(fileData.content.replace(/\n/g, '')));
    }
  }, [fileData]);

  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!commitMessage) throw new Error('Commit message is required');
      return githubService.updateFile(
        owner!,
        repo!,
        path!,
        content,
        commitMessage,
        fileData.sha
      );
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['fileContent', owner, repo, path] });
      setTimeout(() => navigate(-1), 1500);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to commit changes');
    },
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading editor...</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold truncate max-w-[150px]">{path?.split('/').pop()}</h2>
        </div>
        <button
          onClick={() => commitMutation.mutate()}
          disabled={commitMutation.isPending || !commitMessage}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center space-x-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>Commit</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full p-4 font-mono text-sm focus:outline-none resize-none bg-slate-50"
          spellCheck={false}
        />
        
        <div className="p-4 border-t border-slate-200 bg-white">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
            Commit Message
          </label>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Update file content"
            className="w-full p-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-xs">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center text-green-600 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Changes committed successfully!
        </motion.div>
      )}
    </div>
  );
}
