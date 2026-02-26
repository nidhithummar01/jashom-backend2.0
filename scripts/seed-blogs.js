import 'dotenv/config'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env')
  process.exit(1)
}

const client = new pg.Client({ connectionString })

const seedBlogs = [
  {
    title: 'GPU Acceleration in AI: Transforming Machine Learning Performance',
    slug: 'gpu-acceleration-ai-machine-learning',
    excerpt: 'Explore how GPU optimization is revolutionizing AI workloads, reducing training time from weeks to hours, and enabling real-time inference at scale.',
    content: 'Full article content. See content_sections for structured sections.',
    author_id: 1,
    author_name: 'Jashom Team',
    tags: 'AI, GPU, machine learning, deep learning',
    status: 'published',
    published_at: new Date('2026-02-08T10:00:00Z'),
    meta_title: 'GPU Acceleration in AI | Jashom Blog',
    meta_description: 'How GPU optimization is revolutionizing AI workloads and reducing training times.',
    canonical_url: 'https://jashom-website-2-0.vercel.app/blogs/gpu-acceleration-ai-machine-learning',
    meta_robots: 'index, follow',
    featured_image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    featured_image_alt: 'GPU and AI concept',
    is_featured: true,
    sort_order: 0,
    allow_comments: true,
    view_count: 128,
    content_sections: [
      {
        title: 'Introduction',
        content: '<p>In the rapidly evolving landscape of artificial intelligence, GPU acceleration has emerged as a game-changing technology that\'s fundamentally transforming how we approach machine learning workloads. What once took weeks of computational time can now be accomplished in mere hours, opening up new possibilities for real-time AI applications at unprecedented scales.</p>',
        images: []
      },
      {
        title: 'The Power of Parallel Processing',
        content: '<p>Graphics Processing Units (GPUs) were originally designed to handle the parallel processing demands of rendering complex graphics. However, their architecture—featuring thousands of smaller, efficient cores designed for simultaneous operations—makes them ideally suited for the matrix operations that form the backbone of machine learning algorithms.</p><p>Unlike traditional CPUs that excel at sequential processing, GPUs can perform thousands of calculations simultaneously.</p>',
        images: [
          { url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', alt: 'Parallel processing architecture', name: 'parallel-arch.jpg' }
        ]
      },
      {
        title: 'Real-World Impact on Training Times',
        content: '<p>The impact of GPU acceleration on training times is nothing short of revolutionary. Consider these real-world examples:</p><ul><li><strong>Image Classification:</strong> Training a ResNet-50 model on ImageNet that would take 29 days on a CPU can be completed in just 4 hours on a modern GPU cluster.</li><li><strong>Natural Language Processing:</strong> Large language models that required weeks of training time can now be trained in days with proper GPU optimization.</li></ul>',
        images: [
          { url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600', alt: 'Real-time inference', name: 'realtime-inference.jpg' }
        ]
      },
      {
        title: 'Conclusion',
        content: '<p>GPU acceleration has transformed machine learning from an academic curiosity into a practical tool that\'s reshaping industries worldwide. By reducing training times from weeks to hours and enabling real-time inference at scale, GPUs have made it possible to deploy AI solutions that were previously impractical or impossible.</p>',
        images: []
      }
    ]
  },
  {
    title: 'Building Scalable APIs for Modern Applications',
    slug: 'building-scalable-apis-modern-apps',
    excerpt: 'Best practices for designing and implementing APIs that scale with your product.',
    content: 'Full article content. See content_sections for structured sections.',
    author_id: 1,
    author_name: 'Dev Team',
    tags: 'API, backend, scalability, REST',
    status: 'published',
    published_at: new Date('2026-02-15T14:00:00Z'),
    meta_title: 'Building Scalable APIs | Jashom Blog',
    meta_description: 'Best practices for designing and implementing scalable APIs.',
    featured_image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    featured_image_alt: 'Code and API development',
    is_featured: false,
    sort_order: 1,
    allow_comments: true,
    view_count: 64,
    content_sections: [
      {
        title: 'Why API Design Matters',
        content: '<p>Well-designed APIs are the backbone of modern applications. They enable frontend and mobile clients to communicate with your backend, support third-party integrations, and make it possible to scale your system as demand grows.</p>',
        images: [
          { url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600', alt: 'Code and APIs', name: 'code-apis.jpg' }
        ]
      },
      {
        title: 'REST vs GraphQL',
        content: '<p>Choose REST for simplicity and broad tooling support. Choose GraphQL when you need flexible queries and want to minimize over-fetching. Many teams use both: REST for public or partner APIs, GraphQL for internal or mobile clients.</p>',
        images: [
          { url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600', alt: 'API architecture', name: 'api-arch.jpg' }
        ]
      },
      {
        title: 'Scaling and Caching',
        content: '<p>Use caching (HTTP cache headers, Redis, or CDN) to reduce load. Design for statelessness so you can add more app servers. Use connection pooling and read replicas for the database. Monitor latency and error rates so you know when to scale.</p>',
        images: [
          { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', alt: 'Analytics and scaling', name: 'scaling.jpg' }
        ]
      }
    ]
  },
  {
    title: 'CUDA Development: Best Practices for High-Performance Computing',
    slug: 'cuda-development-best-practices',
    excerpt: 'Explore the essentials of CUDA architecture, its advantages, pitfalls, and implementation tips for optimal GPU performance.',
    content: 'Full article content. See content_sections for structured sections.',
    author_id: 1,
    author_name: 'Jashom Team',
    tags: 'CUDA, GPU, high-performance computing, parallel computing',
    status: 'published',
    published_at: new Date('2026-02-18T09:00:00Z'),
    meta_title: 'CUDA Best Practices | Jashom Blog',
    meta_description: 'Essentials of CUDA architecture and implementation tips for optimal GPU performance.',
    featured_image_url: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800',
    featured_image_alt: 'CUDA and GPU computing',
    is_featured: false,
    sort_order: 2,
    allow_comments: true,
    view_count: 92,
    content_sections: [
      {
        title: 'Introduction to CUDA',
        content: '<p>CUDA (Compute Unified Device Architecture) is NVIDIA\'s parallel computing platform that enables developers to harness the power of GPUs for general-purpose computing. From scientific simulations to deep learning, CUDA has become the backbone of accelerated computing.</p>',
        images: []
      },
      {
        title: 'Memory Management and Optimization',
        content: '<p>Efficient memory usage is critical in CUDA programs. Understand the memory hierarchy: global, shared, and register memory. Use coalesced access patterns, avoid bank conflicts in shared memory, and leverage texture memory where appropriate for better performance.</p>',
        images: [
          { url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600', alt: 'GPU memory architecture', name: 'cuda-memory.jpg' }
        ]
      },
      {
        title: 'Conclusion',
        content: '<p>Mastering CUDA requires practice and attention to detail. Start with simple kernels, profile your code, and iterate. The performance gains from well-optimized GPU code can be transformative for your applications.</p>',
        images: []
      }
    ]
  },
  {
    title: 'Custom AI Solutions: Development Roadmap, Costs & Benefits',
    slug: 'custom-ai-solutions-development-roadmap',
    excerpt: 'Discover the complete guide to building custom AI solutions, from initial assessment and architecture design to deployment and ROI maximization.',
    content: 'Full article content. See content_sections for structured sections.',
    author_id: 1,
    author_name: 'Jashom Team',
    tags: 'AI, custom solutions, machine learning, roadmap',
    status: 'published',
    published_at: new Date('2026-02-20T11:00:00Z'),
    meta_title: 'Custom AI Solutions Guide | Jashom Blog',
    meta_description: 'Guide to building custom AI solutions: assessment, architecture, deployment, and ROI.',
    featured_image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    featured_image_alt: 'AI and machine learning',
    is_featured: false,
    sort_order: 3,
    allow_comments: true,
    view_count: 56,
    content_sections: [
      {
        title: 'Why Custom AI?',
        content: '<p>Off-the-shelf AI tools work for common use cases, but custom AI solutions give you full control over data, model architecture, and integration with your existing systems. When your requirements are unique or your data is sensitive, custom development is often the right choice.</p>',
        images: []
      },
      {
        title: 'Phases of Development',
        content: '<p>A typical custom AI project moves through discovery, data preparation, model development, integration, and deployment. Each phase has clear deliverables and checkpoints. Budget 3–6 months for a first production deployment depending on complexity.</p>',
        images: [
          { url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600', alt: 'Development workflow', name: 'ai-workflow.jpg' }
        ]
      },
      {
        title: 'Conclusion',
        content: '<p>Custom AI is an investment that pays off when you need tailored performance, compliance, or integration. Partner with a team that has experience across the full stack—data, models, and production systems.</p>',
        images: []
      }
    ]
  }
]

const insertColumns = [
  'title', 'slug', 'excerpt', 'content', 'author_id', 'author_name', 'tags',
  'status', 'published_at', 'meta_title', 'meta_description', 'canonical_url', 'meta_robots',
  'featured_image_url', 'featured_image_alt',
  'content_sections', 'view_count', 'is_featured', 'is_pinned', 'sort_order', 'allow_comments'
]

async function run() {
  try {
    await client.connect()

    console.log('Truncating blogs table (removing all existing rows)...')
    await client.query('TRUNCATE TABLE blogs RESTART IDENTITY CASCADE')
    console.log('  Done.')

    console.log('Seeding blogs with new structure (content_sections)...')
    for (let i = 0; i < seedBlogs.length; i++) {
      const b = seedBlogs[i]
      const values = [
        b.title,
        b.slug,
        b.excerpt ?? null,
        b.content,
        b.author_id ?? null,
        b.author_name ?? null,
        b.tags ?? null,
        b.status ?? 'draft',
        b.published_at ?? null,
        b.meta_title ?? null,
        b.meta_description ?? null,
        b.canonical_url ?? null,
        b.meta_robots ?? null,
        b.featured_image_url ?? null,
        b.featured_image_alt ?? null,
        JSON.stringify(b.content_sections || []),
        b.view_count ?? 0,
        b.is_featured ?? false,
        b.is_pinned ?? false,
        b.sort_order ?? 0,
        b.allow_comments ?? false
      ]
      const placeholders = insertColumns.map((_, j) => `$${j + 1}`).join(', ')
      const { rows } = await client.query(
        `INSERT INTO blogs (${insertColumns.join(', ')}) VALUES (${placeholders}) RETURNING id, title, slug, status`,
        values
      )
      console.log(`  ${i + 1}. ${rows[0].title} (id: ${rows[0].id}, slug: ${rows[0].slug}, status: ${rows[0].status})`)
    }

    console.log(`Done. Seeded ${seedBlogs.length} blog(s) with content_sections.`)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
