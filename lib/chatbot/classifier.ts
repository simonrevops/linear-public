import Anthropic from '@anthropic-ai/sdk'

const anthropicApiKey = process.env.ANTHROPIC_API_KEY

if (!anthropicApiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required')
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
})

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Classification {
  title: string
  type: 'bug' | 'enhancement' | 'new-build' | 'data-issue' | 'access' | 'investigation' | 'integration' | 'support'
  platforms: Array<'source-of-truth' | 'sales-enablement' | 'conversation-intel' | 'data-enrichment' | 'quote-to-cash'>
  systems: Array<'hubspot' | 'snowflake' | 'equals' | 'n8n' | 'aircall' | 'clay' | 'aws' | 'avarra' | 'sequence'>
  areas: Array<'object-model' | 'data-quality' | 'data-sync' | 'reporting' | 'automation' | 'views-ui' | 'workflows-ux' | 'provisioning' | 'lead-routing' | 'pipeline' | 'attribution' | 'cpq' | 'billing' | 'expansion'>
  priority: 'urgent' | 'high' | 'medium' | 'low'
  scope: 'individual' | 'team' | 'multiple-teams' | 'all-gtm'
  frequency: 'one-time' | 'weekly' | 'daily' | 'constant'
  risk_flags: string[]
  summary: string
}

export interface AgentResponse {
  status: 'need_more_info' | 'ready' | 'create'
  question?: string
  classification?: Classification
}

const SYSTEM_MESSAGE = `You are a RevOps intake assistant at allgravy.com. Your job is to gather enough information to classify and create a Linear ticket.

## Your Task

Look at the conversation so far. Decide if you have enough to classify the issue:

**You need:**
1. What's happening (clear problem or request)
2. Who's affected (individual, team, or everyone) - can often be inferred
3. Urgency signals (blocking, deadline, nice-to-have) - can often be inferred
4. Which system if possible (HubSpot, Snowflake, Equals, n8n, Aircall, Clay, AWS, Avarra, Sequence)

**If anything critical is unclear:** Ask ONE short follow-up question. Be conversational, not robotic.

**If you have enough:** Respond with a classification.

## Response Format

If you need more info, respond with JSON:
{
  "status": "need_more_info",
  "question": "Your follow-up question here"
}

If ready to classify, respond with JSON:
{
  "status": "ready|create",
  "classification": {
    "title": "Short title, max 60 chars",
    "type": "bug|enhancement|new-build|data-issue|access|investigation|integration|support",
    "platforms": ["source-of-truth", "sales-enablement", "conversation-intel", "data-enrichment", "quote-to-cash"],
    "systems": ["hubspot", "snowflake", "equals", "n8n", "aircall", "clay", "aws", "avarra", "sequence"],
    "areas": ["object-model", "data-quality", "data-sync", "reporting", "automation", "views-ui", "workflows-ux", "provisioning", "lead-routing", "pipeline", "attribution", "cpq", "billing", "expansion"],
    "priority": "urgent|high|medium|low",
    "scope": "individual|team|multiple-teams|all-gtm",
    "frequency": "one-time|weekly|daily|constant",
    "risk_flags": [],
    "summary": "2-3 sentence summary for the ticket description"
  }
}

## Confirmation Flow

When you have enough info, respond with status: "ready" and include the classification.

On the NEXT message from the user:
- If they approve ("yes", "looks good", "create it", "confirmed", etc.) → respond with status: "create"
- If they provide feedback or corrections → incorporate it, re-classify, respond with status: "ready" again

Only use status: "create" when the user has explicitly approved. When using status: "create" and only return the status

## Classification Guidelines

**Type:**
- bug: "broken", "stopped working", "error", "crash"
- enhancement: "would be nice", "improve", "better if"
- new-build: "create", "build", "we need", "doesn't exist"
- data-issue: "wrong data", "duplicates", "doesn't match"
- access: "can't access", "permission", "locked out"
- investigation: "look into", "not sure why", "something's off"
- integration: "not syncing", "connection", "integration"
- support: "how do I", "help me", "question about"

**Platform:**
- source-of-truth: data accuracy, reporting, workflows, schemas, syncs
- sales-enablement: UI, views, rep experience, "annoying", "too many clicks"
- conversation-intel: calls, transcripts, recordings, Aircall
- data-enrichment: Clay, third-party data, enrichment
- quote-to-cash: CPQ, quotes, billing, invoices

**Priority inference:**
- "blocking", "can't work", "urgent" → urgent
- "deadline", "by Friday", "before launch" → high
- "workaround exists", "annoying" → medium
- "when you get a chance", "nice to have" → low

**HubSpot dual-nature:**
- Data/workflow/sync issues → source-of-truth
- UI/view/UX issues → sales-enablement

Always respond with valid JSON only. No markdown, no explanation outside JSON.`

/**
 * Evaluate conversation and return agent response
 */
export async function evaluateConversation(
  messages: ChatMessage[],
  teamContext?: string
): Promise<AgentResponse> {
  // Add team context to the conversation if available
  const conversationContext = teamContext
    ? `User's team: ${teamContext}\n\nConversation so far:\n\n${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}`
    : `Conversation so far:\n\n${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_MESSAGE,
    messages: [
      {
        role: 'user',
        content: conversationContext
      }
    ]
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic API')
  }

  // Extract JSON from response (handle markdown code blocks if present)
  let jsonStr = content.text
  const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  // Parse the JSON
  let parsed: AgentResponse
  try {
    parsed = JSON.parse(jsonStr.trim())
    // Handle nested output wrapper
    if ('output' in parsed && typeof parsed.output === 'object') {
      parsed = parsed.output as AgentResponse
    }
  } catch (e) {
    // If parsing fails, treat as need_more_info with the raw response as question
    parsed = {
      status: 'need_more_info',
      question: "I didn't quite understand. Could you describe the issue again?"
    }
  }

  return parsed
}

