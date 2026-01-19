import { Client } from '@hubspot/api-client'

const hubspotApiKey = process.env.HUBSPOT_API_KEY

if (!hubspotApiKey) {
  throw new Error('HUBSPOT_API_KEY environment variable is required')
}

export const hubspotClient = new Client({ accessToken: hubspotApiKey })

