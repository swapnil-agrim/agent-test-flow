import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Pencil, Save, Undo, Redo, X, Check, Sparkles } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useToast } from "@/hooks/use-toast";

interface TestCase {
  id: string;
  title: string;
  status: "pending" | "passed" | "failed";
  priority?: "High" | "Medium" | "Low";
  category: string;
  description?: string;
  steps?: string[];
  expectedResult?: string;
  tags?: string[];
}

interface TestCaseDetailProps {
  testCase: TestCase;
  onUpdate: (id: string, updates: Partial<TestCase>) => void;
  onGenerate?: (testCaseId: string, scriptType: "playwright" | "selenium") => void;
}

const TestCaseDetail = ({ testCase, onUpdate, onGenerate }: TestCaseDetailProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTestCase, setEditedTestCase] = useState(testCase);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setEditedTestCase(testCase);
    setIsEditing(false);
  }, [testCase]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
    }
  };

  const handleSave = () => {
    // Get steps from editor
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      const steps = content.split('\n').filter((line: string) => line.trim() !== '');
      
      const updates = {
        ...editedTestCase,
        steps,
      };
      
      onUpdate(testCase.id, updates);
      setIsEditing(false);
      toast({
        title: "Test case updated",
        description: "Your changes have been saved successfully",
      });
    }
  };

  const handleCancel = () => {
    setEditedTestCase(testCase);
    setIsEditing(false);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{testCase.title}</h2>
          {testCase.priority && (
            <Badge variant={getPriorityColor(testCase.priority)}>
              {testCase.priority}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onGenerate?.(testCase.id, "playwright")}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Script
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Test Case
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-6 max-w-4xl">
          {isEditing ? (
            <>
              <div>
                <Label className="text-sm text-muted-foreground">Title</Label>
                <Input
                  value={editedTestCase.title}
                  onChange={(e) =>
                    setEditedTestCase({ ...editedTestCase, title: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <Textarea
                  value={editedTestCase.description || ""}
                  onChange={(e) =>
                    setEditedTestCase({ ...editedTestCase, description: e.target.value })
                  }
                  className="mt-2 min-h-[100px]"
                  placeholder="Add a description for this test case..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm text-muted-foreground">
                    Test Steps (one per line)
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUndo}
                      className="h-7 px-2"
                      title="Undo"
                    >
                      <Undo className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRedo}
                      className="h-7 px-2"
                      title="Redo"
                    >
                      <Redo className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    height="300px"
                    defaultLanguage="plaintext"
                    value={(editedTestCase.steps || []).join("\n")}
                    onChange={(value) => {
                      if (value !== undefined) {
                        setEditedTestCase({
                          ...editedTestCase,
                          steps: value.split("\n"),
                        });
                      }
                    }}
                    onMount={handleEditorMount}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      fontSize: 14,
                      fontFamily: 'monospace',
                      padding: { top: 10, bottom: 10 },
                    }}
                    theme="vs-dark"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Expected Result</Label>
                <Textarea
                  value={editedTestCase.expectedResult || ""}
                  onChange={(e) =>
                    setEditedTestCase({
                      ...editedTestCase,
                      expectedResult: e.target.value,
                    })
                  }
                  className="mt-2 min-h-[100px]"
                  placeholder="Describe the expected outcome..."
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Category</Label>
                <Input
                  value={editedTestCase.category}
                  onChange={(e) =>
                    setEditedTestCase({ ...editedTestCase, category: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Priority</Label>
                <div className="flex gap-2 mt-2">
                  {(["High", "Medium", "Low"] as const).map((priority) => (
                    <Button
                      key={priority}
                      variant={editedTestCase.priority === priority ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setEditedTestCase({ ...editedTestCase, priority })
                      }
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {testCase.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed">{testCase.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Test Steps
                </h3>
                <ol className="space-y-3">
                  {(testCase.steps || []).map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="text-primary font-semibold min-w-[32px]">
                        {idx + 1}.
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {testCase.expectedResult && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Expected Result
                  </h3>
                  <p className="text-sm leading-relaxed">{testCase.expectedResult}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Details
                </h3>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>{" "}
                    <span className="font-medium">{testCase.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {testCase.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {testCase.tags && testCase.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {testCase.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TestCaseDetail;
