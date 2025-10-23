'use client'

import { useState } from 'react'
import { Play, Clock, Users, Target, TrendingUp } from 'lucide-react'
import { SessionData } from '@/app/page'

interface SessionSetupProps {
  onStartSession: (scenario: string, clientType: string) => void
  sessionHistory: SessionData[]
}

// Simplified - no scenario selection needed

export function SessionSetup({ onStartSession, sessionHistory }: SessionSetupProps) {
  const handleStartSession = () => {
    onStartSession('Roleplay Practice', 'AI Client')
  }

  const recentSessions = sessionHistory.slice(0, 3)
  const averageScore = sessionHistory.length > 0 
    ? Math.round(sessionHistory.reduce((sum, session) => sum + session.scores.overall, 0) / sessionHistory.length)
    : 0

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Start Roleplay Practice</h2>
        <p className="text-gray-600">Click start and tell the AI what you want to practice. The AI will take on that role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Simple Start Button */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary-600" />
              Ready to Practice?
            </h3>
            <p className="text-gray-600 mb-6">Just click start and begin talking. Tell the AI what type of client or scenario you want to practice with.</p>
            
            <button
              onClick={handleStartSession}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center space-x-2 text-lg"
            >
              <Play className="h-6 w-6" />
              <span>Start Roleplay Session</span>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Start Session Button */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Ready to Practice?</h3>
            <button
              onClick={handleStartSession}
              disabled={!selectedScenario && !customScenario}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Start Session</span>
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Session will be recorded and analyzed
            </p>
          </div>

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{session.scenario}</p>
                      <p className="text-xs text-gray-500">{session.clientType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{session.scores.overall}%</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.startTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Stats */}
          {sessionHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Your Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-sm font-medium">{averageScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="text-sm font-medium">{sessionHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Best Score</span>
                  <span className="text-sm font-medium">
                    {Math.max(...sessionHistory.map(s => s.scores.overall))}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
