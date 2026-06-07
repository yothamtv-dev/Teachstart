'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, GripVertical, Video, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const blockTypeColors: Record<string, string> = {
  warmup: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800',
  introduction: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
  content: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800',
  video: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800',
  activity: 'bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800',
  discussion: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800',
  reflection: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800',
  break: 'bg-stone-50 border-stone-200 dark:bg-stone-950/40 dark:border-stone-700',
  assessment: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800',
}

export function LessonBlock({
  block,
  isSelected,
  onSelect,
  onUpdate: _onUpdate,
  onDelete,
}: {
  block: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const blockColor =
    blockTypeColors[block.type as keyof typeof blockTypeColors] ||
    'bg-muted/50 border-muted dark:bg-muted/20'

  const qCount = Array.isArray(block.metadata?.generated_questions)
    ? block.metadata.generated_questions.length
    : 0

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-4 cursor-pointer transition-all border-2 shadow-sm hover:shadow-md',
        blockColor,
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{block.title}</h3>
                {block.type === 'video' && block.metadata?.video_url && (
                  <Video className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-hidden />
                )}
                {qCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 gap-0.5">
                    <HelpCircle className="w-3 h-3" />
                    {qCount} Q
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {block.type} · {block.duration} min
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {block.content && (
            <p className="text-xs text-foreground mt-2 line-clamp-2 leading-relaxed">{block.content}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
