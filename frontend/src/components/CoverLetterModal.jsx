import React, { useState } from 'react'
import { FileText, Copy, Check, X, Sparkles, Send } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function CoverLetterModal({
  isOpen,
  onClose,
  analysisId,
  jobDescription,
}) {
  const [tone, setTone] = useState('executive')
  const [companyName, setCompanyName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch(`${API_BASE}/api/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          company_name: companyName.trim() || undefined,
          recipient_name: recipientName.trim() || undefined,
          tone,
        }),
      })

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.detail || `Request failed with status ${resp.status}`)
      }

      const data = await resp.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result?.cover_letter) return
    navigator.clipboard.writeText(result.cover_letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Tailored Cover Letter</h3>
              <p className="text-xs text-slate-400">Grounded in your resume background and the target role</p>
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

          {!result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Stripe, OpenAI"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hiring Manager / Recruiter Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering Hiring Team"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tone & Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'executive', label: 'Executive', desc: 'Strategic & High Impact' },
                    { id: 'professional', label: 'Professional', desc: 'Balanced & Standard' },
                    { id: 'technical', label: 'Technical', desc: 'Deep Engineering Focus' },
                    { id: 'conversational', label: 'Conversational', desc: 'Warm & Authentic' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        tone === t.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <p className="text-xs font-bold capitalize">{t.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 px-5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/30"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Drafting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Tailored Cover Letter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Highlights */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  Spotlighted Strengths
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.key_strengths_highlighted?.map((s, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subject Line */}
              {result.subject_line && (
                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Suggested Subject
                  </span>
                  <p className="text-xs font-semibold text-slate-200">{result.subject_line}</p>
                </div>
              )}

              {/* Cover Letter Text */}
              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl whitespace-pre-line text-xs text-slate-200 leading-relaxed font-sans max-h-96 overflow-y-auto">
                {result.cover_letter}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Regenerate with different settings
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Cover Letter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

