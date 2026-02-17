'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const supabase = createClient()

  useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('status_channel')

    channel
      .on('system', {}, (payload) => {
        if (payload.status === 'SUBSCRIBED') {
          setStatus('connected')
        }
      })
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (s === 'CLOSED') {
          setStatus('disconnected')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      pulse: true,
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'Disconnected',
      pulse: false,
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      pulse: true,
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className={`h-2 w-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span>{config.text}</span>
    </div>
  )
}