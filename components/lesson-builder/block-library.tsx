'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  FileText,
  Lightbulb,
  MessageCircle,
  CheckCircle,
  Flame,
  Video,
  Brain,
  Coffee,
} from 'lucide-react'

const BLOCK_TYPES = [
  {
    id: 'warmup',
    label: 'Warm-up',
    description: 'Hook & prior knowledge',
    icon: Flame,
    color: 'text-orange-600',
  },
  {
    id: 'introduction',
    label: 'Introduction',
    description: 'Objective & agenda',
    icon: BookOpen,
    color: 'text-blue-600',
  },
  {
    id: 'content',
    label: 'Core content',
    description: 'Direct instruction',
    icon: FileText,
    color: 'text-purple-600',
  },
  {
    id: 'video',
    label: 'Video / media',
    description: 'Embed multimodal input',
    icon: Video,
    color: 'text-sky-600',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Hands-on work',
    icon: Lightbulb,
    color: 'text-green-600',
  },
  {
    id: 'discussion',
    label: 'Discussion',
    description: 'Dialogue & debate',
    icon: MessageCircle,
    color: 'text-yellow-600',
  },
  {
    id: 'reflection',
    label: 'Reflection',
    description: 'Exit ticket & metacognition',
    icon: Brain,
    color: 'text-indigo-600',
  },
  {
    id: 'break',
    label: 'Break / transition',
    description: 'Movement or buffer',
    icon: Coffee,
    color: 'text-stone-600',
  },
  {
    id: 'assessment',
    label: 'Assessment',
    description: 'Formative / summative',
    icon: CheckCircle,
    color: 'text-red-600',
  },
]

export function BlockLibrary({ onAddBlock }: { onAddBlock: (type: string) => void }) {
  return (
    <Card className="p-4 h-fit lg:sticky lg:top-4">
      <h3 className="font-semibold mb-1 text-sm">Block palette</h3>
      <p className="text-[11px] text-muted-foreground mb-3">Full lesson arc — from warm-up to assessment.</p>
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
        {BLOCK_TYPES.map((blockType) => {
          const Icon = blockType.icon
          return (
            <Button
              key={blockType.id}
              type="button"
              variant="outline"
              className="w-full justify-start text-left h-auto py-2 px-2.5"
              onClick={() => onAddBlock(blockType.id)}
            >
              <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${blockType.color}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs">{blockType.label}</div>
                <div className="text-[10px] text-muted-foreground leading-snug">{blockType.description}</div>
              </div>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
