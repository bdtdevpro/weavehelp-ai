"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Send, Moon, Sun, Bot, User } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

// Utility to auto-link URLs in text and style them
function linkify(text: string) {
  const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?![^<]*>|[^<>]*<\/?a)/g;
  const linked = text.replace(urlRegex, (url) =>
    `<a href="${url}" target="_blank" style="color:#8B9DC3;text-decoration:underline;" onmouseover=\"this.style.color='#6B7B9A'\" onmouseout=\"this.style.color='#8B9DC3'\">${url}</a>`
  );
  return linked.replace(/\n/g, '<br />');
}

export default function WeaveHelpChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Weave, your AI support assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Load theme preference from session storage on component mount
  useEffect(() => {
    const savedTheme = sessionStorage.getItem('weavehelp-theme')
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const getBotResponse = async (userInput: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting bot response:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const botResponse = await getBotResponse(inputValue)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('Error in handleSendMessage:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    // Save theme preference to session storage
    sessionStorage.setItem('weavehelp-theme', newTheme ? 'dark' : 'light')
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-background transition-colors duration-300 flex items-center justify-center">
        <div className="container mx-auto max-w-4xl p-4">
          {/* Header */}
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">WeaveHelp</h1>
                  <p className="text-sm text-muted-foreground">AI Support Assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch checked={isDarkMode} onCheckedChange={toggleTheme} aria-label="Toggle dark mode" />
                <Moon className="h-4 w-4" />
              </div>
            </div>
          </Card>

          {/* Chat Container */}
          <Card className="flex h-[700px] flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      {message.sender === "bot" ? (
                        <>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarFallback className="bg-secondary">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <p
                        className={`text-md break-words leading-relaxed ${message.sender === "bot" ? "text-[#B0B0B0]" : ""}`}
                        dangerouslySetInnerHTML={{
                          __html:
                            message.sender === "bot"
                              ? linkify(message.content)
                              : message.content,
                        }}
                      ></p>
                      <p className="mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Press Enter to send • Shift + Enter for new line</p>
            </div>
          </Card>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Powered by WeaveHelp • Available 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}
