'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ComplianceEvent {
  id: string
  title: string
  date: Date
  type: 'gst' | 'roc' | 'mca' | 'tds' | 'pf' | 'esi' | 'trademark'
  status: 'upcoming' | 'overdue' | 'completed'
}

const mockEvents: ComplianceEvent[] = [
  {
    id: '1',
    title: 'GST Filing',
    date: new Date(2024, 11, 15),
    type: 'gst',
    status: 'upcoming',
  },
  {
    id: '2',
    title: 'ROC Annual Filing',
    date: new Date(2024, 11, 28),
    type: 'roc',
    status: 'upcoming',
  },
  {
    id: '3',
    title: 'TDS Return',
    date: new Date(2024, 10, 7),
    type: 'tds',
    status: 'overdue',
  },
  {
    id: '4',
    title: 'PF Compliance',
    date: new Date(2024, 11, 10),
    type: 'pf',
    status: 'upcoming',
  },
  {
    id: '5',
    title: 'Trademark Renewal',
    date: new Date(2024, 11, 20),
    type: 'trademark',
    status: 'completed',
  },
]

const typeColors: Record<ComplianceEvent['type'], { bg: string; text: string; label: string }> = {
  gst: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'GST' },
  roc: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'ROC' },
  mca: { bg: 'bg-pink-500/10', text: 'text-pink-500', label: 'MCA' },
  tds: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'TDS' },
  pf: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'PF' },
  esi: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'ESI' },
  trademark: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', label: 'Trademark' },
}

export function ComplianceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 10))
  const [selectedEvent, setSelectedEvent] = useState<ComplianceEvent | null>(null)

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const days = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth(currentDate) }, (_, i) => i)

  const getEventsForDate = (day: number) => {
    return mockEvents.filter(
      (event) =>
        event.date.getDate() === day &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear()
    )
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const statusColors = {
    upcoming: 'border-amber-500/50 bg-amber-500/10',
    overdue: 'border-red-500/50 bg-red-500/10',
    completed: 'border-green-500/50 bg-green-500/10',
  }

  const statusBgColors = {
    upcoming: 'bg-amber-500/20',
    overdue: 'bg-red-500/20',
    completed: 'bg-green-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Calendar */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevMonth}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNextMonth}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const events = getEventsForDate(day)
            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square p-2 rounded-lg border transition-all cursor-pointer ${
                  events.length > 0
                    ? `${statusColors[events[0].status]} border-2`
                    : 'border border-border/50 hover:border-border'
                } bg-card/50`}
                onClick={() => events.length > 0 && setSelectedEvent(events[0])}
              >
                <div className="h-full flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{day}</span>
                  {events.length > 0 && (
                    <div className="mt-1 space-y-1 flex-1">
                      <div
                        className={`text-xs px-1 py-0.5 rounded ${typeColors[events[0].type].bg} ${
                          typeColors[events[0].type].text
                        } font-medium truncate`}
                      >
                        {typeColors[events[0].type].label}
                      </div>
                      {events.length > 1 && (
                        <div className="text-xs text-muted-foreground">+{events.length - 1} more</div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Compliance Types</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(typeColors).map(([type, { bg, text, label }]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${bg} ${text}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Detail Panel */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Event Details</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedEvent(null)}
              className="p-1 hover:bg-primary/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Compliance Name</p>
              <p className="text-sm font-semibold text-foreground">{selectedEvent.title}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <div className={`inline-block px-2 py-1 rounded ${typeColors[selectedEvent.type].bg} ${typeColors[selectedEvent.type].text} text-xs font-medium`}>
                {typeColors[selectedEvent.type].label}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Due Date</p>
              <p className="text-sm font-semibold text-foreground">{selectedEvent.date.toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusBgColors[selectedEvent.status]} ${
                  selectedEvent.status === 'upcoming'
                    ? 'text-amber-500'
                    : selectedEvent.status === 'overdue'
                    ? 'text-red-500'
                    : 'text-green-500'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current" />
                {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                View Details
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-primary/10 text-primary py-2 rounded-lg font-medium hover:bg-primary/20 transition-colors"
              >
                Edit
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
