import { LinearClient } from '@linear/sdk'

const linearApiKey = process.env.LINEAR_API_KEY

if (!linearApiKey) {
  throw new Error('LINEAR_API_KEY environment variable is required')
}

export const linearClient = new LinearClient({
  apiKey: linearApiKey,
})

