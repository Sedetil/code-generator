"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Copy, Check, Save, RefreshCw, Download, Share2, Lightbulb, History, LogIn, Image as ImageIcon, X } from "lucide-react"
import { GoogleGenerativeAI, type GenerateContentRequest } from "@google/generative-ai"
import { ErrorMessage } from "@/components/error-message"
import { CodeEditor } from "@/components/code-editor"
import { PromptTemplates } from "@/components/prompt-templates"
import { ModelParameters, type ModelParameters as ModelParametersType } from "@/components/model-parameters"
import { useToast } from "@/hooks/use-toast"
import { getSavedSnippets, deleteSnippet } from "@/lib/storage"
import { SavedSnippets } from "@/components/saved-snippets"
import { CodeExplanation } from "@/components/code-explanation"
import { CodeComparison } from "@/components/code-comparison"
import { CodePlayground } from "@/components/code-playground"
import { AuthModal } from "./auth/auth-modal"
import { supabase } from "@/lib/supabase"
import { saveSnippet, getUserSnippets, deleteSnippet as deleteSupabaseSnippet } from "@/lib/supabase-utils"

import { PromptSuggestions } from "@/components/prompt-suggestions"

export type CodeSnippet = {
  id: string
  title: string
  language: string
  prompt: string
  code: string
  createdAt: number
  userId?: string
}

export type CodeVersion = {
  code: string
  timestamp: number
  description: string
}

// Initialize the Google Generative AI with the API key
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

// Use a more widely available model
const MODEL_NAME = "gemini-2.0-flash" // Fallback to a more common model name
const VISION_MODEL_NAME = "gemini-2.0-flash" // Vision model for image processing

// Extended language options
const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dart", label: "Dart" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash" },
  { value: "powershell", label: "PowerShell" },
]

// Function to clean up code output by removing markdown symbols
const cleanCodeOutput = (text: string): string => {
  // Remove markdown code block delimiters
  let cleanedText = text.replace(/```[\w]*\n/g, "").replace(/```$/g, "")

  // Remove any leading/trailing backticks that might remain
  cleanedText = cleanedText.replace(/^`+|`+$/g, "")

  // Trim any extra whitespace
  cleanedText = cleanedText.trim()

  return cleanedText
}

// Function to clean up explanation text by removing markdown symbols
const cleanExplanationText = (text: string): string => {
  // Remove markdown formatting like ** for bold, * for italic, ` for code
  let cleanedText = text.replace(/\*\*|\*|`/g, "")

  // Remove any markdown headers (# symbols)
  cleanedText = cleanedText.replace(/^#+\s+/gm, "")

  // Remove any markdown list markers
  cleanedText = cleanedText.replace(/^\s*[-*+]\s+/gm, "• ")

  // Remove any markdown code block delimiters
  cleanedText = cleanedText.replace(/```[\w]*\n|```$/g, "")

  return cleanedText
}

export function CodeGenerator() {
  const [prompt, setPrompt] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [generatedCode, setGeneratedCode] = useState("")
  const [editableCode, setEditableCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExplaining, setIsExplaining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedSnippets, setSavedSnippets] = useState<CodeSnippet[]>([])
  const [activeTab, setActiveTab] = useState("generate")
  const [explanation, setExplanation] = useState("")
  const [snippetTitle, setSnippetTitle] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [modelParameters, setModelParameters] = useState<ModelParametersType>({
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
    stopSequences: [],
    safetySettings: true,
  })
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonData, setComparisonData] = useState<{ original: string; new: string }>({
    original: "",
    new: "",
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { toast } = useToast()
  const [apiKeyValid, setApiKeyValid] = useState(true)
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false)
  
  // Add effect to parse shared code from URL parameters
  useEffect(() => {
    // Function to parse URL parameters when component mounts
    const parseSharedCodeFromURL = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');
        
        if (sharedData) {
          try {
            const parsedData = JSON.parse(decodeURIComponent(sharedData));
            
            // Validate the parsed data contains required fields
            if (parsedData.code && parsedData.language) {
              // Set the component state with the shared data
              setPrompt(parsedData.prompt || '');
              setLanguage(parsedData.language);
              setGeneratedCode(parsedData.code);
              setEditableCode(parsedData.code);
              setSnippetTitle(parsedData.prompt ? 
                parsedData.prompt.split(" ").slice(0, 5).join(" ") + "..." : 
                "Shared code snippet"
              );
              
              // Add to version history
              const initialVersion = {
                code: parsedData.code,
                timestamp: Date.now(),
                description: "Shared code snippet",
              };
              setCodeVersions([initialVersion]);
              
              // Switch to the generate tab to show the code
              setActiveTab("generate");
              
              toast({
                title: "Shared code loaded",
                description: "A shared code snippet has been loaded",
              });
              
              // Clean up the URL to prevent reloading the same data if page refreshes
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (error) {
            console.error("Error parsing shared code data:", error);
            toast({
              title: "Error loading shared code",
              description: "Could not load the shared code snippet",
              variant: "destructive",
            });
          }
        }
      }
    };
    
    parseSharedCodeFromURL();
  }, []);  // Empty dependency array means this runs once when component mounts

  useEffect(() => {
    // Check if API key is available
    if (!apiKey) {
      setApiKeyValid(false)
      setError("Google Generative AI API key is not configured. Please check your environment variables.")
    }

    // Set up auth state listener for Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setCurrentUser(session?.user || null)
      if (session?.user) {
        // Load user's snippets from Supabase
        loadUserSnippets(session.user.id)
      } else {
        // Load local snippets if not logged in
        loadLocalSnippets()
      }
    })

    // Initial session check
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setCurrentUser(session?.user || null)

      if (session?.user) {
        loadUserSnippets(session.user.id)
      } else {
        loadLocalSnippets()
      }
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserSnippets = async (userId: string) => {
    setIsLoadingSnippets(true)
    try {
      const snippets = await getUserSnippets(userId)
      setSavedSnippets(snippets)
    } catch (error) {
      console.error("Error loading user snippets:", error)
      toast({
        title: "Error loading snippets",
        description: "Could not load your saved snippets",
        variant: "destructive",
      })
      // Fallback to local snippets
      loadLocalSnippets()
    } finally {
      setIsLoadingSnippets(false)
    }
  }

  const loadLocalSnippets = async () => {
    setIsLoadingSnippets(true)
    try {
      const snippets = await getSavedSnippets()
      setSavedSnippets(snippets)
    } catch (error) {
      console.error("Error loading local snippets:", error)
    } finally {
      setIsLoadingSnippets(false)
    }
  }

  useEffect(() => {
    // Update editable code when generated code changes
    if (generatedCode) {
      setEditableCode(generatedCode)

      // Add to version history
      const newVersion: CodeVersion = {
        code: generatedCode,
        timestamp: Date.now(),
        description: "Initial generation",
      }

      setCodeVersions([newVersion])
    }
  }, [generatedCode])

  // Add new state variables for image handling
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUsingVision, setIsUsingVision] = useState(false)
  
  // Add function to handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
  
      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string)
          setIsUsingVision(true)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Add function to handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      
      // Check if the file is an image
      if (file.type.startsWith('image/')) {
        setImageFile(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreview(event.target.result as string)
            setIsUsingVision(true)
          }
        }
        reader.readAsDataURL(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, GIF, etc.)",
          variant: "destructive",
        })
      }
    }
  }

  // Add function to remove uploaded image
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setIsUsingVision(false)
  }

  // Modify the generateWithGemini function to handle images
  const generateWithGemini = async (promptText: string, params: ModelParametersType) => {
    if (!apiKey) {
      throw new Error("Google Generative AI API key is not configured")
    }

    try {
      // Choose model based on whether an image is included
      const modelName = isUsingVision && imageFile ? VISION_MODEL_NAME : MODEL_NAME
      const model = genAI.getGenerativeModel({ model: modelName })

      // Configure generation parameters
      const generationConfig = {
        temperature: params.temperature,
        topK: params.topK,
        topP: params.topP,
        maxOutputTokens: params.maxOutputTokens,
        stopSequences: params.stopSequences,
      }

      // Create parts array based on whether an image is included
      let parts = []
      
      if (isUsingVision && imageFile) {
        // Convert image to base64 data URL if not already
        let imageData = imagePreview
        if (!imagePreview?.startsWith('data:')) {
          const reader = new FileReader()
          imageData = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(imageFile)
          })
        }
        
        // Make sure imageData is not undefined and extract the base64 part
        const base64Data = imageData?.split(',')[1] || ''
        
        // Add image and text to parts
        parts = [
          { text: promptText },
          { inlineData: { mimeType: imageFile.type, data: base64Data } }
        ]
      } else {
        // Text-only prompt
        parts = [{ text: promptText }]
      }

      // Create generation request
      const request: GenerateContentRequest = {
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings: params.safetySettings
          ? [
              {
                category: "HARM_CATEGORY_HARASSMENT" as any,
                threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH" as any,
                threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
                threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
                threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
              },
            ]
          : [],
      }

      const result = await model.generateContent(request)
      const response = await result.response
      const text = response.text()

      return text
    } catch (error) {
      console.error("Error generating with Gemini:", error)
      throw error
    }
  }

  const handleGenerate = async () => {
    if (!prompt) return

    setError(null)
    setIsGenerating(true)
    setGeneratedCode("")
    setExplanation("")

    try {
      let systemPrompt = "You are an expert programmer. Generate clean, efficient, and well-commented code based on the user's request. Only return the code without explanations, markdown formatting, or code block delimiters."
      
      // Add image context to the prompt if using vision
      if (isUsingVision && imageFile) {
        systemPrompt += " I'm providing an image that contains visual information related to my request. Please analyze the image and use it to inform your code generation."
      }
      
      const fullPrompt = `${systemPrompt}\n\nGenerate ${language} code for: ${prompt}.`

      const text = await generateWithGemini(fullPrompt, modelParameters)
      // Clean up the generated code by removing markdown symbols
      const cleanedCode = cleanCodeOutput(text)
      setGeneratedCode(cleanedCode)

      // Generate a default title based on the prompt
      setSnippetTitle(prompt.split(" ").slice(0, 5).join(" ") + "...")
    } catch (error) {
      console.error("Error generating code:", error)
      setError(
        error instanceof Error ? error.message : "Failed to generate code. Please check your API key and try again.",
      )
      setGeneratedCode("")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateFromEdited = async () => {
    if (!editableCode) return

    setError(null)
    setIsGenerating(true)

    try {
      const systemPrompt =
        "You are an expert programmer. Improve the given code while maintaining its functionality. Only return the improved code without explanations, markdown formatting, or code block delimiters."
      const fullPrompt = `${systemPrompt}\n\nImprove this ${language} code: \n\n${editableCode}\n\nMake it more efficient, readable, and add better comments.`

      // Save the current code for comparison
      const originalCode = editableCode

      const text = await generateWithGemini(fullPrompt, modelParameters)
      // Clean up the generated code
      const cleanedCode = cleanCodeOutput(text)

      // Add to version history
      const newVersion: CodeVersion = {
        code: cleanedCode,
        timestamp: Date.now(),
        description: "Improved version",
      }

      setCodeVersions([...codeVersions, newVersion])

      // Set up comparison data
      setComparisonData({
        original: originalCode,
        new: cleanedCode,
      })

      setGeneratedCode(cleanedCode)
      setEditableCode(cleanedCode)
      setShowComparison(true)
    } catch (error) {
      console.error("Error regenerating code:", error)
      setError(
        error instanceof Error ? error.message : "Failed to regenerate code. Please check your API key and try again.",
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExplainCode = async () => {
    if (!editableCode) return

    setError(null)
    setIsExplaining(true)

    try {
      const systemPrompt =
        "You are an expert programming teacher. Explain code clearly and concisely, focusing on key concepts and patterns. Do not use markdown formatting in your explanation."
      const fullPrompt = `${systemPrompt}\n\nExplain this ${language} code in detail:\n\n${editableCode}\n\nProvide a clear explanation of what the code does, how it works, and any important concepts it demonstrates. Do not use markdown formatting, code blocks, or special symbols in your explanation.`

      const text = await generateWithGemini(fullPrompt, modelParameters)
      // Clean up the explanation text
      const cleanedExplanation = cleanExplanationText(text)
      setExplanation(cleanedExplanation)
    } catch (error) {
      console.error("Error explaining code:", error)
      setError(
        error instanceof Error ? error.message : "Failed to explain code. Please check your API key and try again.",
      )
    } finally {
      setIsExplaining(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editableCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard",
    })
  }

  const handleSaveSnippet = async () => {
    if (!editableCode || !snippetTitle) {
      toast({
        title: "Cannot save snippet",
        description: "Please provide a title and make sure there is code to save",
        variant: "destructive",
      })
      return
    }

    // Check if user is logged in
    if (!currentUser) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      const newSnippet = {
        title: snippetTitle,
        language,
        prompt,
        code: editableCode,
        createdAt: Date.now(),
        userId: currentUser.id,
      }

      const savedSnippet = await saveSnippet(newSnippet)
      setSavedSnippets([savedSnippet, ...savedSnippets])

      toast({
        title: "Snippet saved",
        description: "Your code snippet has been saved successfully to your account",
      })
    } catch (error) {
      console.error("Error saving snippet:", error)
      toast({
        title: "Error saving snippet",
        description: "Could not save your code snippet",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSnippet = async (id: string) => {
    try {
      if (currentUser) {
        // Delete from Supabase if user is logged in
        await deleteSupabaseSnippet(id)

        toast({
          title: "Snippet deleted",
          description: "Your code snippet has been deleted from your account",
        })
      } else {
        // Delete locally if not logged in
        await deleteSnippet(id)

        toast({
          title: "Snippet deleted",
          description: "Your code snippet has been deleted",
        })
      }

      setSavedSnippets(savedSnippets.filter((snippet) => snippet.id !== id))
    } catch (error) {
      console.error("Error deleting snippet:", error)
      toast({
        title: "Error deleting snippet",
        description: "Could not delete your code snippet",
        variant: "destructive",
      })
    }
  }

  const handleLoadSnippet = (snippet: CodeSnippet) => {
    setPrompt(snippet.prompt)
    setLanguage(snippet.language)
    setGeneratedCode(snippet.code)
    setEditableCode(snippet.code)
    setSnippetTitle(snippet.title)
    setActiveTab("generate")

    // Reset version history
    const initialVersion: CodeVersion = {
      code: snippet.code,
      timestamp: Date.now(),
      description: "Loaded from saved snippets",
    }
    setCodeVersions([initialVersion])

    toast({
      title: "Snippet loaded",
      description: "Your code snippet has been loaded",
    })
  }

  const downloadCode = () => {
    const fileExtensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
      go: "go",
      rust: "rs",
      php: "php",
      ruby: "rb",
      swift: "swift",
      kotlin: "kt",
      dart: "dart",
      cpp: "cpp",
      c: "c",
      sql: "sql",
      html: "html",
      css: "css",
      bash: "sh",
      powershell: "ps1",
    }

    const extension = fileExtensions[language] || "txt"
    const fileName = `${snippetTitle.replace(/\s+/g, "_").toLowerCase()}.${extension}`

    const element = document.createElement("a")
    const file = new Blob([editableCode], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = fileName
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast({
      title: "Code downloaded",
      description: `File saved as ${fileName}`,
    })
  }

  const handleShareCode = () => {
    // Create a shareable URL with the code and prompt as query parameters
    const shareableData = {
      prompt,
      language,
      code: editableCode,
    }

    const shareableUrl = `${window.location.origin}?data=${encodeURIComponent(JSON.stringify(shareableData))}`

    navigator.clipboard.writeText(shareableUrl)

    toast({
      title: "Share link copied",
      description: "A link to share this code has been copied to your clipboard",
    })
  }

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt)
  }

  const handleViewVersionHistory = () => {
    if (codeVersions.length <= 1) {
      toast({
        title: "No version history",
        description: "You need to generate at least one improvement to view version history",
      })
      return
    }

    // Show comparison between the latest two versions
    setComparisonData({
      original: codeVersions[codeVersions.length - 2].code,
      new: codeVersions[codeVersions.length - 1].code,
    })

    setShowComparison(true)
  }

  return (
    <div className="grid gap-6">
      {!apiKeyValid && (
        <ErrorMessage
          title="API Key Not Configured"
          message="The Google Generative AI API key is not properly configured. Please check your environment variables."
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="generate" className="responsive-text-sm">
            Generate Code
          </TabsTrigger>
          <TabsTrigger value="saved" className="responsive-text-sm">
            Saved Snippets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-6">
          <Card className="overflow-hidden border-2 border-muted shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-xl">What code would you like to generate?</CardTitle>
              <CardDescription>Describe the code you want or choose from a template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label htmlFor="language" className="text-sm font-medium">
                  Programming Language
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <PromptTemplates onSelectTemplate={applyTemplate} />

              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Describe what you want
                </label>
                <div className="relative">
                  <Textarea
                    id="prompt"
                    placeholder="E.g., Create a function that sorts an array of objects by a specific property"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    rows={4}
                    className="resize-none min-h-[100px]"
                  />
                  <PromptSuggestions 
                    inputValue={prompt} 
                    onSelectSuggestion={(suggestion) => {
                      setPrompt(suggestion);
                      setShowSuggestions(false);
                    }} 
                    isVisible={showSuggestions}
                  />
                </div>
              </div>

              {/* Add image upload section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="image-upload" className="text-sm font-medium">
                    Upload Image (Optional)
                  </label>
                  {imagePreview && (
                    <Button variant="ghost" size="sm" onClick={removeImage} className="h-8 px-2">
                      <X className="h-4 w-4 mr-1" /> Remove Image
                    </Button>
                  )}
                </div>
                
                {imagePreview ? (
                  <div className="relative mt-2 rounded-md overflow-hidden border border-muted">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded preview" 
                      className="max-h-[200px] w-auto mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-center w-full"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/30"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or GIF</p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload an image to generate code based on visual content (diagrams, screenshots, etc.)
                </p>
              </div>

              <ModelParameters onChange={setModelParameters} />

              <Button
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className="responsive-w-full-auto"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Code"
                )}
              </Button>
            </CardContent>
          </Card>

          {error && <ErrorMessage title="Code Generation Failed" message={error} />}

          {showComparison && (
            <CodeComparison
              originalCode={comparisonData.original}
              newCode={comparisonData.new}
              language={language}
              onClose={() => setShowComparison(false)}
            />
          )}

          {generatedCode && (
            <>
              <Card className="overflow-hidden border-2 border-muted shadow-md">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Generated Code</CardTitle>
                    <CardDescription>You can edit the code below and regenerate or save it</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy to clipboard">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={downloadCode} title="Download code">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShareCode} title="Share code">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleViewVersionHistory}
                      title="Version history"
                      disabled={codeVersions.length <= 1}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <label htmlFor="snippet-title" className="text-sm font-medium">
                      Snippet Title
                    </label>
                    <Textarea
                      id="snippet-title"
                      placeholder="Give your code snippet a title"
                      value={snippetTitle}
                      onChange={(e) => setSnippetTitle(e.target.value)}
                      rows={1}
                      className="resize-none"
                    />
                  </div>

                  <CodeEditor value={editableCode} onChange={setEditableCode} language={language} />

                  {/* Add Code Preview & Playground for HTML/CSS/JS */}
                  {["html", "css", "javascript", "typescript"].includes(language.toLowerCase()) && (
                    <CodePlayground code={editableCode} language={language} title={snippetTitle} />
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={handleRegenerateFromEdited}
                      disabled={!editableCode || isGenerating}
                      className="responsive-w-full-auto"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Improve Code
                    </Button>

                    {currentUser ? (
                      <Button
                        onClick={handleSaveSnippet}
                        disabled={!editableCode || !snippetTitle}
                        className="responsive-w-full-auto"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Snippet
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsAuthModalOpen(true)}
                        variant="outline"
                        className="responsive-w-full-auto"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Login to Save
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={handleExplainCode}
                      disabled={!editableCode || isExplaining}
                      className="responsive-w-full-auto"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      {isExplaining ? "Explaining..." : "Explain Code"}
                    </Button>
                  </div>

                  {!currentUser && (
                    <div className="mt-2 p-4 bg-muted rounded-md text-sm text-muted-foreground">
                      <p className="flex items-center">
                        <LogIn className="h-4 w-4 mr-2 flex-shrink-0" />
                        You need to be logged in to save snippets to your account.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground border-t py-3">
                  Powered by Google Gemini
                </CardFooter>
              </Card>

              {explanation && <CodeExplanation explanation={explanation} />}
            </>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          {!currentUser ? (
            <Card className="p-8 text-center border-2 border-muted shadow-md">
              <div className="flex flex-col items-center justify-center space-y-4">
                <LogIn className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Login Required</h3>
                <p className="text-muted-foreground max-w-md">
                  You need to be logged in to save and view your code snippets. Login to access your saved snippets.
                </p>
                <Button onClick={() => setIsAuthModalOpen(true)} size="lg">
                  Login to Access Snippets
                </Button>
              </div>
            </Card>
          ) : (
            <SavedSnippets
              snippets={savedSnippets}
              onLoad={handleLoadSnippet}
              onDelete={handleDeleteSnippet}
              isLoading={isLoadingSnippets}
            />
          )}
        </TabsContent>
      </Tabs>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}