import { useState } from "react";
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
}

interface GitHubIntegrationProps {
  onConnect?: (username: string, repoUrl: string) => void;
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
  const { toast } = useToast();

  const handleConnectToGitHub = () => {
    setIsConnecting(true);
    
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined;
    const appName = import.meta.env.VITE_GITHUB_APP_NAME as string | undefined;
    
    if (!clientId) {
      toast({
        title: "Configuration Error",
        description: "GitHub Client ID is not configured.",
        variant: "destructive",
      });
      setIsConnecting(false);
      return;
    }

    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('github_oauth_state', state);
    
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // GitHub App installation flow for repository selection
    let authUrl: string;
    if (appName) {
      // Use GitHub App installation URL - allows repository selection
      authUrl = `https://github.com/apps/${appName}/installations/new?state=${state}`;
    } else {
      // Fallback to OAuth flow with repository permissions
      const redirectUri = encodeURIComponent(window.location.origin + '/github/callback');
      authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
    }
    
    const popup = window.open(
      authUrl,
      'GitHub Authorization',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'github-oauth-success') {
        const { code, state: returnedState } = event.data;
        const storedState = sessionStorage.getItem('github_oauth_state');
        
        if (returnedState === storedState) {
          try {
            // Extract installation_id from URL if present (GitHub App flow)
            const urlParams = new URLSearchParams(event.data.search || '');
            const installationId = urlParams.get('installation_id');
            
            // Exchange code for access token via backend
            const { data, error } = await supabase.functions.invoke('github-oauth', {
              body: { 
                code,
                ...(installationId && { installation_id: installationId })
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
            
            toast({
              title: "Connected to GitHub",
              description: `Connected as ${data.user.login}. Found ${data.repositories.length} repositories.`,
            });

            if (data.repositories[0]) {
              onConnect?.(data.user.login, data.repositories[0].clone_url);
            }
            
            sessionStorage.removeItem('github_oauth_state');
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
        
        popup?.close();
        window.removeEventListener('message', handleMessage);
      } else if (event.data.type === 'github-oauth-error') {
        setIsConnecting(false);
        toast({
          title: "Authorization Failed",
          description: event.data.error || "Failed to authorize with GitHub.",
          variant: "destructive",
        });
        popup?.close();
        window.removeEventListener('message', handleMessage);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    if (!popup || popup.closed) {
      setIsConnecting(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to connect to GitHub.",
        variant: "destructive",
      });
      window.removeEventListener('message', handleMessage);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setUsername("");
    setRepositories([]);
    setSelectedRepo(null);
    setAccessToken("");
    
    toast({
      title: "Disconnected",
      description: "GitHub integration has been disconnected.",
    });
  };

  const handleRepoChange = (repoFullName: string) => {
    const repo = repositories.find(r => r.full_name === repoFullName);
    if (repo) {
      setSelectedRepo(repo);
      onConnect?.(username, repo.clone_url);
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
