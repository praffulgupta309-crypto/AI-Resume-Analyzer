import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, Search, Copy, Check } from 'lucide-react'

export default function SkillsChips({ matchedSkills = [], missingKeywords = [] }) {
  const [filter, setFilter] = useState('')
  const [copiedType, setCopiedType] = useState(null)

  const filteredMatched = matchedSkills.filter(s =>
    s.toLowerCase().includes(filter.toLowerCase())
  )
  const filteredMissing = missingKeywords.filter(s =>
    s.toLowerCase().includes(filter.toLowerCase())
  )

  const copyToClipboard = (skills, type) => {
    navigator.clipboard.writeText(skills.join(', '))
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      {(matchedSkills.length > 5 || missingKeywords.length > 5) && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords or skills..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Skills Panel */}
        <div className="p-5 bg-slate-800/60 rounded-2xl border border-emerald-500/20 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Matched Skills</h3>
                <p className="text-xs text-slate-400">Found in resume & job spec</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                {matchedSkills.length}
              </span>
              {matchedSkills.length > 0 && (
                <button
                  onClick={() => copyToClipboard(matchedSkills, 'matched')}
                  title="Copy matched skills"
                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded transition"
                >
                  {copiedType === 'matched' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredMatched.length > 0 ? (
              filteredMatched.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 transition"
                >
                  <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400"></span>
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic py-2">
                {filter ? 'No matching skills found' : 'No matched skills detected'}
              </span>
            )}
          </div>
        </div>

        {/* Missing Keywords Panel */}
        <div className="p-5 bg-slate-800/60 rounded-2xl border border-rose-500/20 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Missing Keywords</h3>
                <p className="text-xs text-slate-400">High priority requirements absent</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300">
                {missingKeywords.length}
              </span>
              {missingKeywords.length > 0 && (
                <button
                  onClick={() => copyToClipboard(missingKeywords, 'missing')}
                  title="Copy missing keywords"
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded transition"
                >
                  {copiedType === 'missing' ? <Check className="h-3.5 w-3.5 text-rose-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredMissing.length > 0 ? (
              filteredMissing.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:border-rose-400/60 transition"
                >
                  <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400"></span>
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic py-2">
                {filter ? 'No matching missing keywords' : 'No missing keywords identified! Excellent coverage.'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
