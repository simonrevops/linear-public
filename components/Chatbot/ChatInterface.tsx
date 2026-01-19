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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d0d0d]">
        {messages.length === 0 && (
          <div className="text-center text-[#8a8a8a] py-8">
            <p className="text-[14px] font-medium mb-2 text-[#ebebeb]">How can I help you today?</p>
            <p className="text-[13px]">Describe the issue or request you'd like to report.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#9466ff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#9466ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#9466ff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="border-t border-[#2a2a2a] p-4 bg-[#1a1a1a]">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={status === 'AWAIT_CONFIRMATION' ? 'Type "yes" to create or "cancel" to discard...' : 'Type your message...'}
            className="flex-1 px-4 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md text-[#ebebeb] focus:outline-none focus:ring-2 focus:ring-[#9466ff] focus:border-[#9466ff] transition-colors duration-150 text-[13px]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-[#9466ff] text-white rounded-md hover:bg-[#8555e6] focus:outline-none focus:ring-2 focus:ring-[#9466ff] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 text-[13px]"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
