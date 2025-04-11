"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PromptTemplatesProps {
  onSelectTemplate: (template: string) => void
}

export function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const templates = {
    general: [
      {
        category: "Data Structures",
        prompts: [
          "Create a linked list implementation with methods for adding, removing, and finding elements",
          "Implement a binary search tree with insertion, deletion, and search operations",
          "Create a hash table implementation with collision handling",
          "Implement a stack and queue data structure",
          "Create a priority queue implementation using a heap",
          "Implement a trie data structure for efficient string operations",
          "Create a graph representation with adjacency list and basic traversal algorithms",
        ],
      },
      {
        category: "Algorithms",
        prompts: [
          "Write a function to find the shortest path in a graph using Dijkstra's algorithm",
          "Implement a sorting algorithm (merge sort, quick sort, or heap sort)",
          "Create a function to find all permutations of a string",
          "Write a dynamic programming solution for the knapsack problem",
          "Implement a binary search algorithm with O(log n) complexity",
          "Create a function to detect cycles in a linked list",
          "Implement the A* search algorithm for pathfinding",
          "Write a function to solve the N-Queens problem",
        ],
      },
      {
        category: "Web Development",
        prompts: [
          "Create a responsive navigation menu with dropdown functionality",
          "Implement a form validation utility that checks email, password, and required fields",
          "Write a function to fetch data from an API and handle loading, error, and success states",
          "Create a custom hook for managing form state in React",
          "Implement a lazy loading image component",
          "Create a pagination component with accessibility features",
          "Write a service worker for offline caching",
          "Implement a debounced search input component",
        ],
      },
      {
        category: "Utilities",
        prompts: [
          "Write a function to deep clone an object in JavaScript",
          "Create a debounce and throttle utility function",
          "Implement a simple state management solution",
          "Write a utility to format dates in different locales and formats",
          "Create a function to generate UUIDs or unique identifiers",
          "Implement a memoization utility for caching expensive function results",
          "Write a utility for parsing and manipulating URL parameters",
          "Create a function for deep object comparison",
        ],
      },
    ],
    frontend: [
      {
        category: "React Components",
        prompts: [
          "Create a reusable modal component with animations",
          "Implement a custom select dropdown with search functionality",
          "Build a file upload component with drag and drop support",
          "Create a carousel/slider component with touch support",
          "Implement an infinite scroll component",
          "Build a color picker component",
          "Create a markdown editor with preview",
        ],
      },
      {
        category: "State Management",
        prompts: [
          "Implement a custom React context for theme management",
          "Create a Redux slice for user authentication",
          "Build a custom hook for local storage state synchronization",
          "Implement a Zustand store for shopping cart functionality",
          "Create a state machine for a multi-step form",
        ],
      },
      {
        category: "Animations",
        prompts: [
          "Create a page transition animation using Framer Motion",
          "Implement a skeleton loading animation",
          "Build a notification toast system with animations",
          "Create a parallax scrolling effect",
          "Implement a typing animation effect",
        ],
      },
    ],
    backend: [
      {
        category: "API Development",
        prompts: [
          "Create a RESTful API endpoint for user authentication",
          "Implement JWT authentication middleware",
          "Build a rate limiting middleware for API protection",
          "Create a GraphQL schema for a blog application",
          "Implement a file upload endpoint with validation",
          "Build a webhook handler with signature verification",
        ],
      },
      {
        category: "Database",
        prompts: [
          "Create a database schema for an e-commerce application",
          "Implement a repository pattern for database access",
          "Build a caching layer for database queries",
          "Create a migration script for schema changes",
          "Implement a data seeder for testing",
          "Build a query builder for complex database operations",
        ],
      },
      {
        category: "Security",
        prompts: [
          "Implement password hashing and verification",
          "Create a CSRF protection middleware",
          "Build an input sanitization utility",
          "Implement role-based access control",
          "Create a secure cookie handling utility",
          "Build a two-factor authentication system",
        ],
      },
    ],
    mobile: [
      {
        category: "React Native",
        prompts: [
          "Create a bottom tab navigator with custom styling",
          "Implement a pull-to-refresh list component",
          "Build a camera component with photo capture",
          "Create a location tracking service",
          "Implement push notifications handling",
          "Build a biometric authentication component",
        ],
      },
      {
        category: "Flutter",
        prompts: [
          "Create a custom animated bottom navigation bar",
          "Implement a state management solution using Provider",
          "Build a responsive grid layout for different screen sizes",
          "Create a theme switching functionality",
          "Implement a local database using Hive",
          "Build a custom chart component",
        ],
      },
    ],
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>Prompt Templates</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="border rounded-md overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="frontend">Frontend</TabsTrigger>
              <TabsTrigger value="backend">Backend</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>

            {Object.entries(templates).map(([key, categories]) => (
              <TabsContent key={key} value={key} className="p-4 space-y-4">
                {categories.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <h3 className="font-medium">{category.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {category.prompts.map((prompt) => (
                        <Button
                          key={prompt}
                          variant="ghost"
                          className="justify-start h-auto py-2 px-3 text-sm text-left"
                          onClick={() => {
                            onSelectTemplate(prompt)
                            setIsOpen(false)
                          }}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
