import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GitBranch, Database } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import GitHubIntegration from "./GitHubIntegration";
import { useToast } from "@/hooks/use-toast";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  clone_url: string;
  default_branch: string;
}

interface Branch {
  name: string;
  commit: {
    sha: string;
  };
}

const ImportView = () => {
  const { toast } = useToast();
  const [consoleMessages] = useState([
    { time: "10:23:45", message: "System ready..." },
  ]);
  
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [knowledgeBaseUrl, setKnowledgeBaseUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // Hydrate from previous GitHub connection if available
  useEffect(() => {
    try {
      const storedRepos = localStorage.getItem('github_repositories');
      const storedToken = localStorage.getItem('github_access_token');
      const storedSelected = localStorage.getItem('github_selected_repo');
      if (storedRepos && storedToken) {
        const repos: Repository[] = JSON.parse(storedRepos);
        setRepositories(repos);
        setAccessToken(storedToken);
        const initialRepo = storedSelected || repos[0]?.full_name;
        if (initialRepo) {
          setSelectedRepo(initialRepo);
          const defaultBranch = repos.find(r => r.full_name === initialRepo)?.default_branch;
          if (defaultBranch) setSelectedBranch(defaultBranch);
          fetchBranches(initialRepo, storedToken);
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate GitHub data from localStorage', e);
    }
  }, []);

  const handleGitHubConnect = (repos: Repository[], token: string) => {
    setRepositories(repos);
    setAccessToken(token);
    if (repos.length > 0) {
      setSelectedRepo(repos[0].full_name);
      setSelectedBranch(repos[0].default_branch);
      fetchBranches(repos[0].full_name, token);
    }
  };

  const fetchBranches = async (repoFullName: string, token: string) => {
    if (!repoFullName || !token) return;
    
    setIsLoadingBranches(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/branches`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const branchesData: Branch[] = await response.json();
      setBranches(branchesData);
      
      // Set default branch if not already set
      if (!selectedBranch && branchesData.length > 0) {
        const repo = repositories.find(r => r.full_name === repoFullName);
        const defaultBranch = repo?.default_branch || branchesData[0].name;
        setSelectedBranch(defaultBranch);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch branches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleRepoChange = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    setBranches([]);
    setSelectedBranch("");
    fetchBranches(repoFullName, accessToken);
  };

  const handleSync = () => {
    const repo = repositories.find(r => r.full_name === selectedRepo);
    console.log("Syncing with:", { 
      repoUrl: repo?.clone_url, 
      branch: selectedBranch, 
      knowledgeBaseUrl 
    });
    
    toast({
      title: "Sync Configuration",
      description: `Ready to sync ${selectedRepo} (${selectedBranch})`,
    });
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Setup & Sync</h2>
                <p className="text-muted-foreground">
                  Connect your repository and knowledge base to sync test cases with your working branch
                </p>
              </div>
              <GitHubIntegration onConnect={handleGitHubConnect} />
            </div>

            <div className="space-y-6">
              {/* Repository Configuration */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GitBranch className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Repository Configuration</CardTitle>
                      <CardDescription>Connect to your Git repository</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="repo-url" className="text-sm font-medium">Repository URL</Label>
                    {repositories.length > 0 ? (
                      <Select value={selectedRepo} onValueChange={handleRepoChange}>
                        <SelectTrigger className="w-full bg-secondary border-border mt-2">
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                          {repositories.map((repo) => (
                            <SelectItem key={repo.id} value={repo.full_name} className="cursor-pointer">
                              <span className="font-mono text-sm">{repo.full_name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="repo-url"
                        placeholder="Connect to GitHub first"
                        disabled
                        className="bg-secondary border-border mt-2"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Your Git repository where test cases will be stored
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="branch" className="text-sm font-medium">Working Branch</Label>
                    {branches.length > 0 ? (
                      <Select 
                        value={selectedBranch} 
                        onValueChange={setSelectedBranch}
                        disabled={isLoadingBranches}
                      >
                        <SelectTrigger className="w-full bg-secondary border-border mt-2">
                          <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select a branch"} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                          {branches.map((branch) => (
                            <SelectItem key={branch.name} value={branch.name} className="cursor-pointer">
                              <span className="font-mono text-sm">{branch.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="branch"
                        placeholder={isLoadingBranches ? "Loading branches..." : "Select a repository first"}
                        disabled
                        className="bg-secondary border-border mt-2"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Branch to sync manual and automated test cases
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Knowledge Base Configuration */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Knowledge Base</CardTitle>
                      <CardDescription>Link to your documentation and requirements</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="kb-url" className="text-sm font-medium">Knowledge Base URL</Label>
                    <Input
                      id="kb-url"
                      placeholder="https://your-org.atlassian.net/wiki or https://notion.so/..."
                      value={knowledgeBaseUrl}
                      onChange={(e) => setKnowledgeBaseUrl(e.target.value)}
                      className="bg-secondary border-border mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Confluence, Notion, or other documentation platform
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sync Actions */}
              <div className="flex gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={handleSync}
                  className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <GitBranch className="h-5 w-5 mr-2" />
                  Sync Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Console */}
        <div className="h-48 border-t border-border bg-[hsl(var(--console-bg))]">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Console</span>
          </div>
          <ScrollArea className="h-[calc(100%-40px)] scrollbar-thin">
            <div className="p-4 font-mono text-sm space-y-1">
              {consoleMessages.map((msg, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-muted-foreground">{msg.time}</span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ImportView;
