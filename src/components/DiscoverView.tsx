import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GitBranch, FileText, Link, Upload, Figma, Ticket, Play } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ReviewModal, { GeneratedTestCase } from "./ReviewModal";
import { useToast } from "@/hooks/use-toast";

export interface TestRun {
  id: string;
  title: string;
  timestamp: Date;
  testCases: GeneratedTestCase[];
  status: "completed" | "in-progress";
}

interface DiscoverViewProps {
  onApproveTestCases?: (approvedCases: GeneratedTestCase[]) => void;
}

const DiscoverView = ({ onApproveTestCases }: DiscoverViewProps) => {
  const { toast } = useToast();
  const [consoleMessages, setConsoleMessages] = useState([
    { time: "10:23:45", message: "Ready to analyze inputs..." },
  ]);
  
  // State for each input source
  const [prdFiles, setPrdFiles] = useState<File[]>([]);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [prUrls, setPrUrls] = useState("");
  const [confluenceUrl, setConfluenceUrl] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [jiraIds, setJiraIds] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [currentRunTitle, setCurrentRunTitle] = useState("Review Generated Test Cases");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPrdFiles(Array.from(e.target.files));
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    const timestamp = new Date().toLocaleTimeString();
    
    setConsoleMessages(prev => [
      ...prev,
      { time: timestamp, message: "Starting analysis..." },
    ]);

    // Simulate AI analysis
    setTimeout(() => {
      const mockTestCases: GeneratedTestCase[] = generateMockTestCases();
      const runId = `run-${Date.now()}`;
      const newRun: TestRun = {
        id: runId,
        title: `Test Run ${testRuns.length + 1}`,
        timestamp: new Date(),
        testCases: mockTestCases,
        status: "completed",
      };
      
      setTestRuns(prev => [newRun, ...prev]);
      setGeneratedTestCases(mockTestCases);
      setSelectedRunId(runId);
      setCurrentRunTitle(newRun.title);
      setIsAnalyzing(false);
      setConsoleMessages(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: `Analysis complete. Generated ${mockTestCases.length} test cases.` },
      ]);
      setReviewModalOpen(true);
    }, 2000);
  };

  const generateMockTestCases = (): GeneratedTestCase[] => {
    const sources = [];
    if (prdFiles.length > 0) sources.push("PRD");
    if (figmaUrl) sources.push("Figma");
    if (fromBranch && toBranch) sources.push("Branch Diff");
    if (prUrls) sources.push("Pull Request");
    if (confluenceUrl) sources.push("Confluence");
    if (notionUrl) sources.push("Notion");
    if (jiraIds) sources.push("Jira");

    const source = sources.length > 0 ? sources.join(", ") : "Generated";

    return [
      {
        id: "tc-1",
        title: "Verify user login with valid credentials",
        description: "Test that users can successfully log in with correct email and password",
        steps: [
          "Navigate to the login page",
          "Enter valid email address",
          "Enter correct password",
          "Click 'Login' button",
        ],
        expectedResult: "User should be successfully logged in and redirected to dashboard",
        priority: "high",
        tags: ["authentication", "critical", "smoke-test"],
        category: "Authentication Tests",
        source,
        selected: true,
      },
      {
        id: "tc-2",
        title: "Validate error message for invalid login",
        description: "Ensure proper error handling when user enters incorrect credentials",
        steps: [
          "Navigate to the login page",
          "Enter invalid email or password",
          "Click 'Login' button",
        ],
        expectedResult: "Error message 'Invalid credentials' should be displayed",
        priority: "high",
        tags: ["authentication", "error-handling"],
        category: "Authentication Tests",
        source,
        selected: true,
      },
      {
        id: "tc-3",
        title: "Test password reset functionality",
        description: "Verify that users can request and complete password reset",
        steps: [
          "Click 'Forgot Password' link",
          "Enter registered email address",
          "Submit the form",
          "Check email for reset link",
          "Click reset link and enter new password",
        ],
        expectedResult: "Password should be successfully reset and user can login with new password",
        priority: "medium",
        tags: ["authentication", "user-management"],
        category: "Authentication Tests",
        source,
        selected: true,
      },
      {
        id: "tc-4",
        title: "Verify responsive design on mobile devices",
        description: "Test that the application renders correctly on various mobile screen sizes",
        steps: [
          "Open application on mobile device or emulator",
          "Navigate through different pages",
          "Test interactive elements (buttons, forms, menus)",
          "Verify images and content scaling",
        ],
        expectedResult: "All elements should be properly sized and accessible on mobile screens",
        priority: "medium",
        tags: ["ui", "responsive", "mobile"],
        category: "UI/UX Tests",
        source,
        selected: true,
      },
      {
        id: "tc-5",
        title: "Test file upload with various formats",
        description: "Ensure file upload accepts valid formats and rejects invalid ones",
        steps: [
          "Navigate to file upload section",
          "Attempt to upload PDF file",
          "Attempt to upload image file (PNG, JPG)",
          "Attempt to upload unsupported format",
        ],
        expectedResult: "Valid files should upload successfully, invalid files should show error message",
        priority: "low",
        tags: ["file-upload", "validation"],
        category: "File Management Tests",
        source,
        selected: true,
      },
      {
        id: "tc-6",
        title: "Verify data persistence after page refresh",
        description: "Test that form data and user state persist after browser refresh",
        steps: [
          "Fill out a form partially",
          "Refresh the browser page",
          "Check if filled data is still present",
        ],
        expectedResult: "Form data should persist or user should be warned before losing data",
        priority: "low",
        tags: ["data-persistence", "ux"],
        category: "Data Management Tests",
        source,
        selected: false,
      },
      {
        id: "tc-7",
        title: "Test search functionality with special characters",
        description: "Verify search handles special characters and edge cases correctly",
        steps: [
          "Navigate to search bar",
          "Enter search query with special characters (@, #, $, etc.)",
          "Submit the search",
          "Verify results are properly filtered",
        ],
        expectedResult: "Search should handle special characters without errors and return relevant results",
        priority: "medium",
        tags: ["search", "edge-cases", "validation"],
        category: "Search Tests",
        source,
        selected: true,
      },
      {
        id: "tc-8",
        title: "Validate API rate limiting",
        description: "Ensure API properly throttles excessive requests",
        steps: [
          "Send multiple API requests in rapid succession",
          "Monitor response status codes",
          "Verify rate limit headers are present",
          "Wait for rate limit window to reset",
        ],
        expectedResult: "API should return 429 status code when rate limit is exceeded with appropriate headers",
        priority: "high",
        tags: ["api", "security", "performance"],
        category: "API Tests",
        source,
        selected: false,
      },
      {
        id: "tc-9",
        title: "Test dark mode toggle functionality",
        description: "Verify theme switching works correctly and persists",
        steps: [
          "Locate theme toggle button",
          "Click to switch to dark mode",
          "Verify all UI elements adapt to dark theme",
          "Refresh the page",
          "Confirm dark mode preference is saved",
        ],
        expectedResult: "Dark mode should apply consistently across all pages and persist after refresh",
        priority: "low",
        tags: ["ui", "theming", "accessibility"],
        category: "UI/UX Tests",
        source,
        selected: false,
      },
      {
        id: "tc-10",
        title: "Verify email notification delivery",
        description: "Test that email notifications are sent and received correctly",
        steps: [
          "Trigger an action that sends email notification",
          "Check email inbox within 2 minutes",
          "Verify email subject and content",
          "Test links within the email",
        ],
        expectedResult: "Email should be received with correct content and working links",
        priority: "medium",
        tags: ["email", "notifications", "integration"],
        category: "Integration Tests",
        source,
        selected: true,
      },
      {
        id: "tc-11",
        title: "Test multi-language support",
        description: "Verify application supports multiple languages correctly",
        category: "Localization Tests",
        steps: [
          "Change language setting to Spanish",
          "Navigate through different pages",
          "Verify all text is translated",
          "Test form validation messages in Spanish",
        ],
        expectedResult: "All UI text should be properly translated without layout issues",
        priority: "low",
        tags: ["i18n", "localization", "ui"],
        source,
        selected: false,
      },
      {
        id: "tc-12",
        title: "Validate payment processing workflow",
        description: "Test end-to-end payment flow with test credit card",
        steps: [
          "Add items to cart",
          "Proceed to checkout",
          "Enter test credit card details",
          "Submit payment",
          "Verify order confirmation",
        ],
        expectedResult: "Payment should process successfully and order confirmation should be displayed",
        priority: "high",
        category: "E-Commerce Flow",
        tags: ["payment", "critical", "e-commerce"],
        source,
        selected: true,
      },
    ];
  };

  const handleApproveTestCases = (approvedCases: GeneratedTestCase[]) => {
    if (onApproveTestCases) {
      onApproveTestCases(approvedCases);
    }
    
    toast({
      title: "Test cases approved",
      description: `Successfully added ${approvedCases.length} test case${approvedCases.length !== 1 ? 's' : ''} to your suite`,
    });
    
    setConsoleMessages(prev => [
      ...prev,
      { 
        time: new Date().toLocaleTimeString(), 
        message: `Added ${approvedCases.length} approved test cases to the suite.` 
      },
    ]);
  };

  const handleRegenerateTestCases = () => {
    setReviewModalOpen(false);
    setTimeout(() => handleAnalyze(), 100);
  };

  const handleRunTitleChange = (newTitle: string) => {
    setCurrentRunTitle(newTitle);
    if (selectedRunId) {
      setTestRuns(prev => prev.map(run => 
        run.id === selectedRunId ? { ...run, title: newTitle } : run
      ));
    }
  };

  const handleSelectRun = (runId: string) => {
    const run = testRuns.find(r => r.id === runId);
    if (run) {
      setSelectedRunId(runId);
      setGeneratedTestCases(run.testCases);
      setCurrentRunTitle(run.title);
      setReviewModalOpen(true);
    }
  };

  const handleSaveTestCases = (updatedTestCases: GeneratedTestCase[]) => {
    if (selectedRunId) {
      setTestRuns(prev => prev.map(run => 
        run.id === selectedRunId ? { ...run, testCases: updatedTestCases } : run
      ));
      setGeneratedTestCases(updatedTestCases);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Left Sidebar - Run History */}
      {testRuns.length > 0 && (
        <div className="w-80 border-r border-border bg-card/50 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-lg">Test Run History</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {testRuns.length} run{testRuns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {testRuns.map((run) => (
                <Card 
                  key={run.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedRunId === run.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectRun(run.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Play className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{run.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {run.timestamp.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {run.testCases.length} cases
                          </Badge>
                          <Badge 
                            variant={run.status === "completed" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {run.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Discover Test Cases</h2>
              <p className="text-muted-foreground">
                Provide context from multiple sources to automatically identify test scenarios
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* PRD Documents Card */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">PRD Documents</CardTitle>
                      <CardDescription>Upload product requirement docs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="prd-upload"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="prd-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Drop files or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, DOC, TXT, MD</p>
                      </div>
                    </label>
                  </div>
                  {prdFiles.length > 0 && (
                    <div className="space-y-2">
                      {prdFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm bg-secondary/50 p-2 rounded">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Figma Card */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Figma className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Figma Design</CardTitle>
                      <CardDescription>Link to design specs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="https://figma.com/file/..."
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Paste your Figma file or prototype URL
                  </p>
                </CardContent>
              </Card>

              {/* Git Branch Comparison Card */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GitBranch className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Branch Comparison</CardTitle>
                      <CardDescription>Compare changes between branches</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">From Branch</Label>
                    <Input
                      placeholder="main"
                      value={fromBranch}
                      onChange={(e) => setFromBranch(e.target.value)}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To Branch</Label>
                    <Input
                      placeholder="feature/new-feature"
                      value={toBranch}
                      onChange={(e) => setToBranch(e.target.value)}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pull Requests Card */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GitBranch className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Pull Requests</CardTitle>
                      <CardDescription>List of PR URLs to analyze</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="https://github.com/org/repo/pull/123&#10;https://github.com/org/repo/pull/124"
                    value={prUrls}
                    onChange={(e) => setPrUrls(e.target.value)}
                    className="bg-secondary border-border min-h-[100px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    One URL per line
                  </p>
                </CardContent>
              </Card>

              {/* Confluence Card */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Link className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Confluence</CardTitle>
                      <CardDescription>Link to Confluence pages</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="https://your-domain.atlassian.net/wiki/..."
                    value={confluenceUrl}
                    onChange={(e) => setConfluenceUrl(e.target.value)}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Documentation and requirements pages
                  </p>
                </CardContent>
              </Card>

              {/* Notion Card */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Link className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Notion</CardTitle>
                      <CardDescription>Link to Notion pages</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="https://notion.so/..."
                    value={notionUrl}
                    onChange={(e) => setNotionUrl(e.target.value)}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Product specs and documentation
                  </p>
                </CardContent>
              </Card>

              {/* Jira Card */}
              <Card className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Jira Tickets</CardTitle>
                      <CardDescription>Ticket IDs or URLs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="PROJ-123, PROJ-124&#10;or&#10;https://your-domain.atlassian.net/browse/PROJ-123"
                    value={jiraIds}
                    onChange={(e) => setJiraIds(e.target.value)}
                    className="bg-secondary border-border min-h-[100px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Comma-separated IDs or one URL per line
                  </p>
                </CardContent>
              </Card>

              {/* Empty slot for visual balance */}
              <Card className="border-border bg-card border-dashed opacity-50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-muted-foreground">More sources coming soon</CardTitle>
                      <CardDescription>Additional integrations in development</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <FileText className="h-5 w-5 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Analyze & Generate Test Cases"}
              </Button>
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

      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        testCases={generatedTestCases}
        onApprove={handleApproveTestCases}
        onRegenerate={handleRegenerateTestCases}
        runTitle={currentRunTitle}
        onTitleChange={handleRunTitleChange}
        onSaveTestCases={handleSaveTestCases}
      />
    </div>
    </div>
  );
};

export default DiscoverView;
