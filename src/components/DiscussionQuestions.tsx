'use client'

import { useState, useCallback } from 'react'

function SpoilerSpan({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`cursor-pointer rounded px-1 transition-colors ${
        revealed
          ? 'bg-gray-100 text-gray-700'
          : 'bg-gray-800 text-gray-800 hover:bg-gray-700 select-none'
      }`}
      title={revealed ? 'Click to hide spoiler' : 'Click to reveal spoiler'}
    >
      {revealed ? text : 'SPOILER'}
    </span>
  )
}

function QuestionText({ text }: { text: string }) {
  // Split on [...] brackets, rendering bracket contents as spoilers
  const parts = text.split(/(\[[^\]]*\])/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const inner = part.slice(1, -1)
          return <SpoilerSpan key={i} text={inner} />
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

interface Question {
  id: string
  question: string
  sortOrder: number
  userId?: string | null
  user?: { id: string; name: string } | null
}

interface DiscussionQuestionsProps {
  bookId: string
  questions: Question[]
  isAdmin: boolean
  currentUserId?: string
  onUpdate: () => void
}

export function DiscussionQuestions({
  bookId,
  questions,
  isAdmin,
  currentUserId,
  onUpdate
}: DiscussionQuestionsProps) {
  const [newQuestion, setNewQuestion] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [reorderedQuestions, setReorderedQuestions] = useState<Question[]>([])
  const [savingReorder, setSavingReorder] = useState(false)

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/books/${bookId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion })
      })

      if (response.ok) {
        setNewQuestion('')
        onUpdate()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuestion = async (id: string) => {
    if (!editText.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editText })
      })

      if (response.ok) {
        setEditingId(null)
        setEditText('')
        onUpdate()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onUpdate()
      }
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (question: Question) => {
    setEditingId(question.id)
    setEditText(question.question)
  }

  const canModify = (q: Question) => {
    return isAdmin || (currentUserId && q.userId === currentUserId)
  }

  const startReordering = useCallback(() => {
    setReorderedQuestions([...questions])
    setIsReordering(true)
  }, [questions])

  const cancelReordering = useCallback(() => {
    setIsReordering(false)
    setReorderedQuestions([])
  }, [])

  const moveQuestion = useCallback((index: number, direction: 'up' | 'down') => {
    setReorderedQuestions(prev => {
      const newOrder = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      return newOrder
    })
  }, [])

  const saveReorder = async () => {
    setSavingReorder(true)
    try {
      const response = await fetch(`/api/books/${bookId}/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: reorderedQuestions.map(q => q.id) })
      })

      if (response.ok) {
        setIsReordering(false)
        setReorderedQuestions([])
        onUpdate()
      }
    } finally {
      setSavingReorder(false)
    }
  }

  const displayQuestions = isReordering ? reorderedQuestions : questions

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Discussion Questions</h2>
        {isAdmin && questions.length > 1 && !isReordering && (
          <button
            onClick={startReordering}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Reorder
          </button>
        )}
        {isReordering && (
          <div className="flex gap-2">
            <button
              onClick={saveReorder}
              disabled={savingReorder}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingReorder ? 'Saving...' : 'Save Order'}
            </button>
            <button
              onClick={cancelReordering}
              disabled={savingReorder}
              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {displayQuestions.length === 0 ? (
        <p className="text-gray-500 text-sm">No discussion questions yet.</p>
      ) : (
        <ol className="space-y-3 mb-4">
          {displayQuestions.map((q, index) => (
            <li key={q.id} className="flex items-start gap-3">
              {isReordering && (
                <div className="flex-shrink-0 flex flex-col gap-0.5">
                  <button
                    onClick={() => moveQuestion(index, 'up')}
                    disabled={index === 0 || savingReorder}
                    className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveQuestion(index, 'down')}
                    disabled={index === displayQuestions.length - 1 || savingReorder}
                    className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              {editingId === q.id && !isReordering ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleUpdateQuestion(q.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-start justify-between gap-2">
                  <p className="text-gray-700">
                    {q.user ? (
                      <><span className="font-medium">{q.user.name}:</span> <QuestionText text={q.question} /></>
                    ) : (
                      <QuestionText text={q.question} />
                    )}
                  </p>
                  {canModify(q) && !isReordering && (
                    <div className="flex-shrink-0 flex gap-1">
                      <button
                        onClick={() => startEditing(q)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-gray-400 hover:text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 mb-2">
          Tip: Wrap text in [square brackets] to hide it as a spoiler.
        </p>
      </div>
      <form onSubmit={handleAddQuestion} className="flex gap-2">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Add a discussion question..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !newQuestion.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>
    </div>
  )
}
