import React from 'react'
import { History, PlusCircle, Trash2, FileText, ChevronRight, Clock } from 'lucide-react'

export default function HistorySidebar({
  history = [],
  activeId = null,
  onSelectScan,
  onNewScan,
  onDeleteScan,
  loading = false,
}) {
  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    if (score >= 60) return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  }

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col h-full">
      {/* Header & New Scan Button */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-slate-300">
            <History className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scan History
            </span>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {history.length}
          </span>
        </div>

        <button
          onClick={onNewScan}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Resume Scan</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No past scans yet</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Uploaded resumes will automatically appear here.
            </p>
          </div>
        ) : (
          history.map((item) => {
            const isActive = activeId === item.id
            return (
              <div
                key={item.id}
                onClick={() => onSelectScan(item)}
                className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between space-x-2 ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg mt-0.5 ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                      {item.filename}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(item.created_at)}
                    </p>
                    <div className="mt-1.5 flex items-center space-x-1.5">
                      <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getScoreBadgeClass(item.ats_score)}`}>
                        {item.ats_score}% ATS
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        {item.file_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteScan(item.id)
                  }}
                  title="Delete scan"
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
