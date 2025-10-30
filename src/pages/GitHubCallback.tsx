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
    const errorDescription = params.get('error_description');
    const installationId = params.get('installation_id');
    const setupAction = params.get('setup_action');

    console.log('[GitHubCallback] Params:', { code, state, error, installationId, setupAction });

    // Handle GitHub App installation callback
    if (setupAction === 'install' && installationId) {
      console.log('[GitHubCallback] Installation complete, storing installation_id:', installationId);
      // Store installation ID for the parent window to use
      sessionStorage.setItem('github_installation_id', installationId);
      
      // Notify parent window
      if (window.opener && !window.opener.closed) {
        console.log('[GitHubCallback] Notifying parent of installation complete');
        window.opener.postMessage(
          { 
            type: 'github-installation-complete',
            installation_id: installationId
          },
          window.location.origin
        );
        // Give the parent a moment to receive the message
        setTimeout(() => {
          window.close();
        }, 100);
      } else {
        navigate('/');
      }
      return;
    }

    // Handle OAuth errors
    if (error) {
      console.log('[GitHubCallback] OAuth error:', error, errorDescription);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { 
            type: 'github-oauth-error', 
            error: errorDescription || error 
          },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    // Handle OAuth success
    if (code && state) {
      console.log('[GitHubCallback] OAuth success, code received');
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { 
            type: 'github-oauth-success', 
            code, 
            state,
            search: window.location.search 
          },
          window.location.origin
        );
        setTimeout(() => {
          window.close();
        }, 100);
      } else {
        window.close();
      }
      return;
    }

    // No relevant params, just navigate home
    console.log('[GitHubCallback] No relevant params, navigating home');
    navigate('/');
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
