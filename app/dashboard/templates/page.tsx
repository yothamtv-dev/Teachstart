'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LESSON_TEMPLATES, METHODOLOGY_FILTERS, type PedagogyMethod } from '@/lib/template-library'
import { Download, Star, Copy, Layers } from 'lucide-react'

export default function TemplatesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [methodology, setMethodology] = useState<PedagogyMethod | 'all'>('all')

  const subjects = useMemo(
    () => ['all', ...new Set(LESSON_TEMPLATES.map((t) => t.subject))],
    [],
  )

  const filteredTemplates = LESSON_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.methodology.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === 'all' || t.subject === selectedSubject
    const matchesMethod = methodology === 'all' || t.methodology === methodology
    return matchesSearch && matchesSubject && matchesMethod
  })

  const handleUseTemplate = (template: (typeof LESSON_TEMPLATES)[0]) => {
    sessionStorage.setItem('templateData', JSON.stringify(template))
    router.push('/dashboard/builder')
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pedagogical template library</h1>
        <p className="text-muted-foreground mt-2">
          Frameworks by subject, grade band, and teaching methodology — inquiry, direct instruction, flipped, PBL, 5E,
          and universal design.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
        <Input
          placeholder="Search title, description, or methodology…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="h-10 px-3 rounded-md border bg-background text-sm"
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject === 'all' ? 'All subjects' : subject}
            </option>
          ))}
        </select>
        <select
          value={methodology}
          onChange={(e) => setMethodology(e.target.value as PedagogyMethod | 'all')}
          className="h-10 px-3 rounded-md border bg-background text-sm min-w-[200px]"
        >
          <option value="all">All methodologies</option>
          {METHODOLOGY_FILTERS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-6 flex flex-col h-full border-muted">
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-lg leading-snug">{template.title}</h3>
                <div className="flex items-center gap-1 text-sm shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{template.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{template.subject}</Badge>
                <Badge variant="outline">{template.grade}</Badge>
                <Badge className="gap-1">
                  <Layers className="w-3 h-3" />
                  {template.methodology}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">Duration:</span> {template.duration} min ·{' '}
                  <span className="font-medium text-foreground">Blocks:</span> {template.blocks.length}
                </p>
                <p className="flex items-center gap-1 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  {template.downloads} educators started from this framework
                </p>
              </div>
            </div>
            <Button type="button" onClick={() => handleUseTemplate(template)} className="w-full mt-4 gap-2">
              <Copy className="w-4 h-4" />
              Use in builder
            </Button>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">No templates match your filters.</Card>
      )}
    </div>
  )
}
