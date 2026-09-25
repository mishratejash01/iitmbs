import { Skeleton, SkeletonText } from '@/components/ui/skeleton'

/**
 * Shown the moment a link is clicked, while the next page renders. It also
 * lets Next.js prefetch the shell of pages that load data at request time,
 * so navigation starts at once instead of waiting for the server.
 */
export default function Loading() {
  return (
    <div className="container-page py-10 sm:py-14" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-6 h-10 w-full max-w-2xl" />
      <Skeleton className="mt-3 h-10 w-2/3 max-w-xl" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full" />
          <SkeletonText lines={5} />
        </div>
        <div className="hidden space-y-4 lg:block">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
