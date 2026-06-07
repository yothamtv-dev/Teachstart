export type PedagogyMethod =
  | 'Direct Instruction'
  | 'Inquiry-Based'
  | 'Flipped Classroom'
  | 'Project-Based'
  | '5E Model'
  | 'Universal Design'

export type LessonTemplate = {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  methodology: PedagogyMethod
  duration: number
  rating: number
  downloads: number
  blocks: Array<{
    type: string
    title: string
    duration: number
    content: string
  }>
}

export const LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: 'inquiry-science-5e',
    title: '5E Inquiry: Phenomenon to Model',
    description:
      'Engage, Explore, Explain, Elaborate, Evaluate — ideal for NGSS three-dimensional learning.',
    subject: 'Science',
    grade: '6-8',
    methodology: '5E Model',
    duration: 55,
    rating: 4.9,
    downloads: 412,
    blocks: [
      { type: 'introduction', title: 'Phenomenon hook', duration: 5, content: 'Short puzzling demo or video clip.' },
      { type: 'activity', title: 'Explore stations', duration: 15, content: 'Low-structure data collection in teams.' },
      { type: 'content', title: 'Explain with models', duration: 15, content: 'Teacher-led sense-making + vocabulary.' },
      { type: 'activity', title: 'Elaborate application', duration: 12, content: 'New context, same core idea.' },
      { type: 'assessment', title: 'Evaluate exit ticket', duration: 8, content: '2–3 questions + confidence check.' },
    ],
  },
  {
    id: 'flipped-math',
    title: 'Flipped: Prior knowledge → Problem set',
    description: 'Assumes short pre-class video; class time for collaboration and error analysis.',
    subject: 'Mathematics',
    grade: '9-10',
    methodology: 'Flipped Classroom',
    duration: 50,
    rating: 4.7,
    downloads: 289,
    blocks: [
      { type: 'introduction', title: 'Warm-up retrieval', duration: 5, content: '3 spaced-review prompts from prior nights.' },
      { type: 'discussion', title: 'Clarify misconceptions', duration: 10, content: 'Whole-group Q&A from pre-class survey.' },
      { type: 'activity', title: 'Collaborative problem set', duration: 25, content: 'Progressive difficulty; teacher circulates.' },
      { type: 'assessment', title: 'Mastery check', duration: 10, content: 'Individual leveled problems + self-rubric.' },
    ],
  },
  {
    id: 'direct-ela',
    title: 'Direct Instruction: Close reading',
    description: 'Explicit modeling of annotation, guided practice, and independent application.',
    subject: 'English Language Arts',
    grade: '8',
    methodology: 'Direct Instruction',
    duration: 45,
    rating: 4.8,
    downloads: 356,
    blocks: [
      { type: 'introduction', title: 'Learning objective & criteria', duration: 5, content: 'I can… + success criteria on board.' },
      { type: 'content', title: 'Think-aloud modeling', duration: 12, content: 'Teacher models 1 paragraph with annotation.' },
      { type: 'activity', title: 'We do / guided', duration: 15, content: 'Shared text chunk with sentence stems.' },
      { type: 'activity', title: 'You do independent', duration: 10, content: 'Silent reading + margin notes.' },
      { type: 'assessment', title: 'Written response', duration: 3, content: 'One text-dependent question.' },
    ],
  },
  {
    id: 'pbl-social',
    title: 'Project milestone: Civic proposal',
    description: 'Driving question, research sprint, and public product checkpoint.',
    subject: 'Social Studies',
    grade: '9-12',
    methodology: 'Project-Based',
    duration: 90,
    rating: 4.85,
    downloads: 198,
    blocks: [
      { type: 'introduction', title: 'Entry event', duration: 10, content: 'Local issue video + need-to-know list.' },
      { type: 'activity', title: 'Research sprint', duration: 35, content: 'Roles: researcher, analyst, writer.' },
      { type: 'discussion', title: 'Gallery of sources', duration: 15, content: 'Teams share evidence quality.' },
      { type: 'activity', title: 'Prototype pitch', duration: 25, content: '3-slide proposal + peer feedback protocol.' },
      { type: 'assessment', title: 'Rubric self-score', duration: 5, content: 'Align to argument and evidence criteria.' },
    ],
  },
  {
    id: 'udl-stem',
    title: 'UDL STEM lab with choice boards',
    description: 'Multiple means of representation, action, and engagement in one investigation.',
    subject: 'STEM',
    grade: '4-5',
    methodology: 'Universal Design',
    duration: 60,
    rating: 4.75,
    downloads: 267,
    blocks: [
      { type: 'introduction', title: 'Goal + options', duration: 5, content: 'Visual + audio + text overview of task.' },
      { type: 'content', title: 'Mini-lesson choice', duration: 10, content: 'Video / reading / teacher small group.' },
      { type: 'activity', title: 'Investigation pathways', duration: 30, content: 'Choice board: build, simulate, or survey.' },
      { type: 'discussion', title: 'Reflection circle', duration: 10, content: 'What worked? What would you change?' },
      { type: 'assessment', title: 'Show what you know', duration: 5, content: 'Draw, write, or record — same rubric.' },
    ],
  },
  {
    id: 'inquiry-math',
    title: 'Inquiry launch: Notice & wonder',
    description: 'Low-floor, high-ceiling task with consolidation and formalization.',
    subject: 'Mathematics',
    grade: '6-7',
    methodology: 'Inquiry-Based',
    duration: 50,
    rating: 4.82,
    downloads: 331,
    blocks: [
      { type: 'introduction', title: 'Problem stem', duration: 5, content: 'Minimal prompt; private think time.' },
      { type: 'discussion', title: 'Notice & wonder', duration: 10, content: 'Public record of student questions.' },
      { type: 'activity', title: 'Investigation', duration: 22, content: 'Manipulatives / desmos; teacher presses reasoning.' },
      { type: 'content', title: 'Connect & formalize', duration: 8, content: 'Link strategies to standard algorithm or property.' },
      { type: 'assessment', title: 'Quick generalization', duration: 5, content: 'Does it always work? Counterexample chat.' },
    ],
  },
]

export const METHODOLOGY_FILTERS: PedagogyMethod[] = [
  'Direct Instruction',
  'Inquiry-Based',
  'Flipped Classroom',
  'Project-Based',
  '5E Model',
  'Universal Design',
]
