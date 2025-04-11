"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export interface ModelParameters {
  temperature: number
  topK: number
  topP: number
  maxOutputTokens: number
  stopSequences: string[]
  safetySettings: boolean
}

const DEFAULT_PARAMETERS: ModelParameters = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
  stopSequences: [],
  safetySettings: true,
}

interface ModelParametersProps {
  onChange: (parameters: ModelParameters) => void
}

export function ModelParameters({ onChange }: ModelParametersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [parameters, setParameters] = useState<ModelParameters>(DEFAULT_PARAMETERS)

  const handleParameterChange = <K extends keyof ModelParameters>(key: K, value: ModelParameters[K]) => {
    const newParameters = { ...parameters, [key]: value }
    setParameters(newParameters)
    onChange(newParameters)
  }

  const resetToDefaults = () => {
    setParameters(DEFAULT_PARAMETERS)
    onChange(DEFAULT_PARAMETERS)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>Advanced Model Parameters</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="grid gap-4 p-4 border rounded-md">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Model Parameters</h3>
            <Button variant="ghost" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="temperature">Temperature: {parameters.temperature.toFixed(1)}</Label>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[parameters.temperature]}
              onValueChange={(value) => handleParameterChange("temperature", value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness: Lower values are more deterministic, higher values are more creative.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="topP">Top-P: {parameters.topP.toFixed(2)}</Label>
            </div>
            <Slider
              id="topP"
              min={0}
              max={1}
              step={0.05}
              value={[parameters.topP]}
              onValueChange={(value) => handleParameterChange("topP", value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Nucleus sampling: Only consider tokens with top probability mass.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="topK">Top-K: {parameters.topK}</Label>
            </div>
            <Slider
              id="topK"
              min={1}
              max={100}
              step={1}
              value={[parameters.topK]}
              onValueChange={(value) => handleParameterChange("topK", value[0])}
            />
            <p className="text-xs text-muted-foreground">Only sample from the top K options for each token.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="maxOutputTokens">Max Output Tokens: {parameters.maxOutputTokens}</Label>
            </div>
            <Slider
              id="maxOutputTokens"
              min={128}
              max={8192}
              step={128}
              value={[parameters.maxOutputTokens]}
              onValueChange={(value) => handleParameterChange("maxOutputTokens", value[0])}
            />
            <p className="text-xs text-muted-foreground">Maximum number of tokens to generate.</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="safetySettings"
              checked={parameters.safetySettings}
              onCheckedChange={(checked) => handleParameterChange("safetySettings", checked)}
            />
            <Label htmlFor="safetySettings">Enable Safety Settings</Label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
