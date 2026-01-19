import { hubspotClient } from './client'

export interface HubSpotContact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  team?: string
  teamId?: string
}

/**
 * Lookup contact by email and get team information
 */
export async function lookupContactByEmail(email: string): Promise<HubSpotContact | null> {
  try {
    // Search for contact by email
    const searchResponse = await hubspotClient.crm.contacts.searchApi.doSearch({
      query: email,
      limit: 1,
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ' as any, // Type assertion to fix HubSpot SDK type issue
              value: email
            }
          ]
        }
      ],
      properties: ['email', 'firstname', 'lastname', 'hs_team', 'team', 'department', 'business_unit', 'hs_team_id', 'team_id']
    })

    if (!searchResponse.results || searchResponse.results.length === 0) {
      return null
    }

    const contact = searchResponse.results[0]
    const properties = contact.properties

    // Try to get team information from custom properties
    // Common property names: hs_team, team, department, business_unit
    const team = properties.hs_team || properties.team || properties.department || properties.business_unit
    const teamId = properties.hs_team_id || properties.team_id

    return {
      id: contact.id,
      email: properties.email || email,
      firstName: properties.firstname || undefined,
      lastName: properties.lastname || undefined,
      fullName: properties.firstname && properties.lastname
        ? `${properties.firstname} ${properties.lastname}`
        : properties.firstname || properties.lastname || undefined,
      team: team || undefined,
      teamId: teamId || undefined
    }
  } catch (error) {
    console.error('Error looking up HubSpot contact:', error)
    return null
  }
}

/**
 * Get contact by ID
 */
export async function getContactById(contactId: string): Promise<HubSpotContact | null> {
  try {
    const contact = await hubspotClient.crm.contacts.basicApi.getById(contactId, [
      'email',
      'firstname',
      'lastname',
      'hs_team',
      'team',
      'department',
      'business_unit',
      'hs_team_id',
      'team_id'
    ])

    const properties = contact.properties

    const team = properties.hs_team || properties.team || properties.department || properties.business_unit
    const teamId = properties.hs_team_id || properties.team_id

    return {
      id: contact.id,
      email: properties.email || '',
      firstName: properties.firstname || undefined,
      lastName: properties.lastname || undefined,
      fullName: properties.firstname && properties.lastname
        ? `${properties.firstname} ${properties.lastname}`
        : properties.firstname || properties.lastname || undefined,
      team: team || undefined,
      teamId: teamId || undefined
    }
  } catch (error) {
    console.error('Error fetching HubSpot contact:', error)
    return null
  }
}
