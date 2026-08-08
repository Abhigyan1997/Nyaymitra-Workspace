'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Upload, FileX, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  name: string
  size: number
  type: string
}

interface FormData {
  title: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  files: UploadedFile[]
  lawyerType: 'existing' | 'request'
  caType: 'existing' | 'request'
  csType: 'existing' | 'request'
  selectedLawyer: string
  selectedCA: string
  selectedCS: string
  dueDate: string
  tags: string[]
}

const MATTER_CATEGORIES = [
  'Contract Drafting',
  'Contract Review',
  'Employment Agreement',
  'Founder Agreement',
  'NDA',
  'Vendor Agreement',
  'Service Agreement',
  'Customer Agreement',
  'Trademark Registration',
  'Copyright',
  'Patent',
  'GST Registration',
  'GST Compliance',
  'ROC Filing',
  'Company Incorporation',
  'Annual Compliance',
  'Legal Notice',
  'Due Diligence',
  'Fundraising Documentation',
  'ESOP Documentation',
  'Policy Drafting',
  'Regulatory Compliance',
  'Other',
]

const PROFESSIONALS = {
  lawyers: ['Rajesh Kumar', 'Vikram Singh'],
  cas: ['Priya Sharma', 'Neha Verma'],
  css: ['Amit Patel', 'Sanjay Desai'],
}

const TAG_SUGGESTIONS = ['Employment', 'Compliance', 'Trademark', 'Urgent', 'Corporate']

interface NewMatterModalProps {
  isOpen: boolean
  onClose: () => void
  onMatterCreated: (matterId: string) => void
}

export function NewMatterModal({ isOpen, onClose, onMatterCreated }: NewMatterModalProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<FormData>({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
    files: [],
    lawyerType: 'existing',
    caType: 'existing',
    csType: 'existing',
    selectedLawyer: '',
    selectedCA: '',
    selectedCS: '',
    dueDate: '',
    tags: [],
  })

  const validateStep = useCallback((stepNum: number) => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1) {
      if (!form.title.trim()) newErrors.title = 'Matter title is required'
      if (!form.category) newErrors.category = 'Category is required'
      if (!form.description.trim()) newErrors.description = 'Description is required'
      if (!form.priority) newErrors.priority = 'Priority is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const handleCreateMatter = async () => {
    if (!validateStep(1)) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newMatterId = Date.now().toString(36) + Math.random().toString(36).substring(2)
    onMatterCreated(newMatterId)
    setIsLoading(false)
    onClose()
  }

  const handleFileUpload = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    const files = 'dataTransfer' in e ? e.dataTransfer.files : (e.target as HTMLInputElement).files
    if (!files) return

    const newFiles: UploadedFile[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      if (validTypes.includes(file.type) && file.size <= 100 * 1024 * 1024) {
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
        })
      }
    }

    setForm(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }))
  }

  const removeFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }))
  }

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-border">
            <div>
              <h2 className="text-heading-md font-bold text-foreground">Create New Matter</h2>
              <p className="text-body-sm mt-1">Step {step} of 5</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1 px-8 pt-6 pb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all ${
                  s <= step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Matter Information */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="text-label-lg">Matter Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full mt-2 px-4 py-2.5 bg-card border border-border rounded-lg text-body-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="e.g., Trademark Registration for Brand"
                    />
                    {errors.title && <p className="text-red-500 text-body-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="text-label-lg">Matter Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full mt-2 px-4 py-2.5 bg-card border border-border rounded-lg text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    >
                      <option value="">Select a category...</option>
                      {MATTER_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-red-500 text-body-sm mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="text-label-lg">Priority *</label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setForm({ ...form, priority: p })}
                          className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            form.priority === p
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border border-border text-foreground hover:border-primary'
                          }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                    {errors.priority && <p className="text-red-500 text-body-sm mt-1">{errors.priority}</p>}
                  </div>

                  <div>
                    <label className="text-label-lg">Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full mt-2 px-4 py-2.5 bg-card border border-border rounded-lg text-body-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none h-32"
                      placeholder="Describe the legal matter in detail..."
                    />
                    {errors.description && <p className="text-red-500 text-body-sm mt-1">{errors.description}</p>}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Attachments */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileUpload}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-card/50"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-body-md font-semibold text-foreground mb-1">Drag & drop files here</p>
                    <p className="text-body-sm text-muted-foreground mb-4">or</p>
                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
                      />
                      <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 cursor-pointer transition-colors">
                        Select Files
                      </span>
                    </label>
                    <p className="text-body-xs text-muted-foreground mt-4">
                      PDF, DOC, DOCX, PNG, JPG, XLS • Max 100 MB each
                    </p>
                  </div>

                  {form.files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-label-lg">Uploaded Files ({form.files.length})</p>
                      {form.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-body-md font-medium text-foreground truncate">{file.name}</p>
                            <p className="text-body-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            onClick={() => removeFile(idx)}
                            className="text-muted-foreground hover:text-red-500 transition-colors ml-2"
                          >
                            <FileX className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Assign Legal Team */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Lawyer */}
                  <div className="space-y-3">
                    <p className="text-label-lg">Lawyer</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:border-primary transition-all flex-1">
                        <input
                          type="radio"
                          checked={form.lawyerType === 'existing'}
                          onChange={() => setForm({ ...form, lawyerType: 'existing' })}
                          className="w-4 h-4"
                        />
                        <span className="text-body-md font-medium text-foreground">Use Existing</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:border-primary transition-all flex-1">
                        <input
                          type="radio"
                          checked={form.lawyerType === 'request'}
                          onChange={() => setForm({ ...form, lawyerType: 'request' })}
                          className="w-4 h-4"
                        />
                        <span className="text-body-md font-medium text-foreground">Request NyayMitra</span>
                      </label>
                    </div>
                    {form.lawyerType === 'existing' && (
                      <select
                        value={form.selectedLawyer}
                        onChange={(e) => setForm({ ...form, selectedLawyer: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="">Select a lawyer...</option>
                        {PROFESSIONALS.lawyers.map(lawyer => (
                          <option key={lawyer} value={lawyer}>{lawyer}</option>
                        ))}
                      </select>
                    )}
                    {form.lawyerType === 'request' && (
                      <p className="text-body-sm text-muted-foreground px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
                        One of our professional lawyers will be assigned after submission.
                      </p>
                    )}
                  </div>

                  {/* CA */}
                  <div className="space-y-3">
                    <p className="text-label-lg">Chartered Accountant (Optional)</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:border-primary transition-all flex-1">
                        <input
                          type="radio"
                          checked={form.caType === 'existing'}
                          onChange={() => setForm({ ...form, caType: 'existing' })}
                          className="w-4 h-4"
                        />
                        <span className="text-body-md font-medium text-foreground">Use Existing</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:border-primary transition-all flex-1">
                        <input
                          type="radio"
                          checked={form.caType === 'request'}
                          onChange={() => setForm({ ...form, caType: 'request' })}
                          className="w-4 h-4"
                        />
                        <span className="text-body-md font-medium text-foreground">Request NyayMitra</span>
                      </label>
                    </div>
                    {form.caType === 'existing' && (
                      <select
                        value={form.selectedCA}
                        onChange={(e) => setForm({ ...form, selectedCA: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="">Select a CA...</option>
                        {PROFESSIONALS.cas.map(ca => (
                          <option key={ca} value={ca}>{ca}</option>
                        ))}
                      </select>
                    )}
                    {form.caType === 'request' && (
                      <p className="text-body-sm text-muted-foreground px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
                        One of our professional CAs will be assigned after submission.
                      </p>
                    )}
                  </div>

                  {/* CS */}
                  <div className="space-y-3">
                    <p className="text-label-lg">Company Secretary (Optional)</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:border-primary transition-all flex-1">
                        <input
                          type="radio"
                          checked={form.csType === 'existing'}
                          onChange={() => setForm({ ...form, csType: 'existing' })}
                          className="w-4 h-4"
                        />
                        <span className="text-body-md font-medium text-foreground">Use Existing</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:border-primary transition-all flex-1">
                        <input
                          type="radio"
                          checked={form.csType === 'request'}
                          onChange={() => setForm({ ...form, csType: 'request' })}
                          className="w-4 h-4"
                        />
                        <span className="text-body-md font-medium text-foreground">Request NyayMitra</span>
                      </label>
                    </div>
                    {form.csType === 'existing' && (
                      <select
                        value={form.selectedCS}
                        onChange={(e) => setForm({ ...form, selectedCS: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="">Select a CS...</option>
                        {PROFESSIONALS.css.map(cs => (
                          <option key={cs} value={cs}>{cs}</option>
                        ))}
                      </select>
                    )}
                    {form.csType === 'request' && (
                      <p className="text-body-sm text-muted-foreground px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
                        One of our professional CSs will be assigned after submission.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Timeline */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="text-label-lg">Target Completion Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full mt-2 px-4 py-2.5 bg-card border border-border rounded-lg text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-label-lg mb-3 block">Matter Tags (Optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_SUGGESTIONS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                            form.tags.includes(tag)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border border-border text-body-sm hover:border-primary'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-heading-sm font-semibold text-foreground mb-4">Review Your Matter</h3>
                  </div>

                  <div className="space-y-3 bg-card border border-border rounded-lg p-6">
                    <div>
                      <p className="text-label-md">Matter Title</p>
                      <p className="text-body-md font-medium text-foreground mt-1">{form.title}</p>
                    </div>
                    <div>
                      <p className="text-label-md">Category</p>
                      <p className="text-body-md font-medium text-foreground mt-1">{form.category}</p>
                    </div>
                    <div>
                      <p className="text-label-md">Priority</p>
                      <p className="text-body-md font-medium text-foreground mt-1 capitalize">{form.priority}</p>
                    </div>
                    <div>
                      <p className="text-label-md">Description</p>
                      <p className="text-body-md text-foreground mt-1">{form.description}</p>
                    </div>
                    {form.files.length > 0 && (
                      <div>
                        <p className="text-label-md">Attachments</p>
                        <p className="text-body-md text-foreground mt-1">{form.files.length} file(s) attached</p>
                      </div>
                    )}
                    <div>
                      <p className="text-label-md">Legal Team</p>
                      <p className="text-body-md text-foreground mt-1">
                        Lawyer: {form.lawyerType === 'existing' ? form.selectedLawyer || 'None selected' : 'Request from NyayMitra'}
                      </p>
                      {(form.selectedCA || form.caType === 'request') && (
                        <p className="text-body-md text-foreground">
                          CA: {form.caType === 'existing' ? form.selectedCA || 'None selected' : 'Request from NyayMitra'}
                        </p>
                      )}
                      {(form.selectedCS || form.csType === 'request') && (
                        <p className="text-body-md text-foreground">
                          CS: {form.csType === 'existing' ? form.selectedCS || 'None selected' : 'Request from NyayMitra'}
                        </p>
                      )}
                    </div>
                    {form.dueDate && (
                      <div>
                        <p className="text-label-md">Due Date</p>
                        <p className="text-body-md font-medium text-foreground mt-1">{new Date(form.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {form.tags.length > 0 && (
                      <div>
                        <p className="text-label-md">Tags</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-body-sm font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-8 border-t border-border bg-card/50">
            <button
              onClick={handlePrevStep}
              disabled={step === 1 || isLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-body-md font-semibold text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-body-md font-semibold text-foreground bg-card border border-border hover:border-primary transition-all"
              >
                Cancel
              </button>
              {step < 5 ? (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-body-md font-semibold hover:bg-primary/90 transition-all"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleCreateMatter}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-primary-foreground text-body-md font-semibold hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Create Matter
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
