import React, { useState, useEffect } from 'react'
import {
  FileText,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'

import HistorySidebar from './components/HistorySidebar'
import UploadSection from './components/UploadSection'
import ScoreGauge from './components/ScoreGauge'
import SkillsChips from './components/SkillsChips'
import SectionFeedback from './components/SectionFeedback'
import ImprovedBullets from './components/ImprovedBullets'

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function App() {
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [activeScan, setActiveScan] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [backendOnline, setBackendOnline] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // 1. Fetch scan history and check backend health on mount
  useEffect(() => {
    fetchHistory()
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`)
      if (res.ok) {
        setBackendOnline(true)
      } else {
        setBackendOnline(false)
      }
    } catch {
      setBackendOnline(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/history`)
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      setHistory(data)
      setBackendOnline(true)
    } catch (err) {
      console.error('History fetch error:', err)
      setBackendOnline(false)
    } finally {
      setHistoryLoading(false)
    }
  }

  // 2. Handle Resume Analysis Upload
  const handleAnalyze = async (file, jobDescription) => {
    setAnalyzing(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_description', jobDescription)

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Analysis request failed.')
      }

      // Successful analysis
      setActiveScan(data)
      // Add to history state
      setHistory((prev) => [data, ...prev.filter((item) => item.id !== data.id)])
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'An unexpected error occurred while analyzing the resume.')
    } finally {
      setAnalyzing(false)
    }
  }

  // 3. Handle Deleting Scan History
  const handleDeleteScan = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/history/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to delete analysis.')
      }

      setHistory((prev) => prev.filter((item) => item.id !== id))
      if (activeScan && activeScan.id === id) {
        setActiveScan(null)
      }
    } catch (err) {
      alert(`Error deleting record: ${err.message}`)
    }
  }

  // 4. Select a past scan to view
  const handleSelectScan = (item) => {
    setActiveScan(item)
    setError(null)
    setMobileSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 5. Start a new scan
  const handleNewScan = () => {
    setActiveScan(null)
    setError(null)
    setMobileSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div
              onClick={handleNewScan}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  AI Resume Analyzer
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Gemini
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  ATS Scoring & Keyword Optimization
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Backend status pill */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                backendOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span className="hidden sm:inline">
                {backendOnline ? 'Backend Online (Port 8000)' : 'Backend Offline'}
              </span>
            </div>

            <a
              href={`${API_BASE}/docs`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition"
            >
              <span>Swagger Docs</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {activeScan && (
              <button
                onClick={handleNewScan}
                className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>New Scan</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <HistorySidebar
            history={history}
            activeId={activeScan?.id}
            onSelectScan={handleSelectScan}
            onNewScan={handleNewScan}
            onDeleteScan={handleDeleteScan}
            loading={historyLoading}
          />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-10 w-80 max-w-full bg-slate-900 h-full shadow-2xl flex flex-col">
              <div className="p-4 flex items-center justify-between border-b border-slate-800">
                <span className="text-sm font-bold text-white">Scan History</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <HistorySidebar
                  history={history}
                  activeId={activeScan?.id}
                  onSelectScan={handleSelectScan}
                  onNewScan={handleNewScan}
                  onDeleteScan={handleDeleteScan}
                  loading={historyLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {!activeScan ? (
            /* Upload & Input View */
            <UploadSection
              onAnalyze={handleAnalyze}
              analyzing={analyzing}
              error={error}
              onClearError={() => setError(null)}
            />
          ) : (
            /* Analysis Results View */
            <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
              {/* Results Header */}
              <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <button
                    onClick={handleNewScan}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Back to upload"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <h2 className="text-base font-bold text-white truncate max-w-md">
                        {activeScan.filename}
                      </h2>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {activeScan.file_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>Scanned on {new Date(activeScan.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleNewScan}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center space-x-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Upload Another Resume</span>
                  </button>
                </div>
              </div>

              {/* Top Overview: Score Gauge + Job Info & Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visual ATS Score Gauge */}
                <div className="md:col-span-1">
                  <ScoreGauge score={activeScan.ats_score} />
                </div>

                {/* Score Summary & Target JD Insights */}
                <div className="md:col-span-2 p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60 backdrop-blur shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        ATS Audit Overview
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        Gemini Pro Audit
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">
                      {activeScan.ats_score >= 80
                        ? 'Strong Candidate Alignment'
                        : activeScan.ats_score >= 60
                        ? 'Promising Fit with Addressable Gaps'
                        : 'Substantial Skill & Keyword Gaps'}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeScan.ats_score >= 80
                        ? 'This resume displays high keyword density and demonstrates relevant accomplishments. Incorporate the suggestions below to further improve interview conversion rates.'
                        : activeScan.ats_score >= 60
                        ? 'The core background matches several required responsibilities, but critical technical skills or certifications from the job spec are currently missing.'
                        : 'ATS filters may filter out this resume due to missing foundational keywords and experience phrasing. Update your resume using the missing terms and rewritten bullet points below.'}
                    </p>
                  </div>

                  {/* Quick Stat Badges */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/60 mt-4">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 text-center">
                      <span className="text-lg font-extrabold text-emerald-400 font-mono">
                        {activeScan.matched_skills?.length || 0}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Matched Skills</p>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 text-center">
                      <span className="text-lg font-extrabold text-rose-400 font-mono">
                        {activeScan.missing_keywords?.length || 0}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Missing Terms</p>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 text-center">
                      <span className="text-lg font-extrabold text-indigo-400 font-mono">
                        {activeScan.improved_bullets?.length || 0}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Bullet Rewrites</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills & Missing Keywords Chips */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
                  Skills & Keyword Breakdown
                </h3>
                <SkillsChips
                  matchedSkills={activeScan.matched_skills || []}
                  missingKeywords={activeScan.missing_keywords || []}
                />
              </div>

              {/* Section-by-Section Feedback */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
                  Section Analysis & Recommendations
                </h3>
                <SectionFeedback feedback={activeScan.section_feedback || {}} />
              </div>

              {/* Improved Bullets */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
                  AI-Optimized Bullet Points
                </h3>
                <ImprovedBullets bullets={activeScan.improved_bullets || []} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

