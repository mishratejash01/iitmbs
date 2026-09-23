import type { HTMLAttributes } from 'react'

type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/** Headings get a self-link so any section can be shared. */
export function headingWithAnchor(Tag: HeadingTag) {
  function Heading({ id, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    if (!id) return <Tag {...props}>{children}</Tag>
    return (
      <Tag id={id} {...props}>
        <a href={`#${id}`} className="heading-anchor">
          {children}
        </a>
      </Tag>
    )
  }
  Heading.displayName = `Heading(${Tag})`
  return Heading
}
