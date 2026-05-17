'use client'

import { motion, useSpring, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface Props {
  score: number // 0-100
  size?: number
}

const RADIUS = 80
const STROKE = 12
const GAP = 20 // degrees to cut at bottom

function scoreToColor(score: number): string {
  if (score > 70) return '#FF4444'
  if (score > 30) return '#FF8C00'
  return '#00D084'
}

function scoreToAngle(score: number): number {
  // Maps 0-100 to 0-180 degrees (semicircle)
  return (score / 100) * 180
}

export function RiskScoreGauge({ score, size = 200 }: Props) {
  const circumference = Math.PI * RADIUS
  const offset = circumference - (score / 100) * circumference
  const color = scoreToColor(score)

  const label = score > 70 ? 'HIGH RISK' : score > 30 ? 'MODERATE' : 'LOW RISK'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
        <svg
          width={size}
          height={size / 2 + STROKE}
          viewBox={`-${STROKE / 2} -${STROKE / 2} ${RADIUS * 2 + STROKE} ${RADIUS + STROKE}`}
          className="overflow-visible"
        >
          {/* Track */}
          <path
            d={`M ${STROKE / 2} ${RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS * 2 - STROKE / 2} ${RADIUS}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Colored arc */}
          <motion.path
            d={`M ${STROKE / 2} ${RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS * 2 - STROKE / 2} ${RADIUS}`}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />

          {/* Needle dot */}
          {(() => {
            const angleRad = ((score / 100) * 180 * Math.PI) / 180
            const nx = STROKE / 2 + RADIUS - Math.cos(Math.PI - angleRad) * RADIUS
            const ny = RADIUS - Math.sin(Math.PI - angleRad) * RADIUS
            return (
              <motion.circle
                cx={nx}
                cy={ny}
                r={6}
                fill={color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            )
          })()}
        </svg>

        {/* Score text */}
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-4xl font-mono font-bold" style={{ color }}>
              {score.toFixed(0)}
            </div>
            <div className="text-xs font-mono text-text-muted mt-0.5">/ 100</div>
            <div className="text-xs font-medium tracking-widest mt-1" style={{ color }}>
              {label}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
