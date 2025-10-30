import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GitHubCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const installationId = params.get('installation_id');
    const setupAction = params.get('setup_action');

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'github-oauth-error', error },
          window.location.origin
        );
      }
    } else if (code && state) {
      // Send success to parent window with installation info
      if (window.opener) {
        window.opener.postMessage(
          { 
            type: 'github-oauth-success', 
            code, 
            state,
            search: window.location.search 
          },
          window.location.origin
        );
      }
    } else if (setupAction === 'install' && installationId) {
      // GitHub App was installed, redirect to OAuth flow
      const clientId = params.get('client_id') || import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (clientId) {
        const redirectUri = encodeURIComponent(window.location.origin + '/github/callback');
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=repo`;
        return;
      }
    }

    // Close popup or redirect
    if (window.opener) {
      window.close();
    } else {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Connecting to GitHub...</h1>
        <p className="text-muted-foreground">Please wait while we complete the authorization.</p>
      </div>
    </div>
  );
};

export default GitHubCallback;
