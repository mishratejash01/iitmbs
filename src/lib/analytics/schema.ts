import { z } from 'zod'

import { CLIENT_EVENTS } from './events'

const shortText = (max: number) => z.string().trim().max(max)

const propValue = z.union([z.string().max(300), z.number().finite(), z.boolean(), z.null()])

export const trackEventSchema = z.object({
  name: z.enum(CLIENT_EVENTS),
  path: z.string().max(500).regex(/^\//),
  page_view_id: z.uuid().optional(),
  page_type: shortText(40).optional(),
  entity_id: z.uuid().optional(),
  title: shortText(200).optional(),
  referrer: shortText(500).optional(),
  props: z
    .record(z.string().max(40), propValue.optional())
    .refine((value) => Object.keys(value).length <= 20, 'too many properties')
    .optional(),
})

export const trackPayloadSchema = z.object({
  anonymous_id: z.uuid(),
  session_id: z.uuid(),
  consent: z.enum(['essential', 'detailed']),
  screen: shortText(20).optional(),
  landing_path: shortText(500).optional(),
  referrer: shortText(500).optional(),
  utm: z
    .object({
      source: shortText(100).optional(),
      medium: shortText(100).optional(),
      campaign: shortText(100).optional(),
      term: shortText(100).optional(),
      content: shortText(100).optional(),
    })
    .optional(),
  events: z.array(trackEventSchema).min(1).max(25),
})

export type TrackPayloadInput = z.infer<typeof trackPayloadSchema>
