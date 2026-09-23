/**
 * Browser-side signed upload to Cloudinary. The server signs the request
 * (/api/admin/cloudinary-sign, staff only); the file goes straight from the
 * editor's browser to Cloudinary and never passes through our functions.
 */

export type UploadedAsset = {
  public_id: string
  resource_type: 'image' | 'raw' | 'video'
  delivery_type: 'upload' | 'authenticated'
  format: string | null
  width: number | null
  height: number | null
  bytes: number | null
}

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export function resourceTypeFor(file: File): UploadedAsset['resource_type'] {
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') return 'image'
  if (file.type.startsWith('video/')) return 'video'
  // PDFs and sheets are "raw" so they are never transformed or publicly listed.
  return 'raw'
}

export async function uploadToCloudinary(
  file: File,
  options: {
    type: 'upload' | 'authenticated'
    folder: string
    onProgress?: (fraction: number) => void
  },
): Promise<UploadedAsset> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Files must be 50 MB or smaller.')

  const signResponse = await fetch('/api/admin/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: options.folder, type: options.type }),
  })
  const signed = (await signResponse.json().catch(() => ({}))) as {
    error?: string
    cloudName?: string
    apiKey?: string
    timestamp?: number
    signature?: string
    folder?: string
    type?: string
  }
  if (!signResponse.ok || !signed.signature)
    throw new Error(signed.error ?? 'Could not authorise the upload.')

  const resourceType = resourceTypeFor(file)
  const body = new FormData()
  body.set('file', file)
  body.set('api_key', String(signed.apiKey))
  body.set('timestamp', String(signed.timestamp))
  body.set('signature', signed.signature)
  body.set('folder', String(signed.folder))
  body.set('type', String(signed.type))

  // XMLHttpRequest, because fetch cannot report upload progress.
  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      let json: Record<string, unknown> = {}
      try {
        json = JSON.parse(xhr.responseText) as Record<string, unknown>
      } catch {
        // handled below
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json)
      else
        reject(
          new Error(
            (json.error as { message?: string } | undefined)?.message ??
              `Upload failed (${xhr.status}).`,
          ),
        )
    }
    xhr.onerror = () => reject(new Error('Network error while uploading.'))
    xhr.send(body)
  })

  const number = (value: unknown) => (typeof value === 'number' ? value : null)
  return {
    public_id: String(result.public_id),
    resource_type: resourceType,
    delivery_type: options.type,
    format:
      typeof result.format === 'string'
        ? result.format
        : (file.name.split('.').pop()?.toLowerCase() ?? null),
    width: number(result.width),
    height: number(result.height),
    bytes: number(result.bytes),
  }
}
