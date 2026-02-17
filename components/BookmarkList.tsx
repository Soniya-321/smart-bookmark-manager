'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark } from '@/lib/types'
import BookmarkCard from './BookmarkCard'
import toast from 'react-hot-toast'

// ✅ FIX #1: Create Supabase client OUTSIDE the component (module-level singleton)
// BUG WAS: const supabase = createClient() was INSIDE the component
// This caused a brand new client object on every render → React saw it as
// a changed dependency → useEffect re-ran → infinite subscribe/unsubscribe loop
// → WebSocket never stayed connected long enough to receive events
const supabase = createClient()

interface BookmarkListProps {
  initialBookmarks: Bookmark[]
  userId: string
}

export default function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)

  useEffect(() => {
    // ✅ FIX #2: Use a UNIQUE channel name per user
    // BUG WAS: .channel('bookmarks_channel') — same name for ALL users and ALL tabs
    // When Tab A and Tab B both subscribe to the same channel name,
    // Supabase treats them as the same channel → only one gets events
    const channel = supabase
      .channel(`bookmarks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Event received:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            const newBookmark = payload.new as Bookmark
            setBookmarks((current) => {
              // Guard: prevent duplicate entries if optimistic update was used
              const alreadyExists = current.find((b) => b.id === newBookmark.id)
              if (alreadyExists) return current
              return [newBookmark, ...current]
            })
          }

          if (payload.eventType === 'DELETE') {
            // payload.old only has id by default (unless REPLICA IDENTITY FULL is set)
            setBookmarks((current) =>
              current.filter((b) => b.id !== payload.old.id)
            )
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Bookmark
            setBookmarks((current) =>
              current.map((b) => (b.id === updated.id ? updated : b))
            )
          }
        }
      )
      .subscribe((status, err) => {
        // ✅ Log connection status so you can verify in console
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Connected - live updates active')
        }
        if (status === 'CLOSED') {
          console.log('[Realtime] ❌ Connection closed')
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error:', err)
        }
        if (status === 'TIMED_OUT') {
          console.warn('[Realtime] Connection timed out, retrying...')
        }
      })

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }

    // ✅ FIX #3: Remove `supabase` from the dependency array
    // BUG WAS: }, [userId, supabase])
    // Since supabase was created inside the component, it was a NEW object
    // reference every render → React triggered useEffect every render →
    // constant subscribe/unsubscribe → events never received
    // NOW: Only re-subscribe if userId changes (i.e. different user logs in)
  }, [userId])

  const handleDelete = async (id: string) => {
    const loadingToast = toast.loading('Deleting...')

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)

    toast.dismiss(loadingToast)

    if (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete bookmark')
      return
    }

    toast.success('Bookmark deleted')
    // ✅ Don't manually update state — realtime will fire DELETE event
    // and update all tabs including this one automatically
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-md">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <h3 className="mt-3 text-sm font-semibold text-gray-900">No bookmarks yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first bookmark above.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Live connection badge */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Live updates active — changes sync instantly across all tabs
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}