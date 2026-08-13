export enum GroupType {
  Wells = 'Wells',
  Springs = 'Springs',
  Contacts = 'Contacts',
  Messages = 'Messages',
  Assets = 'Assets',
  Projects = 'Projects',
}

export const INCHES_IN_A_FOOT = 12

export const MAX_UPLOAD_SIZE_IN_MB = 250
export const MAX_UPLOAD_SIZE_IN_BYTES = MAX_UPLOAD_SIZE_IN_MB * 1024 * 1024

export const ALLOWED_FILE_EXTENSIONS = [
  'jpg',
  'png',
  'gif',
  'webp',
  'tiff',
  'pdf',
  'txt',
] as const

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'application/pdf',
  'text/plain',
])
