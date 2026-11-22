import React from 'react'
import { FileText, Briefcase, Award, LayoutTemplate } from 'lucide-react'

export default function SectionFeedback({ feedback = {} }) {
  const sections = [
    {
      key: 'summary',
      title: 'Professional Summary',
      subtitle: 'Headline, Objective & Hook',
      icon: FileText,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
      content: feedback.summary || 'No summary feedback provided.',
    },
    {
      key: 'experience',
      title: 'Work Experience',
      subtitle: 'Achievements & Business Impact',
      icon: Briefcase,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      content: feedback.experience || 'No experience feedback provided.',
    },
    {
      key: 'skills',
      title: 'Skills & Taxonomy',
      subtitle: 'Alignment with Tech Stack',
      icon: Award,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10 border-violet-500/20',
      content: feedback.skills || 'No skills feedback provided.',
    },
    {
      key: 'formatting',
      title: 'Layout & Formatting',
      subtitle: 'ATS Scannability & Readability',
      icon: LayoutTemplate,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      content: feedback.formatting || 'No formatting feedback provided.',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((sec) => {
        const Icon = sec.icon
        return (
          <div
            key={sec.key}
            className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700/60 backdrop-blur hover:border-slate-600 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-3 mb-2.5">
                <span className={`p-2 rounded-xl border ${sec.bgColor} ${sec.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{sec.title}</h4>
                  <p className="text-[11px] text-slate-400">{sec.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2 pl-1">
                {sec.content}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
