'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Send, Trash2, Users, ClipboardList, X, Plus } from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\s\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

function splitValidEmails(raw: string): { valid: string[]; invalid: string[] } {
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  for (const email of parseEmails(raw)) {
    if (seen.has(email)) continue
    seen.add(email)
    if (EMAIL_RE.test(email)) valid.push(email)
    else invalid.push(email)
  }
  return { valid, invalid }
}

type Lesson = { id: string; title: string; subject: string; grade_level: string }
type Assignment = {
  id: string
  lesson_id: string
  student_email: string
  due_date: string | null
  note: string | null
  assigned_at: string
  lesson: { title: string; subject: string }
}

export default function AssignLessonPage() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedLesson, setSelectedLesson] = useState('')
  const [studentEmails, setStudentEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [lessonsRes, assignRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, subject, grade_level')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('lesson_assignments')
          .select('id, lesson_id, student_email, due_date, note, assigned_at, lesson:lessons(title, subject)')
          .eq('teacher_id', user.id)
          .order('assigned_at', { ascending: false }),
      ])
      setLessons(lessonsRes.data || [])
      setAssignments((assignRes.data || []) as any[])
      setLoadingLessons(false)
    })()
  }, [user])

  const addEmailsFromInput = (raw: string) => {
    const { valid, invalid } = splitValidEmails(raw)
    if (invalid.length) {
      toast.error(`Invalid email${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`)
    }
    if (!valid.length) return false
    setStudentEmails((prev) => {
      const seen = new Set(prev)
      const next = [...prev]
      for (const email of valid) {
        if (!seen.has(email)) {
          seen.add(email)
          next.push(email)
        }
      }
      return next
    })
    return true
  }

  const handleAddEmail = () => {
    if (!emailInput.trim()) return
    if (addEmailsFromInput(emailInput)) setEmailInput('')
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddEmail()
    }
  }

  const handleBulkAdd = () => {
    if (!bulkEmails.trim()) return
    if (addEmailsFromInput(bulkEmails)) setBulkEmails('')
  }

  const removeEmail = (email: string) => {
    setStudentEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    const pending = emailInput.trim() ? splitValidEmails(emailInput).valid : []
    const allEmails = [...new Set([...studentEmails, ...pending])]

    if (!selectedLesson || allEmails.length === 0) {
      toast.error('Select a lesson and add at least one student email')
      return
    }
    setSaving(true)
    try {
      const rows = allEmails.map((student_email) => ({
        lesson_id: selectedLesson,
        teacher_id: user!.id,
        student_email,
        due_date: dueDate || null,
        note: note.trim() || null,
      }))
      const { error } = await supabase
        .from('lesson_assignments')
        .upsert(rows, { onConflict: 'lesson_id,student_email' })
      if (error) throw error
      toast.success(
        allEmails.length === 1
          ? `Lesson assigned to ${allEmails[0]}`
          : `Lesson assigned to ${allEmails.length} students`,
      )
      setStudentEmails([])
      setEmailInput('')
      setBulkEmails('')
      setNote('')
      setDueDate('')
      // Refresh assignments
      const { data } = await supabase
        .from('lesson_assignments')
        .select('id, lesson_id, student_email, due_date, note, assigned_at, lesson:lessons(title, subject)')
        .eq('teacher_id', user!.id)
        .order('assigned_at', { ascending: false })
      setAssignments((data || []) as any[])
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('lesson_assignments').delete().eq('id', id)
    if (error) { toast.error('Failed to remove assignment'); return }
    setAssignments((prev) => prev.filter((a) => a.id !== id))
    toast.success('Assignment removed')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" /> Assign Lesson to Students
        </h1>
        <p className="text-muted-foreground mt-1">
          Assign one lesson to multiple students at once. They see it in their portal when they log in with the same email.
        </p>
      </div>

      {/* Assignment form */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">New Assignment</h2>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Lesson</label>
            {loadingLessons ? (
              <p className="text-sm text-muted-foreground">Loading your lessons…</p>
            ) : (
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                required
              >
                <option value="">— Select a lesson —</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.subject} · {l.grade_level})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Students</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="student@school.edu"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                onBlur={() => {
                  if (emailInput.includes(',') || emailInput.includes('\n')) handleAddEmail()
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddEmail} className="shrink-0 gap-1">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or Add for each student. Paste multiple addresses below to add them in bulk.
            </p>
            {studentEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {studentEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1 text-xs">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="rounded-sm p-0.5 hover:bg-muted"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Bulk add (comma or newline separated)</label>
              <Textarea
                placeholder={'student1@school.edu\nstudent2@school.edu\nstudent3@school.edu'}
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={3}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleBulkAdd}
                disabled={!bulkEmails.trim()}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                Add all from list
              </Button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Due Date (optional)</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Note for student (optional)</label>
              <Input
                placeholder="Focus on sections 2–4"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={saving || (studentEmails.length === 0 && !emailInput.trim())}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {saving
              ? 'Assigning…'
              : studentEmails.length > 1
                ? `Assign to ${studentEmails.length} students`
                : 'Assign Lesson'}
          </Button>
        </form>
      </Card>

      {/* Existing assignments */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" /> Existing Assignments
        </h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <Card key={a.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{(a.lesson as any)?.title || a.lesson_id}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{(a.lesson as any)?.subject}</Badge>
                    <span className="text-xs text-muted-foreground">{a.student_email}</span>
                    {a.due_date && (
                      <span className="text-xs text-orange-500">
                        Due {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {a.note && <p className="text-xs text-muted-foreground italic mt-0.5">{a.note}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(a.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
