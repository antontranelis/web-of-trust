import { useParams, Link } from 'react-router-dom'
import Markdown from 'markdown-to-jsx'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { getPost } from '../content/blog'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Artikel nicht gefunden</h1>
            <Link to="/blog" className="text-primary hover:underline">
              Zurück zum Blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Alle Artikel
        </Link>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(post.date).toLocaleDateString('de-DE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {post.author}
          </span>
        </div>

        <article className="prose prose-slate max-w-none
          [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-6
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80
          [&_strong]:text-foreground [&_strong]:font-semibold
          [&_em]:italic
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-muted-foreground
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:text-muted-foreground
          [&_li]:mb-1.5 [&_li]:leading-relaxed
          [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-foreground
          [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4
          [&_pre_code]:bg-transparent [&_pre_code]:p-0
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
          [&_table]:w-full [&_table]:mb-4
          [&_th]:text-left [&_th]:p-2 [&_th]:border-b [&_th]:border-border [&_th]:font-semibold [&_th]:text-foreground
          [&_td]:p-2 [&_td]:border-b [&_td]:border-border [&_td]:text-muted-foreground
          [&_hr]:border-border [&_hr]:my-8
        ">
          <Markdown>{post.content}</Markdown>
        </article>
      </main>
      <Footer />
    </div>
  )
}
