import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GitBranch, Database } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const ImportView = () => {
  const [consoleMessages] = useState([
    { time: "10:23:45", message: "System ready..." },
  ]);
  
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [knowledgeBaseUrl, setKnowledgeBaseUrl] = useState("");

  const handleSync = () => {
    console.log("Syncing with:", { repoUrl, branch, knowledgeBaseUrl });
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Setup & Sync</h2>
              <p className="text-muted-foreground">
                Connect your repository and knowledge base to sync test cases with your working branch
              </p>
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
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/org/repo.git"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="bg-secondary border-border mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your Git repository where test cases will be stored
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="branch" className="text-sm font-medium">Working Branch</Label>
                    <Input
                      id="branch"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="bg-secondary border-border mt-2"
                    />
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
