import { NextRequest, NextResponse } from 'next/server'
import { lookupContactByEmail } from '@/lib/hubspot/contacts'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Lookup user in HubSpot
    const hubspotContact = await lookupContactByEmail(email)

    // Check if user exists in our database
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    let user
    if (existingUser) {
      // Update user with latest HubSpot info
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          name: name || hubspotContact?.fullName || existingUser.name,
          hubspot_contact_id: hubspotContact?.id || existingUser.hubspot_contact_id,
          hubspot_team: hubspotContact?.team || existingUser.hubspot_team,
          hubspot_team_id: hubspotContact?.teamId || existingUser.hubspot_team_id,
          last_login: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      user = updatedUser
    } else {
      // Create new user
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          email,
          name: name || hubspotContact?.fullName,
          hubspot_contact_id: hubspotContact?.id,
          hubspot_team: hubspotContact?.team,
          hubspot_team_id: hubspotContact?.teamId,
          last_login: new Date().toISOString()
        })
        .select()
        .single()

      user = newUser
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create or update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hubspot_contact_id: user.hubspot_contact_id,
        hubspot_team: user.hubspot_team,
        hubspot_team_id: user.hubspot_team_id
      }
    })
  } catch (error) {
    console.error('Error in identify route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

