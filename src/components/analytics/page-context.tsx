/**
 * Describes the current page to the analytics tracker (page type, content id)
 * without any client JavaScript: the tracker reads these attributes after
 * each navigation.
 */
export function PageContext({ type, entityId }: { type: string; entityId?: string | null }) {
  return <div hidden data-page-context="" data-page-type={type} data-entity-id={entityId ?? undefined} />
}
