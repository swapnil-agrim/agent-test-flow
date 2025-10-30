const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, installation_id } = await req.json();
    
    if (!code) {
      throw new Error('Authorization code is required');
    }

    const clientId = Deno.env.get('GITHUB_CLIENT_ID');
    const clientSecret = Deno.env.get('GITHUB_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }

    console.log('Exchanging code for access token...', { installation_id });

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;
    console.log('Successfully obtained access token');

    // Fetch user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const userData = await userResponse.json();
    console.log('Fetched user:', userData.login);

    let repositories = [];
    
    // If installation_id is provided, fetch installation repositories (GitHub App)
    if (installation_id) {
      console.log('Fetching installation repositories...');
      const installationReposResponse = await fetch(
        `https://api.github.com/user/installations/${installation_id}/repositories?per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (installationReposResponse.ok) {
        const data = await installationReposResponse.json();
        repositories = data.repositories || [];
        console.log(`Fetched ${repositories.length} installation repositories`);
      } else {
        console.warn('Failed to fetch installation repositories, falling back to user repos');
      }
    }
    
    // Fallback to user repositories if no installation or installation fetch failed
    if (repositories.length === 0) {
      const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!reposResponse.ok) {
        throw new Error('Failed to fetch repositories');
      }

      repositories = await reposResponse.json();
      console.log(`Fetched ${repositories.length} user repositories`);
    }

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        user: {
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
        },
        repositories: repositories.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          clone_url: repo.clone_url,
          ssh_url: repo.ssh_url,
          html_url: repo.html_url,
          private: repo.private,
          description: repo.description,
          updated_at: repo.updated_at,
          default_branch: repo.default_branch,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in github-oauth function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
