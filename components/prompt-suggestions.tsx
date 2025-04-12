"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface PromptSuggestionsProps {
  inputValue: string;
  onSelectSuggestion: (suggestion: string) => void;
  isVisible: boolean;
}

// Flatten all templates from prompt-templates.tsx for suggestions
const allPromptTemplates = [
  // Data Structures
  "Create a linked list implementation",
  "Implement a binary search tree",
  "Create a hash table implementation",
  "Implement a stack and queue",
  "Create a priority queue",
  "Implement a trie data structure",
  "Create a graph representation",

  // Algorithms
  "Write a function to find the shortest path",
  "Implement a sorting algorithm",
  "Create a function to find all permutations",
  "Write a dynamic programming solution",
  "Implement a binary search algorithm",
  "Create a function to detect cycles",
  "Implement the A* search algorithm",
  "Write a function to solve",

  // Web Development
  "Create a responsive navigation menu",
  "Implement a form validation",
  "Write a function to fetch data",
  "Create a custom hook",
  "Implement a lazy loading",
  "Create a pagination component",
  "Write a service worker",
  "Implement a debounced search",

  // Utilities
  "Write a function to deep clone",
  "Create a debounce and throttle",
  "Implement a simple state management",
  "Write a utility to format dates",
  "Create a function to generate UUIDs",
  "Implement a memoization utility",
  "Write a utility for parsing",
  "Create a function for deep object",

  // React Components
  "Create a reusable modal component",
  "Implement a custom select dropdown",
  "Build a file upload component",
  "Create a carousel/slider component",
  "Implement an infinite scroll",
  "Build a color picker component",
  "Create a markdown editor",

  // State Management
  "Implement a custom React context",
  "Create a Redux slice",
  "Build a custom hook for local storage",
  "Implement a Zustand store",
  "Create a state machine",

  // API Development
  "Create a RESTful API endpoint",
  "Implement JWT authentication",
  "Build a rate limiting middleware",
  "Create a GraphQL schema",
  "Implement a file upload endpoint",
  "Build a webhook handler",
];

export function PromptSuggestions({
  inputValue,
  onSelectSuggestion,
  isVisible,
}: PromptSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only show suggestions if there's input and the input is at least 3 characters long
    if (inputValue && inputValue.length >= 3 && isVisible) {
      const inputLower = inputValue.toLowerCase();
      const filteredSuggestions = allPromptTemplates
        .filter((template) => template.toLowerCase().includes(inputLower))
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, isVisible]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (suggestions.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div
      ref={suggestionsRef}
      className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1 max-h-60 overflow-y-auto"
    >
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="ghost"
          className="justify-start h-auto py-2 px-3 text-sm text-left w-full hover:bg-muted"
          onClick={() => {
            onSelectSuggestion(suggestion);
            setSuggestions([]);
          }}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
