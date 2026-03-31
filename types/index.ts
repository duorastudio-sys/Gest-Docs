export type Document = {
  id: string
  name: string
  url: string
  size: number
  mime_type: string
  created_at: string
  user_id: string
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}
