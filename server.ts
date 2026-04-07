import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get the base URL of the application
const getBaseUrl = (req: express.Request) => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  // Fallback for Vercel/Cloud Run if APP_URL is missing
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${protocol}://${host}`;
};

// GitHub OAuth URL Endpoint
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GITHUB_CLIENT_ID is not configured' });
  }

  const platform = req.query.platform || 'web';
  const appUrl = getBaseUrl(req);
  const redirectUri = `${appUrl}/auth/github/callback`;
  
  console.log(`[OAuth] Generated Redirect URI: ${redirectUri}`);
  const scopes = [
    'repo',
    'user',
    'notifications',
    'workflow',
    'gist',
    'project',
    'read:org',
    'read:discussion',
    'read:packages',
    'read:gpg_key',
    'read:public_key',
    'read:repo_hook',
    'admin:org',
    'admin:public_key',
    'admin:repo_hook',
    'admin:org_hook',
    'admin:gpg_key'
  ].join(',');

  const state = Buffer.from(JSON.stringify({ platform, nonce: Math.random().toString(36).substring(7) })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params}`;
  res.json({ url: authUrl });
});

// GitHub OAuth Callback Handler
app.get(['/auth/github/callback', '/auth/github/callback/'], async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  let platform = 'web';
  try {
    if (state) {
      const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
      platform = decodedState.platform || 'web';
    }
  } catch (e) {
    console.error('Failed to decode state:', e);
  }

  try {
    const appUrl = getBaseUrl(req);
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${appUrl}/auth/github/callback`,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    const accessToken = data.access_token;

    if (platform === 'mobile') {
      // Redirect to the custom scheme for the Android app
      const appScheme = 'com.gitmobile.app';
      return res.redirect(`${appScheme}://oauth?token=${accessToken}`);
    }

    // Send success message to parent window and close popup for web
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                token: '${accessToken}' 
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth exchange error:', error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
