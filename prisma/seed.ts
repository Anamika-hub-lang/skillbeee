import {
  PrismaClient,
  RequirementCategory,
  RequirementStatus,
  UserRole,
  NotificationType,
} from '@prisma/client';

const prisma = new PrismaClient();

/** Stable UUIDs for local seed — replace with real `auth.users` ids in production. */
const SEED_CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const SEED_STUDENT_ID = '22222222-2222-4222-8222-222222222222';

async function main() {
  await prisma.user.upsert({
    where: { id: SEED_CLIENT_ID },
    create: {
      id: SEED_CLIENT_ID,
      email: 'client@skillbee.local',
      role: UserRole.client,
    },
    update: { role: UserRole.client, email: 'client@skillbee.local' },
  });
  await prisma.profile.upsert({
    where: { userId: SEED_CLIENT_ID },
    create: {
      userId: SEED_CLIENT_ID,
      displayName: 'Maya',
      skills: [],
      hourlyRate: 0,
      availabilityNote: null,
      availableNow: false,
    },
    update: { displayName: 'Maya' },
  });

  await prisma.user.upsert({
    where: { id: SEED_STUDENT_ID },
    create: {
      id: SEED_STUDENT_ID,
      email: 'student@skillbee.local',
      role: UserRole.student,
    },
    update: { email: 'student@skillbee.local' },
  });
  await prisma.profile.upsert({
    where: { userId: SEED_STUDENT_ID },
    create: {
      userId: SEED_STUDENT_ID,
      displayName: 'Demo Student',
      skills: ['React Native', 'Shopify'],
      hourlyRate: 35,
      availabilityNote: 'Evenings (ET)',
      availableNow: true,
    },
    update: {},
  });

  await prisma.notification.deleteMany({ where: { userId: SEED_STUDENT_ID } });
  await prisma.requirement.deleteMany({ where: { clientId: SEED_CLIENT_ID } });

  const rows: Array<{
    title: string;
    description: string;
    budget: number;
    deadlineHours: number;
    urgent: boolean;
    category: RequirementCategory;
    skills: string[];
    imageUrl: string;
  }> = [
    {
      title: 'Shopify theme tweaks',
      description: 'Fix header spacing + mobile menu on a Dawn child theme. 1–2 hours max.',
      budget: 85,
      deadlineHours: 6,
      urgent: true,
      category: RequirementCategory.shopify,
      skills: ['Shopify', 'CSS', 'Liquid'],
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    },
    {
      title: 'Canva pitch deck polish',
      description: '12 slides — unify fonts, add icons, export PDF + PPTX.',
      budget: 60,
      deadlineHours: 24,
      urgent: false,
      category: RequirementCategory.canva,
      skills: ['Canva', 'Brand', 'Storytelling'],
      imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
    },
    {
      title: 'Short-form edit (Reels)',
      description: '3 clips (15–30s) with captions + trending audio suggestions.',
      budget: 120,
      deadlineHours: 8,
      urgent: true,
      category: RequirementCategory.video,
      skills: ['CapCut', 'Premiere', 'Motion'],
      imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07a87bc8?w=800&q=80',
    },
    {
      title: 'Framer landing section',
      description: 'Add pricing table + FAQ accordion. Match existing style tokens.',
      budget: 95,
      deadlineHours: 12,
      urgent: false,
      category: RequirementCategory.framer,
      skills: ['Framer', 'Web', 'UI'],
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    },
    {
      title: 'n8n mini-workflow',
      description: 'Google Sheet → Slack alerts when a row changes. Quick win.',
      budget: 70,
      deadlineHours: 48,
      urgent: false,
      category: RequirementCategory.ai,
      skills: ['n8n', 'Automation', 'APIs'],
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    },
  ];

  for (const g of rows) {
    const req = await prisma.requirement.create({
      data: {
        clientId: SEED_CLIENT_ID,
        title: g.title,
        description: g.description,
        budget: g.budget,
        currency: 'INR',
        deadlineHours: g.deadlineHours,
        urgent: g.urgent,
        category: g.category,
        imageUrl: g.imageUrl,
        status: RequirementStatus.open,
        currentStep: null,
        skills: {
          create: g.skills.map((name) => ({ name })),
        },
      },
    });
    // eslint-disable-next-line no-console
    console.log('Seeded requirement', req.id, req.title);
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: SEED_STUDENT_ID,
        title: "It's a match!",
        body: 'Maya accepted your offer for Shopify tweaks.',
        type: NotificationType.match,
        read: false,
      },
      {
        userId: SEED_STUDENT_ID,
        title: 'Task update',
        body: 'Jordan marked the deck as in review.',
        type: NotificationType.task,
        read: false,
      },
      {
        userId: SEED_STUDENT_ID,
        title: 'Payment released',
        body: '₹5,000 landed in your SkillBee wallet.',
        type: NotificationType.payment,
        read: true,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
