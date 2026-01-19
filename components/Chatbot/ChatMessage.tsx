'use client'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-md px-4 py-2 ${
          isUser
            ? 'bg-[#9466ff] text-white'
            : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#ebebeb]'
        }`}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}
      >
        <p className="whitespace-pre-wrap text-[13px] font-normal">{content}</p>
      </div>
    </div>
  )
}
