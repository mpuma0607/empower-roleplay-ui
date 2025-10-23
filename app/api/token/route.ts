export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(request: NextRequest) {
  try {
    console.log('Token API called')
    const { roomName, participantName } = await request.json()
    console.log('Request data:', { roomName, participantName })

    if (!roomName || !participantName) {
      console.log('Missing room name or participant name')
      return NextResponse.json(
        { error: 'Room name and participant name are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL

    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasUrl: !!livekitUrl,
      url: livekitUrl,
      apiKeyValue: apiKey,
      apiSecretValue: apiSecret,
      livekitUrlValue: livekitUrl
    })

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.log('Missing environment variables')
      return NextResponse.json(
        { error: 'LiveKit configuration missing' },
        { status: 500 }
      )
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    })

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    const jwt = await token.toJwt()
    console.log('Generated JWT:', jwt)
    console.log('JWT length:', jwt.length)
    return NextResponse.json({ token: jwt, url: livekitUrl })
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
