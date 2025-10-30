import { FileText, FileCode2, ChevronDown, ChevronRight, Pencil, Check, X, GitBranch, Sparkles } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

interface Script {
  id: string;
  name: string;
  language: string;
}

interface TestCase {
  id: string;
  title: string;
  status: "pending" | "passed" | "failed";
  priority?: "High" | "Medium" | "Low";
  category: string;
  steps?: string[];
  scripts?: Script[];
  isNew?: boolean;
}

interface UnifiedTestCasesListProps {
  testCases: TestCase[];
  selectedTestCaseId: string | null;
  selectedScriptId: string | null;
  onSelectTestCase: (id: string) => void;
  onSelectScript: (scriptId: string, testCaseId: string) => void;
  onGenerateScript?: (testCaseId: string, scriptType: "playwright" | "selenium") => void;
  onUpdateTestCaseName?: (id: string, newTitle: string) => void;
  onUpdateCategoryName?: (oldName: string, newName: string) => void;
  currentBranch?: string;
}

const UnifiedTestCasesList = ({ 
  testCases, 
  selectedTestCaseId, 
  selectedScriptId,
  onSelectTestCase, 
  onSelectScript,
  onGenerateScript,
  onUpdateTestCaseName,
  onUpdateCategoryName,
  currentBranch = "main"
}: UnifiedTestCasesListProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Authentication Tests"])
  );
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(
    new Set(["tc1"])
  );
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");

  const categories = Array.from(new Set(testCases.map(tc => tc.category)));
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleTestCase = (testCaseId: string) => {
    setExpandedTestCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId);
      } else {
        newSet.add(testCaseId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High": return "text-[hsl(var(--priority-high))]";
      case "Medium": return "text-[hsl(var(--priority-medium))]";
      case "Low": return "text-[hsl(var(--priority-low))]";
      default: return "text-muted-foreground";
    }
  };

  const handleStartEdit = (testCase: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTestCaseId(testCase.id);
    setEditingTitle(testCase.title);
  };

  const handleSaveEdit = (testCaseId: string) => {
    if (editingTitle.trim() && onUpdateTestCaseName) {
      onUpdateTestCaseName(testCaseId, editingTitle.trim());
    }
    setEditingTestCaseId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingTestCaseId(null);
    setEditingTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, testCaseId: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(testCaseId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleStartEditCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setEditingCategoryName(category);
  };

  const handleSaveEditCategory = (oldName: string) => {
    if (editingCategoryName.trim() && onUpdateCategoryName) {
      onUpdateCategoryName(oldName, editingCategoryName.trim());
    }
    setEditingCategory(null);
    setEditingCategoryName("");
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryName("");
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, category: string) => {
    if (e.key === "Enter") {
      handleSaveEditCategory(category);
    } else if (e.key === "Escape") {
      handleCancelEditCategory();
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Test Cases</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            <span>{currentBranch}</span>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-2">
          {categories.map((category) => {
            const categoryTests = testCases.filter(tc => tc.category === category);
            const isCategoryExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="mb-1 group">
                <div className="w-full text-left px-2 py-1.5 rounded-md hover:bg-secondary/50 flex items-center gap-2 text-sm">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    {isCategoryExpanded ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                    <FileText className="h-4 w-4 flex-shrink-0" />
                  </button>
                  {editingCategory === category ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => handleCategoryKeyDown(e, category)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm px-1 py-0.5 bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditCategory(category)}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </button>
                      <button
                        onClick={handleCancelEditCategory}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span 
                        onClick={() => toggleCategory(category)}
                        onDoubleClick={(e) => handleStartEditCategory(category, e)}
                        className="truncate flex-1 cursor-pointer"
                      >
                        {category}
                      </span>
                      <button
                        onClick={(e) => handleStartEditCategory(category, e)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-opacity"
                        title="Edit category name"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
                
                {isCategoryExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {categoryTests.map((testCase) => {
                      const isTestCaseExpanded = expandedTestCases.has(testCase.id);
                      const hasScripts = testCase.scripts && testCase.scripts.length > 0;
                      
                      return (
                        <div key={testCase.id} className="group">
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <div className="flex items-center gap-1" onClick={() => onSelectTestCase(testCase.id)}>
                                {hasScripts && (
                                  <button
                                    onClick={() => toggleTestCase(testCase.id)}
                                    className="p-1 hover:bg-secondary/50 rounded"
                                  >
                                    {isTestCaseExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                                    )}
                                  </button>
                                )}
                                <div
                                  onClick={() => onSelectTestCase(testCase.id)}
                                  role="button"
                                  tabIndex={0}
                                  className={`flex-1 px-3 py-2 rounded-md flex items-center gap-2 transition-colors cursor-pointer ${
                                    selectedTestCaseId === testCase.id
                                      ? "bg-primary/10 text-primary border border-primary/30"
                                      : "hover:bg-secondary/50 text-foreground"
                                  } ${!hasScripts ? "ml-6" : ""}`}
                                 >
                                   <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                   {testCase.isNew && (
                                     <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                       <Sparkles className="h-3 w-3" />
                                       New
                                     </span>
                                   )}
                                   {editingTestCaseId === testCase.id ? (
                                    <div className="flex-1 flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, testCase.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 text-xs px-1 py-0.5 bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveEdit(testCase.id)}
                                        className="p-1 hover:bg-secondary rounded"
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-1 hover:bg-secondary rounded"
                                      >
                                        <X className="h-3 w-3 text-destructive" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span 
                                        onClick={() => onSelectTestCase(testCase.id)}
                                        onDoubleClick={(e) => handleStartEdit(testCase, e)}
                                        className="text-xs truncate flex-1 cursor-pointer"
                                      >
                                        {testCase.title}
                                      </span>
                                      <button
                                        onClick={(e) => handleStartEdit(testCase, e)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-opacity"
                                        title="Edit name"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      {testCase.priority && (
                                        <span className={`text-xs font-medium ${getPriorityColor(testCase.priority)}`}>
                                          {testCase.priority}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-56 bg-popover border-border">
                              <ContextMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(testCase, e as any);
                                }}
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit Name
                              </ContextMenuItem>
                              <ContextMenuItem 
                                onClick={() => onGenerateScript?.(testCase.id, "playwright")}
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              >
                                Generate Playwright Script
                              </ContextMenuItem>
                              <ContextMenuItem 
                                onClick={() => onGenerateScript?.(testCase.id, "selenium")}
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              >
                                Generate Selenium Script
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                          
                          {/* Scripts under test case */}
                          {hasScripts && isTestCaseExpanded && (
                            <div className="ml-10 mt-1 space-y-1">
                              {testCase.scripts!.map((script) => (
                                <button
                                  key={script.id}
                                  onClick={() => onSelectScript(script.id, testCase.id)}
                                  className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                                    selectedScriptId === script.id
                                      ? "bg-accent/10 text-accent border border-accent/30"
                                      : "hover:bg-secondary/50 text-foreground"
                                  }`}
                                >
                                  <FileCode2 className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs truncate">{script.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UnifiedTestCasesList;