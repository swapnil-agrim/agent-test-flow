import { ScrollArea } from "./ui/scroll-area";
import { Terminal, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface ConsoleProps {
  logs?: Array<{ timestamp: string; message: string; type?: "info" | "error" | "success" }>;
}

const Console = ({ logs = [] }: ConsoleProps) => {
  const defaultLogs = logs.length > 0 ? logs : [
    { timestamp: "10:24:12", message: "Loading test cases...", type: "info" as const },
    { timestamp: "10:24:13", message: "Loaded 8 test cases from 3 suites", type: "success" as const },
  ];

  const getLogColor = (type?: string) => {
    switch (type) {
      case "error": return "text-[hsl(var(--destructive))]";
      case "success": return "text-[hsl(var(--priority-low))]";
      default: return "text-foreground/80";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--console-bg))] border-t border-border">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Console</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-4 space-y-1 font-mono text-xs">
          {defaultLogs.map((log, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-muted-foreground">{log.timestamp}</span>
              <span className={getLogColor(log.type)}>{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Console;
