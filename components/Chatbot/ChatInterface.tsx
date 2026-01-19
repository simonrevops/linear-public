'use client'

import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'

interface ChatInterfaceProps {
  sessionId: string
  userEmail: string
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export default function ChatInterface({ sessionId, userEmail, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'CONVERSING' | 'AWAIT_CONFIRMATION' | 'CREATE'>('CONVERSING')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    const newUserMessage = { role: 'user' as const, content: userMessage }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          userEmail,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      setStatus(data.status === 'ready' ? 'AWAIT_CONFIRMATION' : data.status === 'create' ? 'CREATE' : 'CONVERSING')

      if (data.status === 'create') {
        setTimeout(() => {
          setStatus('CONVERSING')
        }, 3000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d]">
      {/* Messages Area - fills from top, scrolls when needed */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-[#9ca3af] py-12">
            <p className="text-lg font-medium mb-2 text-[#ededed]">How can I help you today?</p>
            <p className="text-sm">Describe the issue or request you'd like to report.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#5e6ad2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#5e6ad2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#5e6ad2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - fixed at bottom */}
      <div className="border-t border-[#1f1f1f] bg-[#151515] p-4">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={status === 'AWAIT_CONFIRMATION' ? 'Type "yes" to create or "cancel" to discard...' : 'Type your message...'}
            className="flex-1 px-4 py-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-md text-[#ededed] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:border-[#5e6ad2]"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-[#5e6ad2] text-white rounded-md hover:bg-[#4c56c4] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:ring-offset-2 focus:ring-offset-[#151515] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
