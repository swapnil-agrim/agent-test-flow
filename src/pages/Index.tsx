import { useState, useEffect } from "react";
import Header from "@/components/Header";
import UnifiedTestCasesList from "@/components/UnifiedTestCasesList";
import ChatInterface from "@/components/ChatInterface";
import ScriptEditor from "@/components/ScriptEditor";
import ImportView from "@/components/ImportView";
import DiscoverView from "@/components/DiscoverView";
import Console from "@/components/Console";
import TestCaseDetail from "@/components/TestCaseDetail";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface TestCase {
  id: string;
  title: string;
  status: "pending" | "passed" | "failed";
  priority: "High" | "Medium" | "Low";
  category: string;
  isNew?: boolean;
  steps: string[];
  scripts: { id: string; name: string; language: string }[];
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("test-cases");
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [generatingScriptType, setGeneratingScriptType] = useState<"playwright" | "selenium" | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { 
      id: "tc1", 
      title: "TC001: Valid Login", 
      status: "pending" as const, 
      priority: "High" as const, 
      category: "Authentication Tests",
      isNew: false,
      steps: [
        "Navigate to login page",
        "Enter valid username",
        "Enter valid password",
        "Click login button",
        "Verify successful login and redirection to dashboard"
      ],
      scripts: [
        { id: "s1", name: "login.spec.ts", language: "TypeScript" },
      ]
    },
    { 
      id: "tc2", 
      title: "TC002: Invalid Password", 
      status: "passed" as const, 
      priority: "High" as const, 
      category: "Authentication Tests",
      isNew: false,
      steps: [
        "Navigate to login page",
        "Enter valid username",
        "Enter invalid password",
        "Click login button",
        "Verify error message is displayed",
        "Verify user remains on login page"
      ],
      scripts: [
        { id: "s2", name: "invalid-password.spec.ts", language: "TypeScript" },
      ]
    },
    { 
      id: "tc3", 
      title: "TC003: Forgot Password Flow", 
      status: "failed" as const, 
      priority: "Medium" as const, 
      category: "Authentication Tests",
      isNew: false,
      steps: [
        "Navigate to login page",
        "Click 'Forgot Password' link",
        "Enter registered email address",
        "Click submit button",
        "Verify confirmation message",
        "Check email for password reset link"
      ],
      scripts: [
        { id: "s3", name: "forgot-password.spec.ts", language: "TypeScript" },
      ]
    },
    { 
      id: "tc4", 
      title: "TC004: Update Profile", 
      status: "pending" as const, 
      priority: "Medium" as const, 
      category: "User Profile Tests",
      isNew: false,
      steps: [
        "Login to application",
        "Navigate to profile page",
        "Click edit profile button",
        "Update name and bio fields",
        "Click save button",
        "Verify success message",
        "Verify updated information is displayed"
      ],
      scripts: [
        { id: "s4", name: "profile.spec.ts", language: "TypeScript" },
      ]
    },
    { 
      id: "tc5", 
      title: "TC005: Add to Cart", 
      status: "pending" as const, 
      priority: "High" as const, 
      category: "E-Commerce Flow",
      isNew: false,
      steps: [
        "Navigate to product catalog",
        "Search for desired product",
        "Click on product to view details",
        "Select size and quantity",
        "Click 'Add to Cart' button",
        "Verify item appears in cart",
        "Verify cart count is updated"
      ],
      scripts: [
        { id: "s5", name: "cart.spec.ts", language: "TypeScript" },
      ]
    },
    { 
      id: "tc6", 
      title: "TC006: Checkout Process", 
      status: "pending" as const, 
      priority: "High" as const, 
      category: "E-Commerce Flow",
      isNew: false,
      steps: [
        "Add items to cart",
        "Navigate to cart page",
        "Click 'Proceed to Checkout' button",
        "Enter shipping address",
        "Select shipping method",
        "Enter payment information",
        "Review order summary",
        "Click 'Place Order' button",
        "Verify order confirmation page",
        "Verify order confirmation email"
      ],
      scripts: [
        { id: "s6", name: "checkout.spec.ts", language: "TypeScript" },
      ]
    },
  ]);

  const handleTestCaseSelect = (id: string) => {
    setSelectedTestCase(id);
    setSelectedScript(null);
  };

  const handleScriptSelect = (scriptId: string, testCaseId: string) => {
    setSelectedScript(scriptId);
    setSelectedTestCase(testCaseId);
    setGeneratingScriptType(null);
  };

  const handleGenerateScript = (testCaseId: string, scriptType: "playwright" | "selenium") => {
    setSelectedTestCase(testCaseId);
    setSelectedScript(null);
    setGeneratingScriptType(scriptType);
  };

  const handleUpdateTestCaseName = (id: string, newTitle: string) => {
    setTestCases(prev => 
      prev.map(tc => tc.id === id ? { ...tc, title: newTitle } : tc)
    );
  };

  const handleUpdateCategoryName = (oldName: string, newName: string) => {
    setTestCases(prev => 
      prev.map(tc => tc.category === oldName ? { ...tc, category: newName } : tc)
    );
  };

  const handleUpdateTestCase = (id: string, updates: any) => {
    setTestCases(prev => 
      prev.map(tc => tc.id === id ? { ...tc, ...updates } : tc)
    );
  };

  const handleApproveGeneratedTestCases = (approvedCases: any[]) => {
    const newTestCases = approvedCases.map((tc, index) => ({
      id: `tc-gen-${Date.now()}-${index}`,
      title: tc.title,
      status: "pending" as const,
      priority: tc.priority === "high" ? "High" as const : 
                tc.priority === "medium" ? "Medium" as const : "Low" as const,
      category: tc.category,
      isNew: true,
      steps: tc.steps,
      scripts: []
    }));
    
    setTestCases(prev => [...prev, ...newTestCases]);
    setActiveTab("test-cases");
  };

  const selectedTestCaseData = testCases.find((tc) => tc.id === selectedTestCase);
  const selectedScriptData = selectedTestCaseData?.scripts?.find((s) => s.id === selectedScript);

  return (
    <div className="h-screen flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "setup" ? (
        <ImportView />
      ) : activeTab === "discover" ? (
        <DiscoverView onApproveTestCases={handleApproveGeneratedTestCases} />
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* Left Panel - Unified Test Cases with Scripts (Resizable) */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <UnifiedTestCasesList
              testCases={testCases}
              selectedTestCaseId={selectedTestCase}
              selectedScriptId={selectedScript}
              onSelectTestCase={handleTestCaseSelect}
              onSelectScript={handleScriptSelect}
              onGenerateScript={handleGenerateScript}
              onUpdateTestCaseName={handleUpdateTestCaseName}
              onUpdateCategoryName={handleUpdateCategoryName}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Chat, Editor, or Console */}
          <ResizablePanel defaultSize={80} minSize={65}>
            {selectedTestCase && selectedTestCaseData && !selectedScript && !generatingScriptType ? (
              <TestCaseDetail
                testCase={selectedTestCaseData}
                onUpdate={handleUpdateTestCase}
                onGenerate={handleGenerateScript}
              />
            ) : selectedScript && selectedScriptData ? (
              <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Left: Script Editor + Console */}
                <ResizablePanel defaultSize={70} minSize={30}>
                  <ResizablePanelGroup direction="vertical">
                    {/* Script Editor */}
                    <ResizablePanel defaultSize={70} minSize={40}>
                      <ScriptEditor
                        scriptId={selectedScript}
                        scriptName={selectedScriptData.name}
                      />
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle />
                    
                    {/* Console (Resizable) */}
                    <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
                      <Console />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                {/* Right: Chat Interface (Resizable) */}
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <ChatInterface
                    testCaseId={selectedScript}
                    testCaseTitle={selectedScriptData.name}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : generatingScriptType && selectedTestCaseData ? (
              <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Middle: Browser Preview + Console */}
                <ResizablePanel defaultSize={60} minSize={40}>
                  <ResizablePanelGroup direction="vertical">
                    {/* Browser Preview Placeholder */}
                    <ResizablePanel defaultSize={70} minSize={40}>
                      <div className="h-full flex items-center justify-center bg-muted/30 border-b border-border">
                        <div className="text-center text-muted-foreground">
                          <p className="text-lg font-medium">Browser Preview</p>
                          <p className="text-sm mt-2">Preview area for test execution</p>
                        </div>
                      </div>
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle />
                    
                    {/* Console */}
                    <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
                      <Console />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                {/* Right: Chat Interface */}
                <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
                  <ChatInterface
                    testCaseId={selectedTestCase}
                    testCaseTitle={selectedTestCaseData.title}
                    testCaseSteps={selectedTestCaseData.steps}
                    scriptType={generatingScriptType}
                    onBack={() => setGeneratingScriptType(null)}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg">Select a test case to generate script</p>
                  <p className="text-sm mt-2">
                    Choose a manual test case to generate scripts or view existing Playwright scripts
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default Index;
