'use client'

import { useState } from 'react'
import type { Bookmark } from '@/lib/types'
import toast from 'react-hot-toast'

interface BookmarkCardProps {
  bookmark: Bookmark
  onDelete: (id: string) => void
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return
    }

    setDeleting(true)
    await onDelete(bookmark.id)
    setDeleting(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmark.url)
    toast.success('URL copied to clipboard!')
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  const favicon = getFavicon(bookmark.url)

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-5 flex flex-col border border-gray-100 hover:border-blue-200">
      <div className="flex-1">
        <div className="flex items-start gap-3">
          {favicon && (
            <img
              src={favicon}
              alt=""
              className="w-8 h-8 rounded mt-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {bookmark.title}
              </h3>
            </a>
          </div>
        </div>
        
        <p className="mt-2 text-sm text-gray-500 truncate">
          {getDomain(bookmark.url)}
        </p>
        
        <p className="mt-1 text-xs text-gray-400">
          Added {new Date(bookmark.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Visit
        </a>
        
        <button
          onClick={handleCopy}
          className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          title="Copy URL"
        >
          📋
        </button>
        
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 text-sm font-medium"
          title="Delete"
        >
          {deleting ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  )
}