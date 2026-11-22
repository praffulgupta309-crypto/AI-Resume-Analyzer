import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Sparkles, ArrowRight } from 'lucide-react'

const SAMPLE_JOB_DESCRIPTION = `Senior Full-Stack / Backend Engineer

About the Role:
We are looking for an experienced Software Engineer proficient in Python, FastAPI, and PostgreSQL to design and scale high-throughput cloud microservices.

Responsibilities:
- Architect and maintain resilient RESTful APIs using FastAPI and SQLAlchemy ORM.
- Implement CI/CD pipelines and containerize services with Docker and Kubernetes.
- Optimize complex database queries and ensure high ATS compliance for internal tooling.
- Collaborate with frontend engineers delivering responsive React & Tailwind CSS web apps.

Requirements:
- 4+ years software engineering experience in Python (FastAPI/Django).
- Solid understanding of Docker, container orchestration, and cloud infrastructure (GCP/AWS).
- Strong database modeling experience with relational databases (PostgreSQL/MySQL).
- Familiarity with modern AI model APIs (Google Gemini, OpenAI) is a strong plus.`

export default function UploadSection({
  onAnalyze,
  analyzing = false,
  error = null,
  onClearError,
}) {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef(null)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const validateAndSetFile = (selectedFile) => {
    setValidationError('')
    if (onClearError) onClearError()

    if (!selectedFile) return

    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setValidationError('Please upload a PDF (.pdf) or Word (.docx) document.')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      const mb = (selectedFile.size / (1024 * 1024)).toFixed(2)
      setValidationError(`File size (${mb} MB) exceeds the 5 MB limit.`)
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fillSampleJD = () => {
    setJobDescription(SAMPLE_JOB_DESCRIPTION)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) {
      setValidationError('Please attach a resume file.')
      return
    }
    if (!jobDescription.trim()) {
      setValidationError('Please enter a target job description.')
      return
    }

    onAnalyze(file, jobDescription.trim())
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Powered by Google Gemini 4</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Applicant Tracking System (ATS) Audit
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Upload your resume and compare against your target job description for instant keyword gap analysis, scoring, and AI rewrites.
        </p>
      </div>

      {/* Error Banners */}
      {(validationError || error) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{validationError || error}</span>
          </div>
          <button
            onClick={() => {
              setValidationError('')
              if (onClearError) onClearError()
            }}
            className="p-1 hover:text-white rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload Zone */}
          <div className="flex flex-col">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              1. Candidate Resume
            </label>

            {!file ? (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 min-h-[220px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                    : 'border-slate-700 hover:border-indigo-500/50 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />
                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Drag and drop resume here, or <span className="text-indigo-400 underline">browse</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports PDF or DOCX format (Max 5 MB)
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-[220px] p-5 rounded-2xl bg-slate-800/70 border border-indigo-500/30 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[220px]">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Ready for Gemini ATS analysis</span>
                </div>
              </div>
            )}
          </div>

          {/* Job Description Textarea */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Target Job Description
              </label>
              <button
                type="button"
                onClick={fillSampleJD}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Insert Sample Job Spec
              </button>
            </div>

            <div className="relative flex-1 flex flex-col">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or requirements here..."
                rows={9}
                className="w-full flex-1 p-4 bg-slate-800/60 border border-slate-700 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed resize-none"
              />
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500">
                {jobDescription.length} characters
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={analyzing || !file || !jobDescription.trim()}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white flex items-center justify-center space-x-2.5 transition shadow-xl ${
              analyzing || !file || !jobDescription.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 shadow-indigo-500/25 active:scale-[0.99]'
            }`}
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-indigo-300" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Analyzing with Google Gemini...</span>
              </>
            ) : (
              <>
                <span>Analyze Resume Match</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
