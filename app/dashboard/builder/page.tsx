'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LessonCanvas } from '@/components/lesson-builder/lesson-canvas'
import { BlockLibrary } from '@/components/lesson-builder/block-library'
import { AIGeneratorDialog } from '@/components/lesson-builder/ai-generator-dialog'
import { LessonMetrics } from '@/components/lesson-builder/lesson-metrics'
import { AISetupBanner } from '@/components/ai-setup-banner'
import { Plus, Save, Download, Compass } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { extractLearningObjectives } from '@/lib/lesson-helpers'
import { lessonToMarkdown, downloadTextFile } from '@/lib/export-lesson'
import { LessonPreviewDialog } from '@/components/lesson-builder/lesson-preview-dialog'
import { BlockAiQuestions } from '@/components/lesson-builder/block-ai-questions'
import { getErrorMessage } from '@/lib/error-message'
import { ensurePublicUserProfile } from '@/lib/ensure-user-profile'

export default function LessonBuilder() {
  const router = useRouter()
  const { user } = useAuth()
  const [lessonTitle, setLessonTitle] = useState('Untitled Lesson')
  const [lessonSubtitle, setLessonSubtitle] = useState('')
  const [subject, setSubject] = useState('General')
  const [gradeLevel, setGradeLevel] = useState('Unspecified')
  const [difficultyLevel, setDifficultyLevel] = useState('medium')
  const [isPublished, setIsPublished] = useState(false)
  const [blocks, setBlocks] = useState<any[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('id')) return

    const raw = sessionStorage.getItem('templateData')
    if (!raw) return

    try {
      const t = JSON.parse(raw)
      const mapped = (t.blocks || []).map((b: any, i: number) => ({
        id: `tpl_${Date.now()}_${i}`,
        type: b.type,
        title: b.title,
        content: b.content || '',
        duration: b.duration || 5,
        order: i,
      }))
      if (mapped.length) {
        setBlocks(mapped)
        setLessonTitle(t.title || 'From template')
        setSubject(t.subject || 'General')
        setGradeLevel(t.grade || 'Unspecified')
      }
    } catch {
      /* ignore */
    } finally {
      sessionStorage.removeItem('templateData')
    }
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('id')
    if (!editId) return

    setLoadingLesson(true)
    ;(async () => {
      try {
        const { data: lesson, error: le } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', editId)
          .single()
        if (le || !lesson) return

        setLessonId(lesson.id)
        setLessonTitle(lesson.title || 'Untitled Lesson')
        setLessonSubtitle(
          lesson.description && !String(lesson.description).startsWith('Lesson with ')
            ? lesson.description
            : '',
        )
        setSubject(lesson.subject || 'General')
        setGradeLevel(lesson.grade_level || 'Unspecified')
        setDifficultyLevel(lesson.difficulty_level || 'medium')
        setIsPublished(!!lesson.is_published)

        const { data: lb } = await supabase
          .from('lesson_blocks')
          .select('*')
          .eq('lesson_id', editId)
          .order('position', { ascending: true })

        if (lb?.length) {
          setBlocks(
            lb.map((b) => ({
              id: b.id,
              type: b.block_type,
              title: b.title || '',
              content: b.content || '',
              duration: b.duration_minutes ?? 5,
              order: b.position,
              metadata: b.metadata || {},
              learning_objectives: (b.metadata as any)?.learning_objectives,
            })),
          )
        }
      } finally {
        setLoadingLesson(false)
      }
    })()
  }, [user])

  const handleAddBlock = useCallback((blockType: string) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type: blockType,
      title: `${blockType} Block`,
      content: '',
      duration: 5,
      order: blocks.length,
    }
    setBlocks([...blocks, newBlock])
  }, [blocks])

  const handleUpdateBlock = useCallback((blockId: string, updates: any) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)))
  }, [blocks])

  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }, [blocks, selectedBlockId])

  const handleReorderBlocks = useCallback((reorderedBlocks: any[]) => {
    setBlocks(reorderedBlocks.map((b, i) => ({ ...b, order: i })))
  }, [])

  const handleBlocksGenerated = useCallback(
    (generatedBlocks: any[], meta?: { title?: string; description?: string; learning_objectives?: string[] }) => {
      setBlocks(generatedBlocks)
      if (meta?.title) setLessonTitle(meta.title)
      if (meta?.description) {
        /* description stored in DB on save via generated description */
      }
    },
    [],
  )

  const handleSaveLesson = useCallback(async () => {
    if (!user || blocks.length === 0) return

    setSaving(true)
    try {
      const { error: profileErr } = await ensurePublicUserProfile(supabase, user)
      if (profileErr) {
        toast.error(
          `${getErrorMessage(profileErr)} Create a profile row: sign out and in, or run scripts/patches/004-auth-user-profile-trigger.sql in Supabase.`,
        )
        return
      }

      const totalMinutes = blocks.reduce((s, b) => s + (Number(b.duration) || 0), 0) || 45
      const learning_objectives = extractLearningObjectives(blocks)

      const lessonRow = {
        user_id: user.id,
        title: lessonTitle,
        description:
          lessonSubtitle.trim() ||
          `Hands-on lesson with ${blocks.length} sections — structured for the Discover catalog.`,
        subject: subject || 'General',
        grade_level: gradeLevel || 'Unspecified',
        duration_minutes: totalMinutes,
        estimated_duration_minutes: totalMinutes,
        learning_objectives,
        difficulty_level: difficultyLevel,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      }

      let currentLessonId = lessonId

      if (currentLessonId) {
        const { error } = await supabase.from('lessons').update(lessonRow).eq('id', currentLessonId)
        if (error) throw error
        const { error: deleteBlocksErr } = await supabase
          .from('lesson_blocks')
          .delete()
          .eq('lesson_id', currentLessonId)
        if (deleteBlocksErr) throw deleteBlocksErr
      } else {
        const { data, error } = await supabase.from('lessons').insert(lessonRow).select('id').single()
        if (error) throw error
        currentLessonId = data.id
        setLessonId(data.id)
      }

      const rows = blocks.map((b, i) => ({
        lesson_id: currentLessonId!,
        block_type: b.type || 'content',
        title: b.title,
        content: b.content,
        position: i,
        duration_minutes: Number(b.duration) || 5,
        metadata: {
          ...(b.metadata || {}),
          ...(Array.isArray(b.learning_objectives) ? { learning_objectives: b.learning_objectives } : {}),
        },
      }))

      const rowsPayload = JSON.parse(JSON.stringify(rows)) as typeof rows
      const { error: blockErr } = await supabase.from('lesson_blocks').insert(rowsPayload)
      if (blockErr) throw blockErr

      router.replace(`/dashboard/builder?id=${currentLessonId}`)
      toast.success('Lesson saved')
    } catch (error) {
      const msg = getErrorMessage(error)
      console.error('Error saving lesson:', msg, error)
      toast.error(
        msg ||
          'Save failed. Run scripts/patches SQL in Supabase (RLS + columns) if your project predates schema.sql.',
      )
    } finally {
      setSaving(false)
    }
  }, [user, blocks, lessonTitle, lessonSubtitle, subject, gradeLevel, difficultyLevel, isPublished, lessonId, router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void handleSaveLesson()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleSaveLesson])

  const handleExportMarkdown = useCallback(() => {
    const md = lessonToMarkdown(lessonTitle, subject, gradeLevel, blocks)
    const slug =
      lessonTitle
        .slice(0, 48)
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'lesson'
    downloadTextFile(`${slug}.md`, md)
    toast.success('Downloaded Markdown')
  }, [lessonTitle, subject, gradeLevel, blocks])

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8rem)]">
      <AISetupBanner className="mx-4 mt-4" />
      <div className="border-b bg-card px-4 py-3 shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              className="text-xl md:text-2xl font-bold bg-transparent outline-none w-full"
              placeholder="Lesson Title"
            />
            <Textarea
              value={lessonSubtitle}
              onChange={(e) => setLessonSubtitle(e.target.value)}
              placeholder="Catalog subtitle — what learners get (shown on Discover like a Udemy tagline)"
              className="min-h-[60px] text-sm resize-y max-w-2xl"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="h-8 w-36 text-sm"
              />
              <Input
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="Grade level"
                className="h-8 w-36 text-sm"
              />
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                title="Difficulty"
              >
                <option value="beginner">Beginner</option>
                <option value="medium">Intermediate</option>
                <option value="hard">Advanced</option>
              </select>
              {loadingLesson && <span className="text-xs text-muted-foreground">Loading…</span>}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="catalog-publish"
                  checked={isPublished}
                  onCheckedChange={(v) => setIsPublished(!!v)}
                />
                <Label htmlFor="catalog-publish" className="text-sm font-normal cursor-pointer">
                  List in Discover (MOOC-style catalog)
                </Label>
              </div>
              {lessonId && (
                <Button variant="link" size="sm" className="h-auto p-0 gap-1 text-primary" asChild>
                  <Link href={`/dashboard/learn/${lessonId}`}>
                    <Compass className="w-4 h-4" />
                    Open learner view
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <LessonPreviewDialog
              title={lessonTitle}
              subject={subject}
              gradeLevel={gradeLevel}
              blocks={blocks}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={blocks.length === 0}
              onClick={handleExportMarkdown}
            >
              <Download className="w-4 h-4" />
              Export .md
            </Button>
            <AIGeneratorDialog onBlocksGenerated={handleBlocksGenerated} />
            <Button variant="outline" size="sm" type="button" onClick={() => router.push('/dashboard/lessons')}>
              My lessons
            </Button>
            <Button size="sm" type="button" onClick={handleSaveLesson} disabled={saving || blocks.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <span className="text-[10px] text-muted-foreground hidden xl:inline">⌘S</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden p-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          {blocks.length === 0 ? (
            <Card className="flex-1 flex items-center justify-center min-h-[240px]">
              <div className="text-center px-4">
                <p className="text-muted-foreground mb-4">Drag blocks from the library or generate with AI</p>
                <Button type="button" onClick={() => handleAddBlock('introduction')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add first block
                </Button>
              </div>
            </Card>
          ) : (
            <LessonCanvas
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
              onReorderBlocks={handleReorderBlocks}
            />
          )}
        </div>

        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[70vh] lg:max-h-none">
          <BlockLibrary onAddBlock={handleAddBlock} />
          <LessonMetrics
            blocks={blocks}
            title={lessonTitle}
            description={lessonSubtitle}
            subject={subject}
            gradeLevel={gradeLevel}
            learningObjectives={blocks
              .flatMap((b) => (b.metadata as any)?.learning_objectives || [])
              .filter(Boolean)}
            lessonId={lessonId}
          />
          {selectedBlockId && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Block details</h3>
              <BlockEditor
                block={blocks.find((b) => b.id === selectedBlockId)}
                onUpdate={(updates: any) => handleUpdateBlock(selectedBlockId, updates)}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function BlockEditor({ block, onUpdate }: { block: any; onUpdate: (u: any) => void }) {
  if (!block) return null

  const attachments: { title: string; url: string }[] = block.metadata?.attachments || []
  const videoUrl = block.metadata?.video_url || ''

  const setAttachments = (next: typeof attachments) => {
    onUpdate({
      metadata: { ...block.metadata, attachments: next },
    })
  }

  const setVideoUrl = (url: string) => {
    onUpdate({
      metadata: { ...block.metadata, video_url: url || undefined },
    })
  }

  const addLink = () => {
    const title = prompt('Resource title') || 'Resource'
    const url = prompt('URL (https://…)') || ''
    if (!url) return
    setAttachments([...attachments, { title, url }])
  }

  const removeLink = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx))
  }

  const showAiQuestions = block.type === 'assessment' || block.type === 'reflection'

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={block.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Duration (minutes)</label>
        <Input
          type="number"
          value={block.duration}
          onChange={(e) => onUpdate({ duration: parseInt(e.target.value, 10) || 1 })}
          className="mt-1"
          min={1}
        />
      </div>
      {block.type !== 'break' && (
        <div>
          <label className="text-sm font-medium">
            {block.type === 'video' ? 'Video URL' : 'Optional video in this section'}
          </label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            YouTube, Vimeo, Loom, or direct .mp4/.webm. You can also paste the same URL on its own line in the
            content field.
          </p>
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 font-mono text-xs"
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Content</label>
        <textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="mt-1 w-full h-32 p-2 border rounded-md resize-none text-sm"
          placeholder="Block content…"
        />
      </div>
      {showAiQuestions && <BlockAiQuestions block={block} onUpdate={onUpdate} />}
      <div className="border-t pt-3">
        <p className="text-sm font-medium mb-2">Resources & links</p>
        <p className="text-xs text-muted-foreground mb-2">
          Attach PDFs, slides, or videos by URL. Files stay in your links until you add Supabase Storage.
        </p>
        <Button type="button" variant="outline" size="sm" className="w-full mb-2" onClick={addLink}>
          Add link
        </Button>
        <ul className="space-y-1 text-xs">
          {attachments.map((a, i) => (
            <li key={i} className="flex justify-between gap-2 items-center">
              <a href={a.url} target="_blank" rel="noreferrer" className="truncate text-primary underline">
                {a.title}
              </a>
              <Button type="button" variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={() => removeLink(i)}>
                ✕
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
