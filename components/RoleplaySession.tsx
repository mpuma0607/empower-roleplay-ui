'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Square, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { SessionData } from '@/app/page'
import { LiveKitRoom } from '@livekit/components-react'
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client'
import { RealTimeScoring } from './RealTimeScoring'
import { TranscriptDisplay } from './TranscriptDisplay'
import { SessionControls } from './SessionControls'

interface RoleplaySessionProps {
  session: SessionData
  onEndSession: (session: SessionData) => void
  onUpdateSession: (session: SessionData) => void
}

export function RoleplaySession({ session, onEndSession, onUpdateSession }: RoleplaySessionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isClientMuted, setIsClientMuted] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState<SessionData['transcript']>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isClientSpeaking, setIsClientSpeaking] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  
  const roomRef = useRef<Room | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // LiveKit connection details - we'll get these from the token API

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

  const connectToRoom = async () => {
    console.log('CONNECT BUTTON CLICKED!')
    alert('CONNECT BUTTON CLICKED!')
    try {
      console.log('Attempting to connect to room...')
      console.log('Current URL:', window.location.href)
      console.log('About to make fetch request...')
      
      // First, get a token from our API
      console.log('About to call token API...')
      const tokenResponse = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: 'roleplay-session',
          participantName: 'agent'
        })
      })

      console.log('Token response status:', tokenResponse.status)
      console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()))

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token API error:', errorText)
        alert(`Token API Error: ${errorText}`)
        throw new Error(`Failed to get token: ${errorText}`)
      }

      const responseData = await tokenResponse.json()
      console.log('Token API response:', responseData)
      
      const { token, url } = responseData
      console.log('Got token, connecting to:', url)
      console.log('Token length:', token ? token.length : 'undefined')

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [],
        },
      })

      newRoom.on(RoomEvent.Connected, () => {
        console.log('Connected to room')
        setIsConnected(true)
      })

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room')
        setIsConnected(false)
      })

      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity)
      })

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === 'audio') {
          const audioElement = track.attach()
          audioElement.play()
        }
      })

      // Connect to the room with the token
      await newRoom.connect(url, token)
      setRoom(newRoom)
      roomRef.current = newRoom
    } catch (error) {
      console.error('Failed to connect to room:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Connection failed: ${errorMessage}`)
    }
  }

  const disconnectFromRoom = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect()
      setRoom(null)
      roomRef.current = null
      setIsConnected(false)
    }
  }

  const toggleMute = async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleClientMute = () => {
    setIsClientMuted(!isClientMuted)
    // In a real implementation, you'd control the client's audio here
  }

  const endSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    disconnectFromRoom()
    
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

  return (
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected to AI Client' : 'Connecting...'}
                </span>
              </div>
              {!isConnected && (
                <button
                  onClick={connectToRoom}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
                >
                  Connect
                </button>
              )}
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
  )
}
