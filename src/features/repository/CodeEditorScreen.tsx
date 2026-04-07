import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService, getOctokit } from '../../services/githubService';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, FileCode, Settings, Maximize2, Minimize2, Eye, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodeEditorScreen() {
  const { owner, repo, '*': path } = useParams<{ owner: string; repo: string; '*': string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);

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
      setShowCommitModal(false);
      queryClient.invalidateQueries({ queryKey: ['fileContent', owner, repo, path] });
      setTimeout(() => navigate(-1), 1500);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to commit changes');
    },
  });

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'jsx': return 'jsx';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'py': return 'python';
      default: return 'text';
    }
  };

  if (isLoading) return (
    <div className="liquid-bg h-full flex flex-col items-center justify-center">
      <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center animate-pulse mb-4">
        <FileCode className="w-8 h-8 text-blue-500" />
      </div>
      <p className="text-slate-400 font-bold animate-pulse">Initializing Editor...</p>
    </div>
  );

  const fileName = path?.split('/').pop() || 'Untitled';
  const language = getLanguage(fileName);

  return (
    <div className="flex flex-col h-full liquid-bg overflow-hidden">
      {/* Header */}
      <div className="glass p-4 border-b border-white/20 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-blue-500" />
              <h2 className="font-black text-slate-900 truncate max-w-[120px]">{fileName}</h2>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
              {owner}/{repo}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'glass text-slate-600'}`}
          >
            {isEditing ? <Edit3 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          
          {isEditing && (
            <button
              onClick={() => setShowCommitModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Commit</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor/Viewer */}
      <div className="flex-1 overflow-hidden relative">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-6 font-mono text-sm focus:outline-none resize-none bg-white/40 backdrop-blur-sm text-slate-800 leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="h-full overflow-auto bg-slate-900/5 backdrop-blur-sm">
            <SyntaxHighlighter
              language={language}
              style={atomDark}
              showLineNumbers
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                height: '100%',
              }}
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: '1em',
                color: 'rgba(255,255,255,0.2)',
                textAlign: 'right',
                userSelect: 'none',
              }}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {/* File Info Bar */}
      <div className="glass px-4 py-2 border-t border-white/20 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-300">|</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {content.split('\n').length} Lines
          </span>
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {new Blob([content]).size} Bytes
        </div>
      </div>

      {/* Commit Modal */}
      <AnimatePresence>
        {showCommitModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommitModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="glass w-full max-w-md p-6 rounded-[2.5rem] border border-white/40 relative z-10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-900 mb-2">Commit Changes</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Describe what you changed in this file.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Commit Message
                  </label>
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="e.g., Update file content"
                    className="w-full p-4 bg-white/40 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/60 transition-all min-h-[100px] resize-none"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-bold">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowCommitModal(false)}
                    className="flex-1 py-4 glass rounded-2xl font-black text-slate-600 uppercase tracking-wider text-xs active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => commitMutation.mutate()}
                    disabled={commitMutation.isPending || !commitMessage}
                    className="flex-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-slate-200 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {commitMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Commit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {success && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 glass-dark text-white rounded-full flex items-center space-x-3 shadow-2xl"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm font-bold">Changes committed!</span>
        </motion.div>
      )}
    </div>
  );
}
