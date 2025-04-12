"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface CodePlaygroundProps {
  code: string;
  language: string;
  title?: string;
}

export function CodePlayground({ code, language, title }: CodePlaygroundProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("preview");
  const [isExporting, setIsExporting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Only show playground for HTML/CSS/JS
  const isPreviewable = ["html", "css", "javascript", "typescript"].includes(
    language.toLowerCase()
  );

  // Function to refresh the preview
  const refreshPreview = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      updateIframeContent();
    }
  };

  // Function to update iframe content
  const updateIframeContent = () => {
    if (!iframeRef.current) return;

    let htmlContent = "";

    // Handle different languages
    if (language.toLowerCase() === "html") {
      htmlContent = code;
    } else if (language.toLowerCase() === "css") {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${code}</style>
        </head>
        <body>
          <div class="preview-container">
            <h2>CSS Preview</h2>
            <p>This is a paragraph with styling.</p>
            <button>This is a button</button>
            <div class="box">This is a div</div>
          </div>
        </body>
        </html>
      `;
    } else if (["javascript", "typescript"].includes(language.toLowerCase())) {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; }
            #output { 
              border: 1px solid #ddd; 
              padding: 15px; 
              border-radius: 5px; 
              margin-top: 20px; 
              min-height: 100px;
              background-color: #f9f9f9;
            }
            .console-line { margin-bottom: 5px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h2>JavaScript Output</h2>
          <div id="output"></div>
          <script>
            // Capture console output
            const output = document.getElementById('output');
            const originalConsole = {
              log: console.log,
              error: console.error,
              warn: console.warn,
              info: console.info
            };

            function appendToOutput(message, type = 'log') {
              const line = document.createElement('div');
              line.className = 'console-line';
              if (type === 'error') line.classList.add('error');
              line.textContent = message;
              output.appendChild(line);
            }

            console.log = function(...args) {
              originalConsole.log(...args);
              appendToOutput(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' '));
            };

            console.error = function(...args) {
              originalConsole.error(...args);
              appendToOutput(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' '), 'error');
            };

            console.warn = function(...args) {
              originalConsole.warn(...args);
              appendToOutput('⚠️ ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' '));
            };

            console.info = function(...args) {
              originalConsole.info(...args);
              appendToOutput('ℹ️ ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' '));
            };

            try {
              ${code}
            } catch (error) {
              console.error('Error: ' + error.message);
            }
          </script>
        </body>
        </html>
      `;
    }

    // Set the content to the iframe
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      setIsLoading(false);
    }
  };

  // Update iframe when code changes
  useEffect(() => {
    if (isPreviewable) {
      updateIframeContent();
    } else {
      setIsLoading(false);
    }
  }, [code, language, isPreviewable]);

  // Function to export to CodeSandbox has been removed as requested

  // Function to export to ZIP
  const exportToZip = async () => {
    try {
      setIsExporting(true);
      const zip = new JSZip();

      // Add files based on language
      if (language.toLowerCase() === "html") {
        zip.file("index.html", code);
      } else if (language.toLowerCase() === "css") {
        zip.file("styles.css", code);
        zip.file(
          "index.html",
          `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="preview-container">
    <h2>CSS Preview</h2>
    <p>This is a paragraph with styling.</p>
    <button>This is a button</button>
    <div class="box">This is a div</div>
  </div>
</body>
</html>`
        );
      } else if (
        ["javascript", "typescript"].includes(language.toLowerCase())
      ) {
        zip.file("script.js", code);
        zip.file(
          "index.html",
          `<!DOCTYPE html>
<html>
<head>
  <title>JavaScript Preview</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h2>JavaScript Output</h2>
  <div id="output"></div>
  <script src="script.js"></script>
</body>
</html>`
        );
        zip.file(
          "styles.css",
          `body { font-family: system-ui, sans-serif; padding: 20px; }
#output { 
  border: 1px solid #ddd; 
  padding: 15px; 
  border-radius: 5px; 
  margin-top: 20px; 
  min-height: 100px;
  background-color: #f9f9f9;
}
.console-line { margin-bottom: 5px; }
.error { color: red; }`
        );
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" });
      const fileName = title
        ? `${title.replace(/\s+/g, "_").toLowerCase()}.zip`
        : `code_${language.toLowerCase()}.zip`;

      // Save the zip file
      saveAs(content, fileName);

      toast({
        title: "Export Successful",
        description: `Your code has been exported to ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting to ZIP:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export to ZIP",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isPreviewable) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Code Preview & Playground</CardTitle>
            <CardDescription>
              Live preview of your {language} code
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPreview}
              title="Refresh Preview"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToZip}
              disabled={isExporting}
              title="Export to ZIP"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export ZIP
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent
            value="preview"
            className="border rounded-md p-0 overflow-hidden"
          >
            <div className="relative w-full bg-background">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <iframe
                ref={iframeRef}
                className="w-full min-h-[400px] border-0"
                title="Code Preview"
                sandbox="allow-scripts allow-same-origin"
                onLoad={() => setIsLoading(false)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
