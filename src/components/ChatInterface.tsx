import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User as UserIcon, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  testCaseId: string;
  testCaseTitle: string;
  testCaseSteps?: string[];
  scriptType?: "playwright" | "selenium";
  onBack?: () => void;
}

const ChatInterface = ({ testCaseId, testCaseTitle, testCaseSteps, scriptType, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScriptType = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show test steps on test case click
  useEffect(() => {
    if (testCaseSteps && testCaseSteps.length > 0 && !scriptType) {
      const stepsText = testCaseSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n');
      const stepsMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `**Test Case Steps for "${testCaseTitle}":**\n\n${stepsText}\n\nRight-click on this test case to generate a Playwright or Selenium script.`,
        timestamp: new Date(),
      };
      setMessages([stepsMessage]);
    }
  }, [testCaseId]);

  // Start script generation only when scriptType changes from undefined to a value
  useEffect(() => {
    if (scriptType && prevScriptType.current === undefined && testCaseSteps && testCaseSteps.length > 0) {
      startScriptGeneration();
    }
    prevScriptType.current = scriptType;
  }, [scriptType]);

  const startScriptGeneration = () => {
    const scriptTypeLabel = scriptType === "selenium" ? "Selenium" : "Playwright";
    const stepsText = testCaseSteps?.map((step, idx) => `${idx + 1}. ${step}`).join('\n') || '';
    
    // User's initial request
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Generate a ${scriptTypeLabel} script for "${testCaseTitle}"`,
      timestamp: new Date(),
    };
    
    setMessages([userMessage]);
    setIsGenerating(true);

    // First agent response - acknowledging
    setTimeout(() => {
      const ackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'll help you generate a ${scriptTypeLabel} script for "${testCaseTitle}". Let me analyze the test steps...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, ackMessage]);
    }, 800);

    // Second response - showing steps analysis
    setTimeout(() => {
      const analysisMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `**Test Case Steps:**\n\n${stepsText}\n\nAnalyzing the test flow and identifying key actions...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, analysisMessage]);
    }, 2000);

    // Third response - generating Gherkin plan
    setTimeout(() => {
      const gherkinPlan = generateGherkinPlan(testCaseTitle, testCaseSteps || [], scriptTypeLabel);
      const planMessage: Message = {
        id: (Date.now() + 3).toString(),
        role: "assistant",
        content: gherkinPlan,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, planMessage]);
      setIsGenerating(false);
    }, 3500);
  };

  const generateGherkinPlan = (title: string, steps: string[], scriptType: string) => {
    const featureName = title.replace(/^(TC-\d+:\s*)?/, '');
    
    return `I've created a Gherkin plan for your ${scriptType} script:\n\n**Feature:** ${featureName}\n\n**Scenario:** ${featureName}\n  Given the application is ready\n${steps.map((step, idx) => {
      if (step.toLowerCase().includes('navigate') || step.toLowerCase().includes('open')) {
        return `  When ${step.toLowerCase()}`;
      } else if (step.toLowerCase().includes('verify') || step.toLowerCase().includes('check') || step.toLowerCase().includes('should')) {
        return `  Then ${step.toLowerCase()}`;
      } else if (step.toLowerCase().includes('enter') || step.toLowerCase().includes('click') || step.toLowerCase().includes('select')) {
        return `  And ${step.toLowerCase()}`;
      } else {
        return `  And ${step.toLowerCase()}`;
      }
    }).join('\n')}\n\n**Would you like me to proceed with generating the ${scriptType} script based on this plan?**\n\nReply with "yes" to approve or provide feedback to refine the plan.`;
  };

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    // Simulate AI response with Gherkin plan generation
    setTimeout(() => {
      const scriptTypeLabel = scriptType === "selenium" ? "Selenium" : "Playwright";
      const gherkinPlan = `I've analyzed the test case and created a Gherkin plan for the ${scriptTypeLabel} script:\n\n**Feature**: ${testCaseTitle}\n\n**Scenario**: Execute test case\n  Given the user is on the application\n  When the user performs the test steps\n  Then the expected results should be verified\n\n**Detailed Steps**:\n${testCaseSteps?.map((step, idx) => `  ${idx + 1}. ${step}`).join('\n') || 'No steps provided'}\n\nWould you like me to proceed with generating the ${scriptTypeLabel} script based on this plan?`;
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: gherkinPlan,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--editor-bg))]">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {scriptType && onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h3 className="font-semibold">{testCaseTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate Playwright script with AI assistance
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4 scrollbar-thin" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[hsl(var(--chat-bubble-user))] text-white"
                    : "bg-[hsl(var(--chat-bubble-assistant))] text-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-[hsl(var(--chat-bubble-assistant))] rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to test..."
            className="flex-1 bg-secondary border-border"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
