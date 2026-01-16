export interface PinData {
  id: string
  lat: number
  lng: number
  title: string
  description: string
  authorName: string
  createdAt: string
}

export interface CommentData {
  id: string
  pinId: string
  authorName: string
  content: string
  createdAt: string
}

export interface PinWithComments extends PinData {
  comments: CommentData[]
}
