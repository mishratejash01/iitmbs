'use client'

import 'katex/dist/katex.min.css'

import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from 'react'

import { previewMdx } from '@/app/admin/actions'
import type { MdxPreview } from '@/lib/admin/preview'
import { cn } from '@/lib/utils/cn'

import { ImageUploadFlow } from './image-picker'

type Snippet = {
  label: string
  title: string
  before: string
  after?: string
  placeholder?: string
  block?: boolean
}

const SNIPPETS: Snippet[] = [
  { label: 'H2', title: 'Section heading', before: '## ', placeholder: 'Heading', block: true },
  { label: 'H3', title: 'Sub-heading', before: '### ', placeholder: 'Heading', block: true },
  { label: 'B', title: 'Bold (Ctrl+B)', before: '**', after: '**', placeholder: 'bold text' },
  { label: 'I', title: 'Italic (Ctrl+I)', before: '_', after: '_', placeholder: 'italic text' },
  {
    label: 'Link',
    title: 'Link (Ctrl+K)',
    before: '[',
    after: '](/qualifier)',
    placeholder: 'link text',
  },
  { label: '•', title: 'Bulleted list', before: '- ', placeholder: 'item', block: true },
  { label: '1.', title: 'Numbered list', before: '1. ', placeholder: 'step', block: true },
  { label: '`x`', title: 'Inline code', before: '`', after: '`', placeholder: 'code' },
  {
    label: '{ }',
    title: 'Code block',
    before: '```python\n',
    after: '\n```',
    placeholder: 'print("hello")',
    block: true,
  },
  { label: '∑', title: 'Inline maths', before: '$', after: '$', placeholder: 'x^2' },
  {
    label: '∫',
    title: 'Display maths',
    before: '$$\n',
    after: '\n$$',
    placeholder: '\\int_0^1 x\\,dx = \\tfrac12',
    block: true,
  },
  {
    label: 'Table',
    title: 'Table',
    before: '| Column | Column |\n| --- | --- |\n| ',
    after: ' | value |',
    placeholder: 'value',
    block: true,
  },
  {
    label: 'Callout',
    title: 'Callout box',
    before: '<Callout type="tip" title="Tip">\n',
    after: '\n</Callout>',
    placeholder: 'Text',
    block: true,
  },
  {
    label: 'Key idea',
    title: 'Key idea',
    before: '<KeyIdea title="Key idea">\n',
    after: '\n</KeyIdea>',
    placeholder: 'The one thing to remember',
    block: true,
  },
  {
    label: 'Steps',
    title: 'Numbered steps',
    before: '<Steps>\n1. ',
    after: '\n</Steps>',
    placeholder: 'First step',
    block: true,
  },
  {
    label: 'Related',
    title: 'Related link card',
    before: '<RelatedLink href="',
    after: '" />',
    placeholder: '/qualifier/eligibility',
    block: true,
  },
  {
    label: 'Video',
    title: 'YouTube video',
    before: '<YouTube id="',
    after: '" title="Video title" />',
    placeholder: 'VIDEO_ID',
    block: true,
  },
]

const words = (text: string) =>
  text
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

/**
 * Markdown/MDX editor with a toolbar, image upload and a live preview that
 * uses the site's real pipeline (KaTeX, Shiki, sanitiser) on the server.
 */
export function MdxEditor({
  name,
  label,
  defaultValue,
  rows = 16,
  required,
  invalid,
  describedBy,
}: {
  name: string
  label: string
  defaultValue: string
  rows?: number
  required?: boolean
  invalid?: boolean
  describedBy?: string
}) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [view, setView] = useState<'write' | 'preview' | 'split'>('write')
  const [preview, setPreview] = useState<MdxPreview | null>(null)
  const [previewFor, setPreviewFor] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [isPending, startTransition] = useTransition()

  const previewVisible = view !== 'write'
  useEffect(() => {
    if (!previewVisible || previewFor === value) return
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await previewMdx(value)
        setPreview(result)
        setPreviewFor(value)
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [previewVisible, previewFor, value])

  function insert(snippet: Snippet) {
    const textarea = ref.current
    if (!textarea) return
    const { selectionStart: start, selectionEnd: end } = textarea
    const selected = value.slice(start, end) || snippet.placeholder || ''
    const needsBreak = snippet.block && start > 0 && value[start - 1] !== '\n'
    const prefix = `${needsBreak ? '\n\n' : ''}${snippet.before}`
    const next = `${value.slice(0, start)}${prefix}${selected}${snippet.after ?? ''}${value.slice(end)}`
    setValue(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    })
  }

  function insertText(text: string) {
    const textarea = ref.current
    const at = textarea?.selectionStart ?? value.length
    const next = `${value.slice(0, at)}${text}${value.slice(at)}`
    setValue(next)
    requestAnimationFrame(() => textarea?.focus())
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.metaKey || event.ctrlKey)) return
    const key = event.key.toLowerCase()
    const shortcut =
      key === 'b' ? SNIPPETS[2] : key === 'i' ? SNIPPETS[3] : key === 'k' ? SNIPPETS[4] : null
    if (shortcut) {
      event.preventDefault()
      insert(shortcut)
    }
  }

  const count = words(value)
  const problems =
    preview && previewFor === value
      ? [
          ...(preview.error ? [`Not valid MDX — shown as plain Markdown: ${preview.error}`] : []),
          ...preview.removed.map((r) => `Removed: ${r}`),
        ]
      : []

  return (
    <div className="rounded-control border border-border-strong bg-card focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <div
          role="toolbar"
          aria-label={`${label} formatting`}
          aria-controls={id}
          className="flex flex-wrap gap-0.5"
        >
          {SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              title={snippet.title}
              aria-label={snippet.title}
              onClick={() => insert(snippet)}
              disabled={view === 'preview'}
              className="min-h-8 min-w-8 rounded px-1.5 text-xs font-medium text-text hover:bg-surface disabled:opacity-40"
            >
              {snippet.label}
            </button>
          ))}
          <button
            type="button"
            title="Upload an image"
            onClick={() => setShowUpload((v) => !v)}
            aria-expanded={showUpload}
            className="min-h-8 rounded px-1.5 text-xs font-medium text-text hover:bg-surface"
          >
            Image
          </button>
        </div>
        <div
          className="ml-auto flex rounded-control border border-border p-0.5 text-xs"
          role="group"
          aria-label="Editor view"
        >
          {(['write', 'split', 'preview'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={cn(
                'min-h-7 rounded px-2 capitalize',
                view === mode
                  ? 'bg-accent-soft font-medium text-accent-ink'
                  : 'text-muted hover:text-text',
                mode === 'split' && 'hidden xl:block',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      {showUpload ? (
        <div className="border-b border-border p-2">
          <ImageUploadFlow
            compact
            onDone={(asset) => {
              insertText(`\n\n![${asset.alt_text}](cloudinary:${asset.public_id})\n\n`)
              setShowUpload(false)
            }}
          />
        </div>
      ) : null}
      <div className={cn(view === 'split' && 'xl:grid xl:grid-cols-2')}>
        <textarea
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={rows}
          required={required}
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          spellCheck
          className={cn(
            'block w-full resize-y bg-transparent px-3 py-2 font-mono text-small leading-6 text-text outline-none',
            view === 'preview' && 'sr-only',
            view === 'split' && 'xl:border-r xl:border-border',
          )}
        />
        {previewVisible ? (
          <div
            className="max-h-[70vh] overflow-y-auto px-4 py-3"
            aria-live="polite"
            aria-busy={isPending}
          >
            {preview && previewFor !== null ? (
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: preview.html }} />
            ) : (
              <p className="text-small text-muted">Rendering preview…</p>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-1.5 text-xs text-muted">
        <span>
          {count} words · {Math.max(1, Math.round(count / 200))} min read
        </span>
        {isPending ? <span>Updating preview…</span> : null}
        {problems.map((problem) => (
          <span key={problem} className="text-warning">
            {problem}
          </span>
        ))}
      </div>
    </div>
  )
}
