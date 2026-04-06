import React, { useState, useEffect } from 'react';
import { Github, Key, Globe, ArrowRight, AlertCircle, LogIn } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Octokit } from 'octokit';
import { motion } from 'motion/react';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function LoginScreen() {
  const { setSession, hosts } = useAuthStore();
  const [token, setToken] = useState('');
  const [selectedHostId, setSelectedHostId] = useState('github.com');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticateWithToken = async (oauthToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const octokit = new Octokit({
        auth: oauthToken,
      });

      const { data: user } = await octokit.rest.users.getAuthenticated();

      setSession({
        token: oauthToken,
        hostId: 'github.com',
        user: {
          login: user.login,
          avatarUrl: user.avatar_url,
          name: user.name || undefined,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Handle Web Message (Popup)
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.token) {
        authenticateWithToken(event.data.token);
      }
    };

    // Handle Native Deep Link
    const handleDeepLink = async (data: { url: string }) => {
      const url = new URL(data.url);
      if (url.host === 'oauth' || url.pathname.includes('oauth')) {
        const token = url.searchParams.get('token');
        if (token) {
          await Browser.close();
          authenticateWithToken(token);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    const appListener = App.addListener('appUrlOpen', handleDeepLink);

    return () => {
      window.removeEventListener('message', handleMessage);
      appListener.then(l => l.remove());
    };
  }, [setSession]);

  const handleOAuthLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isNative = Capacitor.isNativePlatform();
      const platformParam = isNative ? 'mobile' : 'web';
      
      // Use absolute URL for native platforms, relative for web
      const baseUrl = isNative ? (process.env.APP_URL || '') : '';
      const response = await fetch(`${baseUrl}/api/auth/github/url?platform=${platformParam}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
      const { url } = await response.json();

      if (isNative) {
        await Browser.open({ url, windowName: '_self' });
      } else {
        const authWindow = window.open(
          url,
          'github_oauth_popup',
          'width=600,height=700'
        );

        if (!authWindow) {
          throw new Error('Popup was blocked. Please allow popups for this site.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate GitHub OAuth.');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const host = hosts.find(h => h.id === selectedHostId);
      if (!host) throw new Error('Invalid host');

      const octokit = new Octokit({
        auth: token,
        baseUrl: host.apiUrl,
      });

      const { data: user } = await octokit.rest.users.getAuthenticated();

      setSession({
        token,
        hostId: selectedHostId,
        user: {
          login: user.login,
          avatarUrl: user.avatar_url,
          name: user.name || undefined,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Check your token and host.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100"
        >
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Github className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Sign in to GitHub</h1>
          <p className="text-slate-500 text-center mb-8 text-sm">
            Connect with your GitHub account or use a Personal Access Token.
          </p>

          <div className="space-y-6">
            <button
              onClick={handleOAuthLogin}
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  <span>Sign in with GitHub</span>
                </>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or use token</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Host
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedHostId}
                  onChange={(e) => setSelectedHostId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium"
                >
                  {hosts.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Personal Access Token
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

        <p className="mt-8 text-center text-slate-400 text-xs px-8 leading-relaxed">
          By signing in, you agree to connect your GitHub account. We only store your token locally on this device.
        </p>
      </div>
    </div>
  );
}
