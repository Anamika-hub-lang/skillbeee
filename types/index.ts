export type UserRole = 'student' | 'client';

export type GigCategory =
  | 'shopify'
  | 'canva'
  | 'video'
  | 'framer'
  | 'ai'
  | 'resume'
  | 'ppt'
  | 'code';

export type TaskStep = 'accepted' | 'working' | 'review' | 'paid';

export interface Gig {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  deadlineHours: number;
  urgent: boolean;
  skills: string[];
  clientName: string;
  clientAvatar?: string;
  category: GigCategory;
  postedAgo: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  gigId: string;
  senderId: string;
  text: string;
  createdAt: string;
  attachmentUri?: string;
  isVoice?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'match' | 'task' | 'payment';
  createdAt: string;
  read: boolean;
}

export interface StudentProfile {
  displayName: string;
  photoUri?: string;
  skills: string[];
  hourlyRate: number;
  availabilityNote: string;
  availableNow: boolean;
}
