import { createResourceRouter } from '../utils/restRouter.js'

// Match columns that exist in DB (og_image_* omitted if your migration doesn't add them)
const BLOG_COLUMNS = [
  'title', 'slug', 'excerpt', 'content', 'author_id', 'author_name', 'tags',
  'status', 'published_at', 'meta_title', 'meta_description', 'canonical_url', 'meta_robots',
  'schema_code',
  'featured_image_url', 'featured_image_alt', 'featured_image_name',
  'og_image_url', 'og_image_alt', 'og_image_name',
  'content_sections', // JSONB: array of { title, content, images: [ { url, alt, name } ] }
  'view_count', 'is_featured', 'is_pinned', 'sort_order', 'allow_comments'
]

function valueForDb(col, val) {
  if (col === 'content_sections' && val != null && typeof val === 'object') {
    return JSON.stringify(val)
  }
  return val
}

const router = createResourceRouter({
  table: 'blogs',
  label: 'Blog',
  columns: BLOG_COLUMNS,
  transform: valueForDb,
  list: {
    orderBy: 'ORDER BY sort_order ASC, published_at DESC NULLS LAST, created_at DESC',
    defaultLimit: 50,
    maxLimit: 100,
    filters: [['status', 'status'], ['slug', 'slug']],
  },
  validateCreate: (body) => {
    if (!body.title || !body.slug || body.content === undefined) return 'title, slug, and content are required'
    return null
  },
  requireAuthOnCreate: false,
})

export default router
