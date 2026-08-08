'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, TrendingUp, CheckCircle2, Clock, BarChart3, Save } from 'lucide-react'

interface Answer {
  questionId: string
  value: string | boolean
}

interface Question {
  id: string
  section: 'corporate' | 'compliance' | 'contracts' | 'ip' | 'operations'
  question: string
  type: 'radio' | 'toggle' | 'select'
  options?: { label: string; value: string }[]
  weight: number
}

const QUESTIONS: Question[] = [
  // Corporate Governance
  {
    id: 'q1',
    section: 'corporate',
    question: 'Is your company legally registered?',
    type: 'toggle',
    weight: 15,
  },
  {
    id: 'q2',
    section: 'corporate',
    question: 'Do you have GST registration?',
    type: 'toggle',
    weight: 10,
  },
  {
    id: 'q3',
    section: 'corporate',
    question: 'Are your Articles of Association up to date?',
    type: 'toggle',
    weight: 8,
  },

  // Compliance
  {
    id: 'q4',
    section: 'compliance',
    question: 'Are your statutory filings (ROC, annual returns) up to date?',
    type: 'toggle',
    weight: 15,
  },
  {
    id: 'q5',
    section: 'compliance',
    question: 'Do you maintain a compliance calendar for upcoming deadlines?',
    type: 'toggle',
    weight: 10,
  },
  {
    id: 'q6',
    section: 'compliance',
    question: 'How often do you audit compliance requirements?',
    type: 'select',
    options: [
      { label: 'Never', value: '0' },
      { label: 'Annually', value: '5' },
      { label: 'Quarterly', value: '10' },
      { label: 'Monthly', value: '15' },
    ],
    weight: 8,
  },

  // Contracts
  {
    id: 'q7',
    section: 'contracts',
    question: 'Do all employees have signed employment agreements?',
    type: 'toggle',
    weight: 15,
  },
  {
    id: 'q8',
    section: 'contracts',
    question: 'Are vendor and customer contracts centrally managed?',
    type: 'toggle',
    weight: 12,
  },
  {
    id: 'q9',
    section: 'contracts',
    question: 'Do you have an NDA template for sensitive partnerships?',
    type: 'toggle',
    weight: 10,
  },

  // Intellectual Property
  {
    id: 'q10',
    section: 'ip',
    question: 'Is your trademark registered in relevant jurisdictions?',
    type: 'toggle',
    weight: 15,
  },
  {
    id: 'q11',
    section: 'ip',
    question: 'Do you own your domain and key brand assets?',
    type: 'toggle',
    weight: 12,
  },
  {
    id: 'q12',
    section: 'ip',
    question: 'Do you have IP assignment agreements with contractors?',
    type: 'toggle',
    weight: 10,
  },

  // Legal Operations
  {
    id: 'q13',
    section: 'operations',
    question: 'Do you have a dedicated lawyer or legal advisor?',
    type: 'toggle',
    weight: 12,
  },
  {
    id: 'q14',
    section: 'operations',
    question: 'How do you currently track legal requests and tasks?',
    type: 'select',
    options: [
      { label: 'Ad-hoc, no system', value: '0' },
      { label: 'Email/spreadsheet', value: '5' },
      { label: 'Project management tool', value: '10' },
      { label: 'Dedicated legal tool', value: '15' },
    ],
    weight: 10,
  },
  {
    id: 'q15',
    section: 'operations',
    question: 'Do you conduct annual legal health reviews?',
    type: 'toggle',
    weight: 8,
  },
]

const SECTION_NAMES: Record<string, string> = {
  corporate: 'Corporate Governance',
  compliance: 'Compliance',
  contracts: 'Contracts & Agreements',
  ip: 'Intellectual Property',
  operations: 'Legal Operations',
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  corporate: '🏢',
  compliance: '✓',
  contracts: '📋',
  ip: '⚡',
  operations: '⚙️',
}

export default function LegalHealthAssessment() {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sections = useMemo(() => {
    return Object.keys(SECTION_NAMES).map(section => ({
      id: section,
      name: SECTION_NAMES[section as keyof typeof SECTION_NAMES],
      questions: QUESTIONS.filter(q => q.section === section),
    }))
  }, [])

  const scoreData = useMemo(() => {
    let totalScore = 0
    let maxScore = 0
    const sectionScores: Record<string, { score: number; max: number }> = {}

    QUESTIONS.forEach(question => {
      maxScore += question.weight

      if (!sectionScores[question.section]) {
        sectionScores[question.section] = { score: 0, max: 0 }
      }
      sectionScores[question.section].max += question.weight

      const answer = answers[question.id]
      let questionScore = 0

      if (question.type === 'toggle') {
        questionScore = answer ? question.weight : 0
      } else if (question.type === 'select' && typeof answer === 'string') {
        questionScore = parseInt(answer) || 0
      }

      totalScore += questionScore
      sectionScores[question.section].score += questionScore
    })

    const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    const sectionPercentages = Object.entries(sectionScores).reduce(
      (acc, [section, data]) => {
        acc[section] = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0
        return acc
      },
      {} as Record<string, number>
    )

    return { overallScore, sectionPercentages, sectionScores }
  }, [answers])

  const getRiskLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score >= 80) return { level: 'Low Risk', color: 'text-green-400', bgColor: 'bg-green-500/10' }
    if (score >= 60) return { level: 'Medium Risk', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' }
    return { level: 'High Risk', color: 'text-red-400', bgColor: 'bg-red-500/10' }
  }

  const getRecommendations = () => {
    const { sectionPercentages } = scoreData
    const weak = Object.entries(sectionPercentages)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .map(([section]) => section)

    const recommendations: { section: string; message: string }[] = []

    if (weak.includes('corporate')) {
      recommendations.push({
        section: 'Corporate Governance',
        message: 'Complete company registration and update Articles of Association',
      })
    }
    if (weak.includes('compliance')) {
      recommendations.push({
        section: 'Compliance',
        message: 'Set up a compliance calendar and schedule quarterly audits',
      })
    }
    if (weak.includes('contracts')) {
      recommendations.push({
        section: 'Contracts',
        message: 'Standardize employment and vendor agreements',
      })
    }
    if (weak.includes('ip')) {
      recommendations.push({
        section: 'IP Protection',
        message: 'Register trademark and secure IP assignment agreements',
      })
    }
    if (weak.includes('operations')) {
      recommendations.push({
        section: 'Legal Operations',
        message: 'Implement a legal management tool and hire external counsel if needed',
      })
    }

    return recommendations
  }

  const risk = getRiskLevel(scoreData.overallScore)
  const recommendations = getRecommendations()
  const potentialGain = 100 - scoreData.overallScore

  const handleToggle = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSave = () => {
    console.log('Saving assessment:', { score: scoreData.overallScore, answers })
    // Toast notification would go here
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Main Assessment */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Legal Health Assessment</h1>
            <p className="text-muted-foreground">
              15 essential questions to understand your legal compliance posture. Updates score in real-time.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                initial={mounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mounted ? sectionIndex * 0.1 : 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{SECTION_ICONS[section.id]}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{section.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 bg-gradient-to-r from-accent to-transparent rounded-full w-12" />
                      <span className="text-xs text-muted-foreground">
                        {scoreData.sectionPercentages[section.id]}% complete
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 ml-0">
                  {section.questions.map((question, qIndex) => {
                    const answer = answers[question.id]
                    return (
                      <motion.div
                        key={question.id}
                        initial={mounted ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mounted ? sectionIndex * 0.1 + qIndex * 0.05 : 0 }}
                      >
                        <div className="bg-card border border-border rounded-xl p-5 hover:border-border/60 transition-colors">
                          <p className="text-foreground font-medium mb-4">{question.question}</p>

                          {question.type === 'toggle' && (
                            <button
                              onClick={() => handleToggle(question.id, !answer)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${answer
                                  ? 'bg-accent/20 border-accent text-accent'
                                  : 'border-border bg-background text-muted-foreground hover:border-border/60'
                                }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${answer ? 'bg-accent border-accent' : 'border-border'
                                  }`}
                              >
                                {answer && <CheckCircle2 className="w-4 h-4 text-background" />}
                              </div>
                              <span className="font-medium">{answer ? 'Yes' : 'Not yet'}</span>
                            </button>
                          )}

                          {question.type === 'select' && question.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {question.options.map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => handleSelect(question.id, option.value)}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center ${answer === option.value
                                      ? 'bg-accent/20 border-accent text-accent'
                                      : 'border-border bg-background text-muted-foreground hover:border-border/60'
                                    }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Save Button */}
          <motion.button
            initial={mounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mounted ? 0.8 : 0 }}
            onClick={handleSave}
            className="w-full bg-accent hover:bg-accent/90 text-background font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-5 h-5" />
            Save Assessment
          </motion.button>
        </div>

        {/* Sticky Sidebar */}
        <motion.div
          initial={mounted ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: mounted ? 0.3 : 0 }}
          className="lg:sticky lg:top-6 h-fit space-y-4"
        >
          {/* Score Card */}
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-6 space-y-6">
            {/* Circular Progress */}
            <div className="flex justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  {/* Background circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-border"
                  />
                  {/* Animated progress circle */}
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 70 * (1 - scoreData.overallScore / 100),
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="text-accent"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.p
                    key={scoreData.overallScore}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-accent"
                  >
                    {scoreData.overallScore}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Legal Health</p>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div className={`${risk.bgColor} border border-current/20 rounded-xl p-4 flex items-center gap-3`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${risk.color}`} />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">RISK LEVEL</p>
                <p className={`font-semibold ${risk.color}`}>{risk.level}</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Score Breakdown</p>
              {sections.map(section => (
                <div key={section.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="text-lg">{SECTION_ICONS[section.id]}</span>
                      {section.name}
                    </span>
                    <motion.span
                      key={scoreData.sectionPercentages[section.id]}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-sm font-bold text-accent"
                    >
                      {scoreData.sectionPercentages[section.id]}%
                    </motion.span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scoreData.sectionPercentages[section.id]}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-accent to-accent/60 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Potential Gain */}
            {potentialGain > 0 && (
              <div className="bg-background/40 border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <p className="text-xs font-semibold text-muted-foreground">POTENTIAL IMPROVEMENT</p>
                </div>
                <p className="text-2xl font-bold text-green-400">+{potentialGain}%</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  You can reach {100}% by addressing your weakest areas
                </p>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <motion.div
              initial={mounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mounted ? 0.2 : 0 }}
              className="bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Next Steps
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={mounted ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: mounted ? 0.3 + i * 0.1 : 0 }}
                    className="flex gap-3 p-3 bg-background/40 rounded-lg hover:bg-background/60 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{rec.section}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{rec.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Summary */}
          <motion.div
            initial={mounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mounted ? 0.4 : 0 }}
            className="bg-background/30 border border-border rounded-2xl p-4 text-center"
          >
            <p className="text-xs text-muted-foreground mb-2">💡 AI-STYLE SUMMARY</p>
            <p className="text-sm text-foreground leading-relaxed">
              {scoreData.overallScore >= 80
                ? 'Strong legal foundation. Focus on maintaining compliance calendars and annual reviews.'
                : scoreData.overallScore >= 60
                  ? 'Solid progress. Priority: formalize contracts and trademark registration.'
                  : 'Time to strengthen your legal infrastructure. Start with company registration and compliance setup.'}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}