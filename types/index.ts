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
  type: 'match' | 'task' | 'payment' | 'application' | 'message' | 'requirement' | 'system';
  createdAt: string;
  read: boolean;
  data?: unknown;
}

export type InboxThread = {
  id: string;
  name: string;
  peerPhotoUrl?: string;
  last: string;
  time: string;
  unread: number;
};

export interface StudentProfile {
  displayName: string;
  photoUri?: string;
  skills: string[];
  hourlyRate: number;
  availabilityNote: string;
  availableNow: boolean;
  bio?: string;
  /** Website or portfolio link */
  portfolioUrl?: string;
}
