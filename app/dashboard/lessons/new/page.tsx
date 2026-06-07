'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewLessonPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard/builder')
  }, [router])

  return <div>Redirecting...</div>
}
