"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { motion, AnimatePresence } from "framer-motion"
import { Check, RefreshCw } from "lucide-react"

export function CustomCaptcha({ onVerify }: { onVerify: (verified: boolean) => void }) {
  const [captchaText, setCaptchaText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [timeoutActive, setTimeoutActive] = useState(false)

  const generateCaptcha = () => {
    setIsRotating(true)
    // Mix uppercase, lowercase, numbers, and special chars
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%"
    let text = ""
    for (let i = 0; i < 6; i++) {
      // Add random character rotation and positioning
      const char = chars.charAt(Math.floor(Math.random() * chars.length))
      text += char
    }
    setCaptchaText(text)
    setUserInput("")
    setIsVerified(false)
    onVerify(false)
    setTimeout(() => setIsRotating(false), 500)
  }

  // Remove this entire first verifyCaptcha function
  // const verifyCaptcha = () => {
  //   if (timeoutActive) {
  //     return
  //   }
  //   if (attempts >= 3) {
  //     setTimeoutActive(true)
  //     setTimeout(() => {
  //       setTimeoutActive(false)
  //       setAttempts(0)
  //       generateCaptcha()
  //     }, 30000) // 30 seconds timeout
  //     return
  //   }
  // }

  // Add automatic refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(generateCaptcha, 120000)
    return () => clearInterval(interval)
  }, [])

  const [mouseMovements, setMouseMovements] = useState(0)
  const [typingPattern, setTypingPattern] = useState<number[]>([])
  const [lastKeyTime, setLastKeyTime] = useState(0)
  const startTime = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleMouseMove = () => {
      setMouseMovements(prev => prev + 1)
    }

    window.addEventListener('mousemove', handleMouseMove)
    startTime.current = Date.now()

    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentTime = Date.now()
    if (lastKeyTime > 0) {
      setTypingPattern(prev => [...prev, currentTime - lastKeyTime])
    }
    setLastKeyTime(currentTime)
    setUserInput(e.target.value)
  }

  const checkBotBehavior = (): boolean => {
    const timeSpent = Date.now() - startTime.current
    const avgTypingInterval = typingPattern.reduce((a, b) => a + b, 0) / typingPattern.length

    // Bot detection criteria
    const isSuspiciousBehavior = 
      timeSpent < 1000 || // Too fast completion
      mouseMovements < 5 || // Too few mouse movements
      (typingPattern.length > 0 && avgTypingInterval < 50) || // Too consistent typing
      typingPattern.every(interval => interval < 100) // Inhuman typing speed

    return !isSuspiciousBehavior
  }

  // Keep only this enhanced verifyCaptcha version
  const verifyCaptcha = () => {
    if (timeoutActive) return

    // Check for bot behavior first
    if (!checkBotBehavior()) {
      setAttempts(prev => prev + 1)
      generateCaptcha()
      setTypingPattern([])
      startTime.current = Date.now()
      return
    }

    if (attempts >= 3) {
      setTimeoutActive(true)
      setTimeout(() => {
        setTimeoutActive(false)
        setAttempts(0)
        generateCaptcha()
        setTypingPattern([])
        startTime.current = Date.now()
      }, 30000)
      return
    }

    const verified = userInput === captchaText
    if (!verified) {
      setAttempts(prev => prev + 1)
      generateCaptcha()
      setTypingPattern([])
    }
    setIsVerified(verified)
    onVerify(verified)
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <AnimatePresence mode="wait">
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <motion.div
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 rounded-lg select-none relative overflow-hidden"
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(1rem, 3vw, 1.25rem)",
              letterSpacing: "0.25em",
            }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="absolute inset-0 bg-grid-pattern"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                ease: "linear",
                repeat: Infinity,
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={captchaText}
              className="relative z-10 mix-blend-difference text-white text-center sm:text-left"
            >
              {captchaText}
            </motion.div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={generateCaptcha}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <motion.div
                animate={{ rotate: isRotating ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="flex flex-col sm:flex-row gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter the code above"
          value={userInput}
          onChange={handleInputChange}
          className="flex-1 text-sm h-8"
          autoComplete="off"
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        />
        <Button
          type="button"
          onClick={verifyCaptcha}
          variant="default"
          className={`min-w-[80px] h-8 sm:h-10 transition-all mt-1 sm:mt-0 text-sm ${
            isVerified ? "bg-green-600 hover:bg-green-700" : ""
          }`}
        >
          {isVerified ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Valid
            </motion.div>
          ) : (
            "Verify"
          )}
        </Button>
      </motion.div>
      {timeoutActive && (
        <p className="text-xs text-destructive">
          Too many attempts. Please wait 30 seconds before trying again.
        </p>
      )}
      {attempts > 0 && !timeoutActive && (
        <p className="text-xs text-muted-foreground">
          Attempts remaining: {3 - attempts}
        </p>
      )}
    </div>
  )
}