'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { RadarDataPoint } from '@/lib/types'

interface Props {
  data: RadarDataPoint[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-bg-overlay border border-white/[0.08] rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-text-secondary">{payload[0].payload.category}</p>
        <p className="text-gold font-mono font-bold">{payload[0].value.toFixed(1)}</p>
      </div>
    )
  }
  return null
}

export function RiskRadarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
        />
        <Radar
          name="Risk"
          dataKey="score"
          stroke="#E8C547"
          fill="#E8C547"
          fillOpacity={0.15}
          strokeWidth={1.5}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
