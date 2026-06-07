'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Database, Upload, CheckCircle2, XCircle } from 'lucide-react'

type Standard = {
  id: string
  standard_code: string
  standard_title: string
  subject: string
  grade_level: string
  grade_band: string | null
}

type ParsedStandard = {
  standard_code: string
  standard_title: string
  standard_description?: string
  subject: string
  grade_level: string
  grade_band?: string
}

export default function AdminCurriculumPage() {
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<ParsedStandard[] | null>(null)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('curriculum_standards')
        .select('id, standard_code, standard_title, subject, grade_level, grade_band')
        .order('subject')
      setStandards(data || [])
      setLoading(false)
    })()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setPreview(null)

    const text = await file.text()
    try {
      let parsed: ParsedStandard[]
      if (file.name.endsWith('.json')) {
        const raw = JSON.parse(text)
        parsed = Array.isArray(raw) ? raw : raw.standards || []
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parser
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
        parsed = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
          return headers.reduce((obj: any, h, i) => { obj[h] = cols[i] || ''; return obj }, {})
        })
      } else {
        setParseError('Only .json or .csv files are supported')
        return
      }

      // Validate required fields
      const required = ['standard_code', 'standard_title', 'subject', 'grade_level']
      const valid = parsed.filter((r) => required.every((k) => r[k as keyof ParsedStandard]))
      if (valid.length === 0) {
        setParseError(
          `No valid rows found. Required columns: ${required.join(', ')}`,
        )
        return
      }
      setPreview(valid)
      toast.success(`Parsed ${valid.length} standards. Review and confirm upload.`)
    } catch (err: any) {
      setParseError(`Parse error: ${err.message}`)
    }
  }

  const handleUpload = async () => {
    if (!preview) return
    setUploading(true)
    try {
      const { error } = await supabase.from('curriculum_standards').upsert(
        preview.map((s) => ({
          standard_code: s.standard_code,
          standard_title: s.standard_title,
          standard_description: s.standard_description || null,
          subject: s.subject,
          grade_level: s.grade_level,
          grade_band: s.grade_band || null,
        })),
        { onConflict: 'standard_code' },
      )
      if (error) throw error
      toast.success(`${preview.length} standards uploaded successfully!`)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      // Refresh list
      const { data } = await supabase
        .from('curriculum_standards')
        .select('id, standard_code, standard_title, subject, grade_level, grade_band')
        .order('subject')
      setStandards(data || [])
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Database className="w-6 h-6" /> Curriculum Standards
      </h1>

      {/* Upload */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Upload Official Standards (CSV / JSON)</h2>
        <p className="text-sm text-muted-foreground">
          Upload a CSV or JSON file exported from your Ministry or standards body. Required columns:{' '}
          <code className="text-xs bg-muted px-1 rounded">standard_code</code>,{' '}
          <code className="text-xs bg-muted px-1 rounded">standard_title</code>,{' '}
          <code className="text-xs bg-muted px-1 rounded">subject</code>,{' '}
          <code className="text-xs bg-muted px-1 rounded">grade_level</code>. Optional:{' '}
          <code className="text-xs bg-muted px-1 rounded">standard_description</code>,{' '}
          <code className="text-xs bg-muted px-1 rounded">grade_band</code>.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileChange}
            className="text-sm"
          />
          {preview && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading…' : `Confirm upload (${preview.length} records)`}
            </Button>
          )}
        </div>
        {parseError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="w-4 h-4 shrink-0" /> {parseError}
          </div>
        )}
        {preview && (
          <div className="text-sm space-y-2">
            <p className="font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Preview – first 5 records:
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {['standard_code', 'standard_title', 'subject', 'grade_level', 'grade_band'].map((h) => (
                      <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-1.5 font-mono">{row.standard_code}</td>
                      <td className="px-3 py-1.5 max-w-xs truncate">{row.standard_title}</td>
                      <td className="px-3 py-1.5">{row.subject}</td>
                      <td className="px-3 py-1.5">{row.grade_level}</td>
                      <td className="px-3 py-1.5">{row.grade_band || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Existing standards */}
      <div>
        <h2 className="font-semibold mb-4">Existing Standards ({standards.length})</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="text-sm w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-2.5 text-left font-medium">Code</th>
                  <th className="px-4 py-2.5 text-left font-medium">Title</th>
                  <th className="px-4 py-2.5 text-left font-medium">Subject</th>
                  <th className="px-4 py-2.5 text-left font-medium">Grade</th>
                  <th className="px-4 py-2.5 text-left font-medium">Band</th>
                </tr>
              </thead>
              <tbody>
                {standards.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{s.standard_code}</td>
                    <td className="px-4 py-2 max-w-xs">{s.standard_title}</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="text-xs">{s.subject}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{s.grade_level}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.grade_band || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
