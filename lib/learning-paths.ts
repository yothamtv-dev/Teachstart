/** Curated “specializations” — Udacity / Coursera style tracks that filter the catalog. */
export type LearningPath = {
  id: string
  title: string
  subtitle: string
  partnerStyle: 'Udemy' | 'Coursera' | 'Udacity'
  accent: string
  filter: {
    subjects?: string[]
    grades?: string[]
    difficulties?: string[]
  }
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'foundations-ela',
    title: 'Foundations of Literacy',
    subtitle: 'Sequential skills from close reading to analytical writing',
    partnerStyle: 'Coursera',
    accent: 'from-violet-600 to-indigo-700',
    filter: { subjects: ['English Language Arts', 'English'] },
  },
  {
    id: 'stem-lab',
    title: 'STEM Lab Intensive',
    subtitle: 'Hands-on science and math like a Udacity nanodegree sprint',
    partnerStyle: 'Udacity',
    accent: 'from-emerald-600 to-teal-800',
    filter: { subjects: ['Science', 'Mathematics', 'STEM', 'Biology'] },
  },
  {
    id: 'classroom-ready',
    title: 'Classroom-Ready Bootcamp',
    subtitle: 'High-impact lesson arcs — Udemy-style practical teaching',
    partnerStyle: 'Udemy',
    accent: 'from-amber-500 to-orange-700',
    filter: { difficulties: ['medium', 'hard'] },
  },
]

export function lessonMatchesPath(
  lesson: { subject?: string; grade_level?: string; difficulty_level?: string },
  path: LearningPath,
): boolean {
  const { subjects, grades, difficulties } = path.filter
  if (subjects?.length) {
    const sub = lesson.subject || ''
    if (!subjects.some((s) => sub.toLowerCase().includes(s.toLowerCase()))) return false
  }
  if (grades?.length && lesson.grade_level) {
    if (!grades.some((g) => lesson.grade_level?.includes(g))) return false
  }
  if (difficulties?.length && lesson.difficulty_level) {
    if (!difficulties.includes(lesson.difficulty_level)) return false
  }
  return true
}

/** Deterministic pseudo-rating for catalog cards when no peer rating exists. */
export function catalogRatingSeed(id: string): { value: number; count: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const value = 4.2 + (h % 80) / 100
  const count = 120 + (h % 2000)
  return { value: Math.round(value * 10) / 10, count }
}
