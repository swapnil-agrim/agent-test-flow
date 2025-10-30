import { Code, FileCode2, ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";

interface Script {
  id: string;
  name: string;
  language: string;
  category: string;
}

interface PlaywrightScriptsListProps {
  scripts: Script[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PlaywrightScriptsList = ({ scripts, selectedId, onSelect }: PlaywrightScriptsListProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Authentication Tests"])
  );

  const categories = Array.from(new Set(scripts.map(s => s.category)));
  
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

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Playwright Scripts</h2>
      </div>
      
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-2">
          {categories.map((category) => {
            const categoryScripts = scripts.filter(s => s.category === category);
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
                  <Code className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{category}</span>
                </button>
                
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {categoryScripts.map((script) => (
                      <button
                        key={script.id}
                        onClick={() => onSelect(script.id)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                          selectedId === script.id
                            ? "bg-accent/10 text-accent border border-accent/30"
                            : "hover:bg-secondary/50 text-foreground"
                        }`}
                      >
                        <FileCode2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate">{script.name}</div>
                        </div>
                      </button>
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

export default PlaywrightScriptsList;
