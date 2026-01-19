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
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-[#5e6ad2] text-white'
            : 'bg-[#151515] border border-[#1f1f1f] text-[#ededed]'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm">{content}</p>
      </div>
    </div>
  )
}
