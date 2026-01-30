'use client'

import { useState } from 'react'

interface RatingStarsProps {
  rating: number
  onRate?: (rating: number) => void
  size?: 'small' | 'medium' | 'large'
  readonly?: boolean
}

export function RatingStars({
  rating,
  onRate,
  size = 'medium',
  readonly = false
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const starSizes = {
    small: { width: 20, height: 20 },
    medium: { width: 28, height: 28 },
    large: { width: 36, height: 36 }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (readonly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    setHoverRating(starIndex + (isLeftHalf ? 0.5 : 1))
  }

  const handleStarClick = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (readonly || !onRate) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    onRate(starIndex + (isLeftHalf ? 0.5 : 1))
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starIndex = i
        const fillAmount = Math.max(0, Math.min(1, displayRating - starIndex))

        return (
          <button
            key={i}
            type="button"
            onClick={(e) => handleStarClick(e, starIndex)}
            onMouseMove={(e) => handleMouseMove(e, starIndex)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly}
            className={`${!readonly ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} relative`}
            style={starSizes[size]}
          >
            {/* Background (empty) star */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="absolute inset-0 text-gray-300"
              style={starSizes[size]}
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="currentColor"
              />
            </svg>
            {/* Filled portion */}
            {fillAmount > 0 && (
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 text-yellow-400"
                style={{
                  ...starSizes[size],
                  clipPath: `inset(0 ${(1 - fillAmount) * 100}% 0 0)`
                }}
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
