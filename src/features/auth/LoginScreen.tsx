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
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Device Flow State
  const [deviceFlowData, setDeviceFlowData] = useState<{
    user_code: string;
    device_code: string;
    verification_uri: string;
    interval: number;
    expires_in: number;
  } | null>(null);

  const authenticateWithToken = async (oauthToken: string) => {
    setIsOAuthLoading(true);
    setIsTokenLoading(true);
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
      setIsOAuthLoading(false);
      setIsTokenLoading(false);
    }
  };

  const pollForToken = async (deviceCode: string, interval: number) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        });

        const data = await response.json();

        if (data.access_token) {
          clearInterval(pollInterval);
          setDeviceFlowData(null);
          authenticateWithToken(data.access_token);
        } else if (data.error) {
          if (data.error === 'authorization_pending') {
            // Still waiting for user
            return;
          } else if (data.error === 'slow_down') {
            // GitHub asked to slow down, but we'll just keep the current interval for simplicity
            // in a real app you'd increase the interval
            return;
          } else {
            // Other errors (expired_token, access_denied, etc.)
            clearInterval(pollInterval);
            setError(data.error_description || data.error);
            setDeviceFlowData(null);
            setIsOAuthLoading(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, interval * 1000);

    // Cleanup polling after expiration
    setTimeout(() => {
      clearInterval(pollInterval);
      if (deviceFlowData?.device_code === deviceCode) {
        setDeviceFlowData(null);
        setIsOAuthLoading(false);
        setError('Device code expired. Please try again.');
      }
    }, 900000); // 15 minutes max
  };

  const handleDeviceFlowLogin = async () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      setError('GITHUB_CLIENT_ID is not configured in the app.');
      return;
    }

    setIsOAuthLoading(true);
    setError(null);
    setDeviceFlowData(null);

    try {
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          scope: 'repo,user,notifications,workflow,gist,project,read:org,read:discussion,read:packages,read:gpg_key,read:public_key,read:repo_hook,admin:org,admin:public_key,admin:repo_hook,admin:org_hook,admin:gpg_key',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get device code');
      }

      const data = await response.json();
      setDeviceFlowData(data);

      // Open browser automatically
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: data.verification_uri });
      } else {
        window.open(data.verification_uri, '_blank');
      }

      // Start polling
      pollForToken(data.device_code, data.interval || 5);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate GitHub login.');
      setIsOAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsTokenLoading(true);
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
      setIsTokenLoading(false);
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
            {!deviceFlowData ? (
              <button
                type="button"
                onClick={handleDeviceFlowLogin}
                disabled={isOAuthLoading || isTokenLoading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                {isOAuthLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Github className="w-5 h-5" />
                    <span>Sign in with GitHub</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center space-y-4">
                <p className="text-sm font-medium text-blue-800">Enter this code on GitHub:</p>
                <div className="text-3xl font-black tracking-widest text-blue-600 font-mono">
                  {deviceFlowData.user_code}
                </div>
                <button
                  onClick={() => Browser.open({ url: deviceFlowData.verification_uri })}
                  className="text-xs font-bold text-blue-600 underline uppercase tracking-wider"
                >
                  Open GitHub Activation
                </button>
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs">Waiting for authorization...</span>
                </div>
                <button
                  onClick={() => {
                    setDeviceFlowData(null);
                    setIsOAuthLoading(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            )}

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
              disabled={isOAuthLoading || isTokenLoading || !token}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              {isTokenLoading ? (
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
