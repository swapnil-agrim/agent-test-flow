import { FileText, ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

interface TestCase {
  id: string;
  title: string;
  status: "pending" | "passed" | "failed";
  priority?: "High" | "Medium" | "Low";
  category: string;
  steps?: string[];
}

interface ManualTestCasesListProps {
  testCases: TestCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onGenerateScript?: (testCaseId: string, scriptType: "playwright" | "selenium") => void;
}

const ManualTestCasesList = ({ testCases, selectedId, onSelect, onGenerateScript }: ManualTestCasesListProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Authentication Tests"])
  );

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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High": return "text-[hsl(var(--priority-high))]";
      case "Medium": return "text-[hsl(var(--priority-medium))]";
      case "Low": return "text-[hsl(var(--priority-low))]";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Test Cases</h2>
      </div>
      
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-2">
          {categories.map((category) => {
            const categoryTests = testCases.filter(tc => tc.category === category);
            const isExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="mb-1">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-secondary/50 flex items-center gap-2 text-sm"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{category}</span>
                </button>
                
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {categoryTests.map((testCase) => (
                      <ContextMenu key={testCase.id}>
                        <ContextMenuTrigger asChild>
                          <button
                            onClick={() => onSelect(testCase.id)}
                            className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                              selectedId === testCase.id
                                ? "bg-primary/10 text-primary border border-primary/30"
                                : "hover:bg-secondary/50 text-foreground"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs truncate flex-1">{testCase.title}</span>
                            {testCase.priority && (
                              <span className={`text-xs font-medium ${getPriorityColor(testCase.priority)}`}>
                                {testCase.priority}
                              </span>
                            )}
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-56 bg-popover border-border">
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
                    ))}
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

export default ManualTestCasesList;
