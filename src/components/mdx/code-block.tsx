import type { HTMLAttributes } from 'react'

/**
 * Wraps Shiki's <pre> with a copy button. The button is wired by the global
 * client enhancer (event delegation), so code blocks ship no per-block JS.
 */
export function CodeBlock({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  return (
    <div className="group relative">
      <pre {...props}>{children}</pre>
      <button
        type="button"
        data-copy-code=""
        data-track="code_copy"
        className="absolute top-2 right-2 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted opacity-100 transition-opacity hover:text-text focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        Copy
      </button>
    </div>
  )
}
