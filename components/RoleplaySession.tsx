'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { Mic, MicOff, Square, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { SessionData } from '@/app/page'
import { LiveKitRoom } from '@livekit/components-react'
import { RealTimeScoring } from './RealTimeScoring'
import { TranscriptDisplay } from './TranscriptDisplay'
import { SessionControls } from './SessionControls'

interface RoleplaySessionProps {
  session: SessionData
  onEndSession: (session: SessionData) => void
  onUpdateSession: (session: SessionData) => void
}

export function RoleplaySession({ session, onEndSession, onUpdateSession }: RoleplaySessionProps) {
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isClientMuted, setIsClientMuted] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState<SessionData['transcript']>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isClientSpeaking, setIsClientSpeaking] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // unique identity per session to avoid "identity already exists"
  const identity = useMemo(
    () => `agent-${Math.random().toString(36).slice(2, 8)}`,
    []
  )

  useEffect(() => {
    // Start session timer
    intervalRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setErr(null)
        setConn(null)
        const r = await fetch('/api/token', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: 'roleplay-session', participantName: identity }),
        })
        const data = await r.json() // parse ONCE
        console.log('lk api result', {
          tokenPrefix: data?.token?.slice(0, 20),
          url: data?.url,
        })
        if (!r.ok) throw new Error(data?.error || `token api ${r.status}`)
        if (!data?.token || !data?.url) throw new Error('Empty token/url from API')
        if (cancelled) return
        setConn({ token: data.token, url: data.url })
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'Failed to fetch token')
        console.error('token fetch failed', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [identity])

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // In a real implementation, you'd control the microphone here
  }

  const toggleClientMute = () => {
    setIsClientMuted(!isClientMuted)
    // In a real implementation, you'd control the client's audio here
  }

  const endSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    const finalSession = {
      ...session,
      transcript: currentTranscript,
      endTime: new Date()
    }
    
    onEndSession(finalSession)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const addTranscriptEntry = (speaker: 'agent' | 'client', text: string, confidence?: number) => {
    const newEntry = {
      speaker,
      text,
      timestamp: Date.now(),
      confidence
    }
    
    const updatedTranscript = [...currentTranscript, newEntry]
    setCurrentTranscript(updatedTranscript)
    
    // Update the session with new transcript
    const updatedSession = {
      ...session,
      transcript: updatedTranscript
    }
    onUpdateSession(updatedSession)
  }

  // Simulate real-time transcription (in a real app, this would come from LiveKit)
  useEffect(() => {
    if (isConnected) {
      // This is a simulation - in reality, you'd get this from LiveKit's transcription events
      const simulateTranscription = () => {
        // Simulate agent speaking
        if (Math.random() > 0.7) {
          addTranscriptEntry('agent', 'How can I help you find your perfect home today?')
        }
        // Simulate client speaking
        if (Math.random() > 0.8) {
          addTranscriptEntry('client', 'I\'m looking for a 3-bedroom house in the downtown area.')
        }
      }

      const interval = setInterval(simulateTranscription, 5000)
      return () => clearInterval(interval)
    }
  }, [isConnected, currentTranscript])

  // SAFETY: never render LiveKitRoom with empty token/url
  if (err) return <div className="p-4 text-red-600">Connection error: {err}</div>
  if (!conn) return <div className="p-4 text-gray-500">Preparing connection…</div>

  return (
    <LiveKitRoom
      token={conn.token}
      serverUrl={conn.url}
      connect
      audio
      video={false}
      onConnected={() => {
        console.log('Connected to LiveKit room')
        setIsConnected(true)
      }}
      onDisconnected={() => {
        console.log('Disconnected from LiveKit room')
        setIsConnected(false)
      }}
      onError={(e) => console.error('LiveKit error', e)}
      className="h-full w-full"
    >
      <div className="max-w-7xl mx-auto">
        {/* Session Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{session.scenario}</h2>
              <p className="text-gray-600">Client Type: {session.clientType}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Session Time</p>
                <p className="text-2xl font-mono font-bold text-primary-600">
                  {formatTime(sessionTime)}
                </p>
              </div>
              <button
                onClick={endSession}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Square className="h-4 w-4" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected to AI Client' : 'Connecting...'}
                </span>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Audio Controls</h3>
              <div className="flex items-center space-x-6">
                <button
                  onClick={toggleMute}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isMuted 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'} Microphone</span>
                </button>
                
                <button
                  onClick={toggleClientMute}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isClientMuted 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isClientMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  <span>{isClientMuted ? 'Unmute' : 'Mute'} Client</span>
                </button>
              </div>
            </div>

            {/* Real-time Transcript */}
            <TranscriptDisplay 
              transcript={currentTranscript}
              isSpeaking={isSpeaking}
              isClientSpeaking={isClientSpeaking}
            />
          </div>

          {/* Sidebar with Real-time Scoring */}
          <div className="space-y-6">
            <RealTimeScoring 
              session={session}
              transcript={currentTranscript}
              onUpdateScores={(scores) => {
                const updatedSession = { ...session, scores }
                onUpdateSession(updatedSession)
              }}
            />
            
            <SessionControls 
              session={session}
              onEndSession={endSession}
              onRestart={() => {
                setCurrentTranscript([])
                setSessionTime(0)
              }}
            />
          </div>
        </div>
      </div>
    </LiveKitRoom>
  )
}
