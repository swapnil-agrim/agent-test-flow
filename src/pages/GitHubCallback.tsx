import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
        const installationIdParam = params.get('installation_id');
        const storedInstallationId = sessionStorage.getItem('github_installation_id');
        window.opener.postMessage(
          { 
            type: 'github-oauth-success', 
            code, 
            state,
            installation_id: installationIdParam || storedInstallationId || undefined,
            search: window.location.search 
          },
          window.location.origin
        );
      }
    } else if (setupAction === 'install' && installationId) {
      // GitHub App was installed, redirect to OAuth flow
      // Persist installation_id so we can fetch permitted repositories after OAuth
      sessionStorage.setItem('github_installation_id', installationId);
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
