import React from 'react'

export default function ScoreGauge({ score = 0 }) {
  const radius = 64
  const strokeWidth = 10
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  let scoreColor = '#10b981' // emerald
  let scoreBadge = 'High ATS Match'
  let scoreDesc = 'Your resume aligns strongly with key job requirements.'
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'

  if (score < 60) {
    scoreColor = '#f43f5e' // rose
    scoreBadge = 'Critical Gaps Found'
    scoreDesc = 'Significant keyword and skill misalignment detected.'
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  } else if (score < 80) {
    scoreColor = '#f59e0b' // amber
    scoreBadge = 'Moderate Match'
    scoreDesc = 'Good alignment, but several core keywords are missing.'
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60 backdrop-blur shadow-xl">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 transition-all duration-1000 ease-out"
        >
          {/* Background circle */}
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Score circle */}
          <circle
            stroke={scoreColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {score}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            out of 100
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
          {scoreBadge}
        </span>
        <p className="mt-2 text-xs text-slate-400 max-w-xs">
          {scoreDesc}
        </p>
      </div>
    </div>
  )
}
