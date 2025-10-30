import { Copy, Download, Play } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Editor, { BeforeMount, OnMount } from "@monaco-editor/react";

interface ScriptEditorProps {
  scriptId: string;
  scriptName: string;
}

// Helper: convert CSS HSL vars (e.g. "220 39% 9%") to HEX for Monaco theme
function hslVarToHex(varName: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const [hStr, sStr, lStr] = raw.split(" ");
  const h = parseFloat(hStr);
  const s = parseFloat(sStr?.replace("%", ""));
  const l = parseFloat(lStr?.replace("%", ""));
  const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const ScriptEditor = ({ scriptId, scriptName }: ScriptEditorProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState(`import { test, expect } from '@playwright/test';

test('${scriptName}', async ({ page }) => {
  // Navigate to the application
  await page.goto('https://example.com');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Perform test actions
  await page.click('button#submit');
  
  // Add assertions
  await expect(page.locator('.success-message')).toBeVisible();
  
  // Verify the result
  const result = await page.textContent('.result');
  expect(result).toBe('Success');
});`);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: "Script code has been copied successfully",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = scriptName || "script.spec.ts";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExecute = () => {
    toast({
      title: "Executing test...",
      description: "Test execution started in browser preview",
    });
    // Test execution logic will be implemented here
  };

  const beforeMount: BeforeMount = (monaco) => {
    // Pull colors from our design tokens
    const bg = hslVarToHex("--editor-bg", "#0f172a");
    const fg = hslVarToHex("--foreground", "#e5e7eb");
    const primary = hslVarToHex("--primary", "#60a5fa");
    const border = hslVarToHex("--border", "#1f2937");
    const muted = hslVarToHex("--muted-foreground", "#9ca3af");

    monaco.editor.defineTheme("mocktale-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editorLineNumber.foreground": muted,
        "editor.selectionBackground": primary + "22",
        "editor.inactiveSelectionBackground": primary + "11",
        "editor.lineHighlightBackground": primary + "0A",
        "editorCursor.foreground": primary,
        "editorBracketMatch.border": primary,
        "editorWidget.background": bg,
        "dropdown.background": bg,
        "dropdown.border": border,
        "input.background": bg,
        "input.border": border,
        "focusBorder": border,
        "panel.border": border,
        "sideBar.background": bg,
        "minimap.background": bg,
      },
    });
  };

  const onMount: OnMount = (editor, monaco) => {
    monaco.editor.setTheme("mocktale-dark");
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--editor-bg))]">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{scriptName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Playwright Test Script</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={handleExecute}>
            <Play className="h-4 w-4 mr-2" />
            Execute
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={(val) => setCode(val ?? "")}
          beforeMount={beforeMount}
          onMount={onMount}
          options={{
            fontFamily: "JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontLigatures: true,
            fontSize: 13,
            smoothScrolling: true,
            mouseWheelZoom: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            minimap: { enabled: true, renderCharacters: false, maxColumn: 80 },
            automaticLayout: true,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            guides: { indentation: true, bracketPairs: true },
          }}
        />
      </div>
    </div>
  );
};

export default ScriptEditor;
