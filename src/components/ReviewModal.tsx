import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Pencil, Check, Save, Undo, Redo, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { CheckCircle2, XCircle, RefreshCw, ChevronRight } from "lucide-react";
import { Label } from "./ui/label";
import Editor from "@monaco-editor/react";

export interface GeneratedTestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  priority: "low" | "medium" | "high";
  tags: string[];
  category: string;
  source: string;
  selected: boolean;
}

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testCases: GeneratedTestCase[];
  onApprove: (approvedCases: GeneratedTestCase[]) => void;
  onRegenerate: () => void;
  runTitle: string;
  onTitleChange: (title: string) => void;
  onSaveTestCases?: (testCases: GeneratedTestCase[]) => void;
}

const ReviewModal = ({
  open,
  onOpenChange,
  testCases: initialTestCases,
  onApprove,
  onRegenerate,
  runTitle,
  onTitleChange,
  onSaveTestCases,
}: ReviewModalProps) => {
  const { toast } = useToast();
  const [testCases, setTestCases] = useState<GeneratedTestCase[]>(initialTestCases);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(runTitle);
  const editorRef = useRef<any>(null);

  // Sync internal state when testCases prop changes
  useEffect(() => {
    setTestCases(initialTestCases);
  }, [initialTestCases]);

  // Sync title when runTitle changes
  useEffect(() => {
    setTempTitle(runTitle);
  }, [runTitle]);

  const handleSaveTitle = () => {
    onTitleChange(tempTitle);
    setIsEditingTitle(false);
  };

  const handleCancelTitleEdit = () => {
    setTempTitle(runTitle);
    setIsEditingTitle(false);
  };

  const selectedCount = testCases.filter((tc) => tc.selected).length;

  const handleToggleSelect = (id: string) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, selected: !tc.selected } : tc))
    );
  };

  const handleSelectAll = () => {
    setTestCases((prev) => prev.map((tc) => ({ ...tc, selected: true })));
  };

  const handleDeselectAll = () => {
    setTestCases((prev) => prev.map((tc) => ({ ...tc, selected: false })));
  };

  const handleUpdateTestCase = (id: string, updates: Partial<GeneratedTestCase>) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc))
    );
  };

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

  const handleSaveSteps = (testCaseId: string) => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      const steps = content.split('\n').filter((line: string) => line.trim() !== '');
      handleUpdateTestCase(testCaseId, { steps });
    }
    setEditingId(null);
    toast({
      title: "Test case updated",
      description: "All changes have been saved",
    });
  };

  const handleSaveChanges = () => {
    if (onSaveTestCases) {
      onSaveTestCases(testCases);
      toast({
        title: "Changes saved",
        description: "Test cases have been updated successfully",
      });
    }
  };

  const handleApprove = () => {
    const approved = testCases.filter((tc) => tc.selected);
    onApprove(approved);
    onOpenChange(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <>
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-2xl font-semibold h-10"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelTitleEdit();
                  }}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelTitleEdit}>
                  ×
                </Button>
              </>
            ) : (
              <>
                <DialogTitle className="text-2xl">{runTitle}</DialogTitle>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsEditingTitle(true)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <DialogDescription>
            Review, edit, and approve the AI-generated test cases before adding them to your suite
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedCount} of {testCases.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                className="h-8"
              >
                Deselect All
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {onSaveTestCases && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveChanges}
                className="h-8"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="h-8"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <Accordion type="multiple" className="space-y-3">
            {testCases.map((testCase) => (
              <AccordionItem
                key={testCase.id}
                value={testCase.id}
                className="border border-border rounded-lg px-4 bg-card"
              >
                <div className="flex items-center gap-3 py-2">
                  <Checkbox
                    checked={testCase.selected}
                    onCheckedChange={() => handleToggleSelect(testCase.id)}
                  />
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="flex items-center justify-between flex-1 pr-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-left">{testCase.title}</span>
                        <Badge variant={getPriorityColor(testCase.priority)}>
                          {testCase.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {testCase.category}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {testCase.source}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                </div>

                <AccordionContent className="pt-4 pb-4 space-y-4">
                  {editingId === testCase.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <Input
                          value={testCase.title}
                          onChange={(e) =>
                            handleUpdateTestCase(testCase.id, { title: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Textarea
                          value={testCase.description}
                          onChange={(e) =>
                            handleUpdateTestCase(testCase.id, {
                              description: e.target.value,
                            })
                          }
                          className="mt-1 min-h-[80px]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs text-muted-foreground">
                            Steps (one per line)
                          </Label>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleUndo}
                              className="h-6 px-2"
                              title="Undo"
                            >
                              <Undo className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleRedo}
                              className="h-6 px-2"
                              title="Redo"
                            >
                              <Redo className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveSteps(testCase.id)}
                              className="h-6 px-2"
                              title="Save Steps"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                          <Editor
                            height="200px"
                            defaultLanguage="plaintext"
                            value={testCase.steps.join("\n")}
                            onChange={(value) => {
                              if (value !== undefined) {
                                handleUpdateTestCase(testCase.id, {
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
                              fontSize: 13,
                              fontFamily: 'monospace',
                            }}
                            theme="vs-dark"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Expected Result
                        </Label>
                        <Textarea
                          value={testCase.expectedResult}
                          onChange={(e) =>
                            handleUpdateTestCase(testCase.id, {
                              expectedResult: e.target.value,
                            })
                          }
                          className="mt-1 min-h-[80px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Done Editing
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-end mb-2">
                        {editingId === testCase.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveSteps(testCase.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save Changes
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(testCase.id)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Title</div>
                        {editingId === testCase.id ? (
                          <Input
                            value={testCase.title}
                            onChange={(e) =>
                              handleUpdateTestCase(testCase.id, { title: e.target.value })
                            }
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium">{testCase.title}</p>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Description</div>
                        {editingId === testCase.id ? (
                          <Textarea
                            value={testCase.description}
                            onChange={(e) =>
                              handleUpdateTestCase(testCase.id, {
                                description: e.target.value,
                              })
                            }
                            className="text-sm min-h-[80px]"
                          />
                        ) : (
                          <p className="text-sm">{testCase.description}</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-muted-foreground">Steps</div>
                          {editingId === testCase.id && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleUndo}
                                className="h-6 px-2"
                                title="Undo"
                              >
                                <Undo className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleRedo}
                                className="h-6 px-2"
                                title="Redo"
                              >
                                <Redo className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {editingId === testCase.id ? (
                          <div className="border rounded-md overflow-hidden">
                            <Editor
                              height="200px"
                              defaultLanguage="plaintext"
                              value={testCase.steps.join("\n")}
                              onChange={(value) => {
                                if (value !== undefined) {
                                  handleUpdateTestCase(testCase.id, {
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
                                fontSize: 13,
                                fontFamily: 'monospace',
                              }}
                              theme="vs-dark"
                            />
                          </div>
                        ) : (
                          <ol className="space-y-2">
                            {testCase.steps.map((step, idx) => (
                              <li key={idx} className="flex gap-2 text-sm">
                                <span className="text-primary font-medium min-w-[24px]">
                                  {idx + 1}.
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Expected Result
                        </div>
                        <p className="text-sm">{testCase.expectedResult}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {testCase.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={selectedCount === 0}
            className="bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve & Add {selectedCount > 0 ? `${selectedCount}` : ""} Test Case
            {selectedCount !== 1 ? "s" : ""}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
