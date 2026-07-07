import { createResourceRouter } from '../utils/restRouter.js'

const JOB_COLUMNS = [
  'title', 'slug', 'department', 'location', 'employment_type',
  'experience', 'salary_range', 'description', 'requirements',
  'status', 'posted_at', 'closes_at', 'sort_order',
]

const router = createResourceRouter({
  table: 'jobs',
  label: 'Job',
  columns: JOB_COLUMNS,
  list: {
    orderBy: 'ORDER BY sort_order ASC, posted_at DESC NULLS LAST, created_at DESC',
    defaultLimit: 50,
    maxLimit: 200,
    filters: [['status', 'status']],
  },
  validateCreate: (body) => {
    if (!body.title || !body.slug) return 'title and slug are required'
    return null
  },
})

export default router
