import React, { useState } from 'react'
import { Sparkles, Copy, Check, Quote } from 'lucide-react'

export default function ImprovedBullets({ bullets = [] }) {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const copyBullet = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(bullets.map(b => `• ${b}`).join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  if (!bullets || bullets.length === 0) return null

  return (
    <div className="p-6 bg-slate-800/60 rounded-2xl border border-indigo-500/20 backdrop-blur shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              High-Impact Rewritten Bullets
            </h3>
            <p className="text-xs text-slate-400">
              Engineered using the Google XYZ Formula: Accomplished [X], measured by [Y], by doing [Z]
            </p>
          </div>
        </div>

        <button
          onClick={copyAll}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition"
        >
          {copiedAll ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">All Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy All</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {bullets.map((bullet, idx) => {
          const isCopied = copiedIndex === idx
          return (
            <div
              key={idx}
              className="group relative p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-indigo-500/40 transition flex items-start space-x-3"
            >
              <span className="mt-1 flex-shrink-0 text-indigo-400/80">
                <Quote className="h-4 w-4" />
              </span>
              <p className="flex-1 text-xs text-slate-200 leading-relaxed font-normal">
                {bullet}
              </p>
              <button
                onClick={() => copyBullet(bullet, idx)}
                title="Copy bullet"
                className="opacity-70 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                {isCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
