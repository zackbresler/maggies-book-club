'use client'

import { useEffect, useState, useRef } from 'react'

interface BookNotesProps {
  bookId: string
}

export function BookNotes({ bookId }: BookNotesProps) {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/books/${bookId}/notes`)
        if (response.ok) {
          const data = await response.json()
          const noteContent = data.note?.content || ''
          setContent(noteContent)
          setSavedContent(noteContent)
          if (noteContent) setExpanded(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchNote()
  }, [bookId])

  const handleSave = async () => {
    const currentHtml = editorRef.current?.innerHTML || ''
    setSaving(true)
    try {
      const response = await fetch(`/api/books/${bookId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentHtml })
      })
      if (response.ok) {
        const data = await response.json()
        const noteContent = data.note?.content || ''
        setSavedContent(noteContent)
        setContent(noteContent)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const startEditing = () => {
    setEditing(true)
    // Set editor content after it renders
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = content
        editorRef.current.focus()
      }
    })
  }

  const cancelEditing = () => {
    setEditing(false)
  }

  return (
    <div className="parchment-card rounded-lg p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-xl font-display text-burgundy-700">My Notes</h2>
        <span className="text-burgundy-400 text-sm">
          {expanded ? '− Collapse' : '+ Expand'}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-burgundy-400 text-sm">Loading...</p>
          ) : editing ? (
            <>
              <div className="flex gap-1 flex-wrap border-b border-burgundy-200 pb-2">
                <button
                  type="button"
                  onClick={() => execCmd('bold')}
                  className="px-2 py-1 border border-burgundy-300 rounded text-sm font-bold text-burgundy-700 hover:bg-burgundy-50"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('italic')}
                  className="px-2 py-1 border border-burgundy-300 rounded text-sm italic text-burgundy-700 hover:bg-burgundy-50"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('underline')}
                  className="px-2 py-1 border border-burgundy-300 rounded text-sm underline text-burgundy-700 hover:bg-burgundy-50"
                  title="Underline"
                >
                  U
                </button>
                <div className="w-px bg-burgundy-200 mx-1" />
                <button
                  type="button"
                  onClick={() => execCmd('insertUnorderedList')}
                  className="px-2 py-1 border border-burgundy-300 rounded text-sm text-burgundy-700 hover:bg-burgundy-50"
                  title="Bullet list"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('insertOrderedList')}
                  className="px-2 py-1 border border-burgundy-300 rounded text-sm text-burgundy-700 hover:bg-burgundy-50"
                  title="Numbered list"
                >
                  1. List
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[120px] px-3 py-2 border border-burgundy-300 rounded-md bg-cream focus:outline-none focus:ring-2 focus:ring-burgundy-500 text-burgundy-700 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-burgundy-600 text-white rounded-md hover:bg-burgundy-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 border border-burgundy-300 text-burgundy-600 rounded-md hover:bg-burgundy-50 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                onClick={startEditing}
                className="min-h-[80px] px-3 py-2 border border-burgundy-200 rounded-md bg-cream-50 text-burgundy-700 text-sm leading-relaxed cursor-pointer hover:border-burgundy-300 transition-colors [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
              >
                {content ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <p className="text-burgundy-300 italic">Click to add notes...</p>
                )}
              </div>
              {savedContent && (
                <span className="text-sm text-burgundy-400">Saved</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
