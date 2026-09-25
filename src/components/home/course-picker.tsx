'use client'

import { BookOpen, ChevronDown, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/client'

export type PickerLevel = {
  id: string
  label: string
  courses: Array<{ name: string; href: string }>
}

const selectClasses =
  'min-h-14 w-full cursor-pointer appearance-none truncate rounded-full border-0 bg-card pr-12 pl-12 text-left text-[1.0625rem] text-text focus-visible:outline-lime'

/**
 * "Choose your level and course, then Go." With JavaScript, Go opens the
 * course's page. Without it, the form still works: it searches for the
 * chosen course's name.
 */
export function CoursePicker({ levels }: { levels: PickerLevel[] }) {
  const router = useRouter()
  const [levelId, setLevelId] = useState(levels[0]?.id ?? '')
  const level = levels.find((l) => l.id === levelId) ?? levels[0]
  const [courseName, setCourseName] = useState(level?.courses[0]?.name ?? '')
  if (!level) return null

  const onLevelChange = (id: string) => {
    setLevelId(id)
    setCourseName(levels.find((l) => l.id === id)?.courses[0]?.name ?? '')
  }

  return (
    <form
      action="/search"
      className="mx-auto mt-10 max-w-3xl"
      aria-labelledby="picker-heading"
      onSubmit={(event) => {
        const course = level.courses.find((c) => c.name === courseName)
        if (!course) return
        event.preventDefault()
        track('nav_click', { label: `home_picker:${level.id}:${course.name}` })
        router.push(course.href)
      }}
    >
      <p id="picker-heading" className="text-[1.125rem] leading-7 font-medium sm:text-[1.3125rem]">
        Choose your level and course
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="picker-level" className="sr-only">
            Level
          </label>
          <GraduationCap
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-accent-ink"
          />
          <select
            id="picker-level"
            value={level.id}
            onChange={(event) => onLevelChange(event.target.value)}
            className={selectClasses}
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-text"
          />
        </div>
        <div className="relative flex-1">
          <label htmlFor="picker-course" className="sr-only">
            Course
          </label>
          <BookOpen
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-accent-ink"
          />
          <select
            id="picker-course"
            name="q"
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            className={selectClasses}
          >
            {level.courses.map((course) => (
              <option key={course.href} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-text"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          variant="highlight"
          className="min-h-14 px-10 text-[1.125rem] font-bold"
        >
          Go
        </Button>
      </div>
    </form>
  )
}
