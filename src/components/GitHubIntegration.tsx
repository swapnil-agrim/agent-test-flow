import { useState, useEffect } from "react";
import { Github, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  private: boolean;
  default_branch: string;
}

interface GitHubIntegrationProps {
  onConnect?: (repositories: Repository[], accessToken: string) => void;
}

const GitHubIntegration = ({ onConnect }: GitHubIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [username, setUsername] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [cloneProtocol, setCloneProtocol] = useState("HTTPS");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [receivedAuth, setReceivedAuth] = useState(false);
  const { toast } = useToast();

  // Hydrate connection state from localStorage on mount
  useEffect(() => {
    try {
      const savedAccessToken = localStorage.getItem('github_access_token');
      const savedUsername = localStorage.getItem('github_username');
      const savedRepositories = localStorage.getItem('github_repositories');
      const savedSelectedRepo = localStorage.getItem('github_selected_repo');

      if (savedAccessToken && savedUsername && savedRepositories) {
        setAccessToken(savedAccessToken);
        setUsername(savedUsername);
        const repos = JSON.parse(savedRepositories);
        setRepositories(repos);
        
        if (savedSelectedRepo) {
          const repo = repos.find((r: Repository) => r.full_name === savedSelectedRepo);
          setSelectedRepo(repo || repos[0] || null);
        } else {
          setSelectedRepo(repos[0] || null);
        }
        
        setIsConnected(true);
      }
    } catch (e) {
      console.warn('Failed to hydrate GitHub connection from localStorage', e);
    }
  }, []);

  const handleConnectToGitHub = async () => {
    setIsConnecting(true);
    setReceivedAuth(false);
    
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined;
    
    if (!clientId) {
      toast({
        title: "Configuration Error",
        description: "GitHub Client ID is not configured.",
        variant: "destructive",
      });
      setIsConnecting(false);
      return;
    }

    try {
      // Get the GitHub App slug from the backend
      const { data: appData, error: appError } = await supabase.functions.invoke('github-oauth', {
        body: { action: 'get_client_id' }
      });

      if (appError || !appData?.app_slug) {
        throw new Error('Failed to get GitHub App configuration');
      }

      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('github_oauth_state', state);
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      // Use GitHub App installation flow - user selects repos
      const authUrl = `https://github.com/apps/${appData.app_slug}/installations/new?state=${state}`;
      
      const popup = window.open(
        authUrl,
        'GitHub App Installation',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup || popup.closed) {
        setIsConnecting(false);
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to connect to GitHub.",
          variant: "destructive",
        });
        return;
      }

      // Watch for installation completion
      const installationWatch = setInterval(() => {
        if (popup.closed) {
          clearInterval(installationWatch);
          
          // Check if we got an installation_id in sessionStorage
          const installationId = sessionStorage.getItem('github_installation_id');
          
          if (installationId) {
            // Now redirect to OAuth to get access token
            const redirectUri = encodeURIComponent(window.location.origin + '/github/callback');
            const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=repo`;
            
            const oauthPopup = window.open(
              oauthUrl,
              'GitHub Authorization',
              `width=${width},height=${height},left=${left},top=${top}`
            );
            
            if (!oauthPopup) {
              setIsConnecting(false);
              toast({
                title: "Authorization Required",
                description: "Please complete the authorization to continue.",
                variant: "destructive",
              });
              return;
            }

            // Set up message handler for OAuth popup
            const handleMessage = async (event: MessageEvent) => {
              if (event.origin !== window.location.origin) return;
              
              if (event.data.type === 'github-oauth-success') {
                setReceivedAuth(true);
                const { code, state: returnedState } = event.data;
                const storedState = sessionStorage.getItem('github_oauth_state');
                
                if (returnedState === storedState) {
                  try {
                    // Exchange code for access token via backend
                    const { data, error } = await supabase.functions.invoke('github-oauth', {
                      body: { 
                        code,
                        installation_id: installationId
                      }
                    });

                    if (error) throw error;

                    if (data.error) {
                      throw new Error(data.error);
                    }

                    // Store the access token and update state
                    setAccessToken(data.access_token);
                    setUsername(data.user.login);
                    setRepositories(data.repositories);
                    setSelectedRepo(data.repositories[0] || null);
                    setIsConnected(true);
                    setIsConnecting(false);

                    // Persist to localStorage
                    try {
                      localStorage.setItem('github_access_token', data.access_token);
                      localStorage.setItem('github_username', data.user.login);
                      localStorage.setItem('github_repositories', JSON.stringify(data.repositories));
                      if (data.repositories[0]?.full_name) {
                        localStorage.setItem('github_selected_repo', data.repositories[0].full_name);
                      }
                    } catch (e) {
                      console.warn('Failed to persist GitHub connection to localStorage', e);
                    }
                    
                    toast({
                      title: "Connected to GitHub",
                      description: `Connected as ${data.user.login}. Found ${data.repositories.length} repositories.`,
                    });

                    // Pass repositories and token to parent
                    onConnect?.(data.repositories, data.access_token);
                    
                    sessionStorage.removeItem('github_oauth_state');
                    sessionStorage.removeItem('github_installation_id');
                  } catch (err: any) {
                    console.error('OAuth error:', err);
                    setIsConnecting(false);
                    toast({
                      title: "Connection Failed",
                      description: err.message || "Failed to connect to GitHub. Please try again.",
                      variant: "destructive",
                    });
                  }
                }
                
                oauthPopup?.close();
                window.removeEventListener('message', handleMessage);
              } else if (event.data.type === 'github-oauth-error') {
                setReceivedAuth(true);
                setIsConnecting(false);
                toast({
                  title: "Authorization Failed",
                  description: event.data.error || "Failed to authorize with GitHub.",
                  variant: "destructive",
                });
                oauthPopup?.close();
                window.removeEventListener('message', handleMessage);
              }
            };
            
            window.addEventListener('message', handleMessage);
            
            // Watch for user closing the OAuth popup
            const oauthWatch = setInterval(() => {
              if (oauthPopup.closed) {
                clearInterval(oauthWatch);
                window.removeEventListener('message', handleMessage);
                if (!isConnected && !receivedAuth) {
                  setIsConnecting(false);
                  toast({
                    title: "Authorization window closed",
                    description: "GitHub authorization was not completed.",
                    variant: "destructive",
                  });
                }
              }
            }, 500);
          } else if (!isConnected && !receivedAuth) {
            setIsConnecting(false);
            toast({
              title: "Installation Incomplete",
              description: "GitHub App installation was not completed.",
              variant: "destructive",
            });
          }
        }
      }, 500);
    } catch (error: any) {
      console.error('GitHub App setup error:', error);
      setIsConnecting(false);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to initialize GitHub App connection.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setUsername("");
    setRepositories([]);
    setSelectedRepo(null);
    setAccessToken("");
    
    // Clear localStorage
    try {
      localStorage.removeItem('github_access_token');
      localStorage.removeItem('github_username');
      localStorage.removeItem('github_repositories');
      localStorage.removeItem('github_selected_repo');
    } catch (e) {
      console.warn('Failed to clear GitHub data from localStorage', e);
    }
    
    toast({
      title: "Disconnected",
      description: "GitHub integration has been disconnected.",
    });
  };

  const handleRepoChange = (repoFullName: string) => {
    const repo = repositories.find(r => r.full_name === repoFullName);
    if (repo) {
      setSelectedRepo(repo);
    }
  };

  const getCloneUrl = () => {
    if (!selectedRepo) return "";
    
    switch (cloneProtocol) {
      case "SSH":
        return selectedRepo.ssh_url;
      case "GitHub CLI":
        return `gh repo clone ${selectedRepo.full_name}`;
      default:
        return selectedRepo.clone_url;
    }
  };

  const handleCopyCloneUrl = async () => {
    await navigator.clipboard.writeText(getCloneUrl());
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Clone URL copied to clipboard.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Github className="h-4 w-4" />
          {isConnected && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-[hsl(var(--priority-low))] rounded-full border-2 border-card" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">GitHub</DialogTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              <ExternalLink className="h-3 w-3" />
              Docs
            </Button>
          </div>
          <DialogDescription>
            Sync your project 2-way with GitHub to collaborate at source.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {!isConnected ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Project</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your project to your GitHub organization in a 2-way sync.
                </p>
                <Button 
                  onClick={handleConnectToGitHub}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <span className="animate-pulse">Connecting to GitHub...</span>
                  ) : (
                    <>
                      <Github className="h-4 w-4 mr-2" />
                      Connect to GitHub
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Project Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Project</h3>
                    <Badge 
                      variant="outline" 
                      className="bg-[hsl(var(--priority-low))]/10 text-[hsl(var(--priority-low))] border-[hsl(var(--priority-low))]/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--priority-low))] mr-1.5" />
                      Connected
                    </Badge>
                  </div>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 text-xs"
                    onClick={() => selectedRepo && window.open(selectedRepo.html_url, '_blank')}
                    disabled={!selectedRepo}
                  >
                    View on GitHub
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your project to your GitHub organization in a 2-way sync.
                </p>
              </div>

              <Separator />

              {/* Repository Selection */}
              <div>
                <h3 className="text-sm font-medium mb-3">Repository Configuration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All repositories you have access to ({repositories.length} total).
                </p>
                
                <Select value={selectedRepo?.full_name} onValueChange={handleRepoChange}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.full_name} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{repo.full_name}</span>
                          {repo.private && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              Private
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Clone Section */}
              <div>
                <h3 className="text-sm font-medium mb-3">Clone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy this repository to your local environment.
                </p>
                
                <Tabs value={cloneProtocol} onValueChange={setCloneProtocol} className="mb-3">
                  <TabsList className="bg-secondary h-8">
                    <TabsTrigger value="HTTPS" className="text-xs">HTTPS</TabsTrigger>
                    <TabsTrigger value="SSH" className="text-xs">SSH</TabsTrigger>
                    <TabsTrigger value="GitHub CLI" className="text-xs">GitHub CLI</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 rounded-md px-3 py-2 font-mono text-xs border border-border overflow-x-auto">
                    {getCloneUrl()}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleCopyCloneUrl}
                    disabled={!selectedRepo}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[hsl(var(--priority-low))]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Connected Account Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Connected Account</h3>
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      Admin
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Github className="h-4 w-4" />
                    <span>{username}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your GitHub account to manage connected organizations.
                </p>
                
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Disconnect GitHub
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubIntegration;
