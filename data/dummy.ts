import type { Gig, NotificationItem } from '@/types';

export const DUMMY_GIGS: Gig[] = [
  {
    id: 'g1',
    title: 'Shopify theme tweaks',
    description: 'Fix header spacing + mobile menu on a Dawn child theme. 1–2 hours max.',
    budget: 85,
    currency: 'USD',
    deadlineHours: 6,
    urgent: true,
    skills: ['Shopify', 'CSS', 'Liquid'],
    clientName: 'Maya',
    category: 'shopify',
    postedAgo: '12m',
    imageUrl:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  },
  {
    id: 'g2',
    title: 'Canva pitch deck polish',
    description: '12 slides — unify fonts, add icons, export PDF + PPTX.',
    budget: 60,
    currency: 'USD',
    deadlineHours: 24,
    urgent: false,
    skills: ['Canva', 'Brand', 'Storytelling'],
    clientName: 'Jordan',
    category: 'canva',
    postedAgo: '1h',
    imageUrl:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
  },
  {
    id: 'g3',
    title: 'Short-form edit (Reels)',
    description: '3 clips (15–30s) with captions + trending audio suggestions.',
    budget: 120,
    currency: 'USD',
    deadlineHours: 8,
    urgent: true,
    skills: ['CapCut', 'Premiere', 'Motion'],
    clientName: 'Alex',
    category: 'video',
    postedAgo: '2h',
    imageUrl:
      'https://images.unsplash.com/photo-1492691527719-9d1e07a87bc8?w=800&q=80',
  },
  {
    id: 'g4',
    title: 'Framer landing section',
    description: 'Add pricing table + FAQ accordion. Match existing style tokens.',
    budget: 95,
    currency: 'USD',
    deadlineHours: 12,
    urgent: false,
    skills: ['Framer', 'Web', 'UI'],
    clientName: 'Sam',
    category: 'framer',
    postedAgo: '3h',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
  {
    id: 'g5',
    title: 'n8n mini-workflow',
    description: 'Google Sheet → Slack alerts when a row changes. Quick win.',
    budget: 70,
    currency: 'USD',
    deadlineHours: 48,
    urgent: false,
    skills: ['n8n', 'Automation', 'APIs'],
    clientName: 'Riley',
    category: 'ai',
    postedAgo: '5h',
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  },
];

export const SKILL_SUGGESTIONS = [
  'Shopify',
  'Canva',
  'Video editing',
  'Framer',
  'AI automation',
  'Resume design',
  'PPT',
  'React Native',
  'Notion',
  'Figma',
];

export const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: "It's a match!",
    body: 'Maya accepted your offer for Shopify tweaks.',
    type: 'match',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'n2',
    title: 'Task update',
    body: 'Jordan marked the deck as in review.',
    type: 'task',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'n3',
    title: 'Payment released',
    body: '$60 landed in your SkillBee wallet.',
    type: 'payment',
    createdAt: new Date().toISOString(),
    read: true,
  },
];
