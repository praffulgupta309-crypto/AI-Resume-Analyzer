import React, { useState } from 'react'
import { Award, Check, Copy, X, Sparkles, MessageCircle, HelpCircle, ShieldAlert, CheckCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function InterviewPrepModal({
  isOpen,
  onClose,
  analysisId,
}) {
  const [loading, setLoading] = useState(false)
  const [prepData, setPrepData] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('behavioral')

  if (!isOpen) return null

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch(`${API_BASE}/api/interview-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
        }),
      })

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.detail || `Request failed with status ${resp.status}`)
      }

      const data = await resp.json()
      setPrepData(data)
    } catch (err) {
      setError(err.message || 'Failed to generate interview prep kit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Targeted Interview Preparation Kit</h3>
              <p className="text-xs text-slate-400">Behavioral STAR questions, tech scenarios & gap reframing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!prepData ? (
            <div className="text-center py-12 space-y-4">
              <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 inline-block">
                <Sparkles className="h-8 w-8 mx-auto" />
              </div>
              <h4 className="text-base font-bold text-white">Generate Your Personalized Interview Blueprint</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Gemini will cross-reference your specific resume achievements with the role requirements to predict the highest-probability interview questions and formulate winning answers.
              </p>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="py-3 px-6 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 inline-flex items-center space-x-2 transition shadow-lg shadow-violet-600/30"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Generating Interview Kit with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4" />
                    <span>Generate Interview Prep Kit</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Role Summary */}
              <div className="p-4 bg-violet-950/30 border border-violet-500/30 rounded-2xl">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">
                  Role Scrutiny & Candidate Fit
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {prepData.role_summary}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 space-x-4">
                {[
                  { id: 'behavioral', label: 'STAR Behavioral (3)' },
                  { id: 'technical', label: 'Technical Scenarios (3)' },
                  { id: 'gaps', label: 'Gap Mitigation (2)' },
                  { id: 'questions', label: 'Questions to Ask (3)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`pb-3 text-xs font-semibold transition border-b-2 ${
                      activeTab === t.id
                        ? 'border-violet-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === 'behavioral' && (
                <div className="space-y-3">
                  {prepData.behavioral_questions?.map((q, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                          {q.focus_competency}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Q{idx + 1}</span>
                      </div>
                      <p className="text-xs font-bold text-white">"{q.question}"</p>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                        <span className="font-semibold text-violet-400 block mb-0.5">STAR Framework Guidance:</span>
                        {q.star_guidance}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-3">
                  {prepData.technical_questions?.map((q, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          Target: {q.skill_targeted}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Q{idx + 1}</span>
                      </div>
                      <p className="text-xs font-bold text-white">"{q.question}"</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1 py-0.5">Key points:</span>
                        {q.key_points_to_mention?.map((pt, pidx) => (
                          <span key={pidx} className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-200">
                            {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'gaps' && (
                <div className="space-y-3">
                  {prepData.gap_mitigation_questions?.map((q, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/60 border border-rose-500/20 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Potential Gap: {q.potential_concern}</span>
                      </div>
                      <p className="text-xs font-bold text-white">How interviewer probes: "{q.question}"</p>
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 leading-relaxed">
                        <span className="font-semibold text-emerald-400 block mb-0.5">Winning Reframe Strategy:</span>
                        {q.recommended_strategy}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 mb-2">
                    Stand out by asking thoughtful questions that showcase seniority and strategic thinking:
                  </p>
                  {prepData.questions_to_ask_employer?.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl flex items-start space-x-2.5">
                      <span className="text-violet-400 font-mono font-bold text-xs mt-0.5">#{idx + 1}</span>
                      <p className="text-xs text-slate-200 leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

