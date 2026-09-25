import { NotFoundContent } from '@/components/not-found/not-found-content'

/**
 * notFound() inside the public pages. The public layout already draws the
 * header and footer, so this renders only the page body.
 */
export default function PublicNotFound() {
  return <NotFoundContent />
}
