import { normalizeSampleUrls } from '@/lib/applicationSampleUrls';
import { supabase } from '@/lib/supabase';
import { DEFAULT_IN_CHUNK_SIZE, selectWhereInChunks, throwOnPostgrestError } from '@/lib/supabase/queryHelpers';

export async function submitApplication(input: {
  requirementId: string;
  studentId: string;
  coverNote?: string | null;
  sampleUrls: string[];
}): Promise<{ id: string }> {
  if (!input.sampleUrls.length) throw new Error('Add at least one work sample');

  const { data: req, error: reqErr } = await supabase
    .from('requirements')
    .select('id, clientId, status')
    .eq('id', input.requirementId)
    .maybeSingle();
  throwOnPostgrestError(reqErr);
  if (!req || (req as { status: string }).status !== 'open') {
    throw new Error('Requirement is not open for applications');
  }
  if ((req as { clientId: string }).clientId === input.studentId) {
    throw new Error('You cannot apply to your own requirement');
  }

  const { data, error } = await supabase.rpc('submit_student_application', {
    p_requirement_id: input.requirementId,
    p_cover_note: input.coverNote ?? null,
    p_sample_urls: input.sampleUrls,
  });
  throwOnPostgrestError(error);
  if (!data) throw new Error('Application was not saved');
  return { id: String(data) };
}

export async function acceptApplicationRpc(applicationId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_application', {
    p_application_id: applicationId,
  });
  throwOnPostgrestError(error);
}

export type ApplicationListRow = {
  id: string;
  requirementId: string;
  studentId: string;
  status: string;
  coverNote: string | null;
  sampleUrls: string[];
  createdAt: string;
  student: {
    id: string;
    profile: { displayName: string | null; photoUrl: string | null };
  };
};

export type StudentApplicationRow = {
  id: string;
  requirementId: string;
  status: string;
  coverNote: string | null;
  sampleUrls: string[];
  createdAt: string;
  requirement: {
    id: string;
    title: string;
    budget: number;
    currency: string;
    status: string;
    currentStep: string | null;
    clientName: string;
  };
  paymentCaptured: boolean;
};

export async function fetchApplicationsForStudent(studentId: string): Promise<StudentApplicationRow[]> {
  const { data: apps, error } = await supabase
    .from('applications')
    .select('id, requirementId, status, coverNote, sampleUrls, createdAt')
    .eq('studentId', studentId)
    .order('createdAt', { ascending: false });
  throwOnPostgrestError(error);
  const list = apps ?? [];
  if (!list.length) return [];

  const reqIds = [...new Set(list.map((a) => (a as { requirementId: string }).requirementId))];

  type ReqRow = {
    id: string;
    title: string;
    budget: number;
    currency: string;
    status: string;
    currentStep: string | null;
    clientId: string;
  };
  const reqs = (await selectWhereInChunks<ReqRow>(reqIds, DEFAULT_IN_CHUNK_SIZE, (chunk) =>
    supabase
      .from('requirements')
      .select('id, title, budget, currency, status, currentStep, clientId')
      .in('id', chunk),
  )) as ReqRow[];

  const reqById = new Map(reqs.map((r) => [r.id, r]));
  const clientIds = [...new Set(reqs.map((r) => r.clientId))];

  type ProfileCell = { displayName: string | null; photoUrl: string | null } | null;
  type UserRow = { id: string; profiles?: ProfileCell | ProfileCell[] };
  const users = (await selectWhereInChunks<UserRow>(clientIds, DEFAULT_IN_CHUNK_SIZE, (chunk) =>
    supabase.from('users').select('id, profiles(displayName, photoUrl)').in('id', chunk),
  )) as UserRow[];

  const clientNameById = new Map<string, string>();
  for (const u of users) {
    const p = u.profiles;
    const cell = Array.isArray(p) ? p[0] : p;
    clientNameById.set(u.id, cell?.displayName?.trim() || 'Client');
  }

  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('requirementId, status')
    .in('requirementId', reqIds)
    .eq('status', 'captured');
  throwOnPostgrestError(payErr);
  const paidReqIds = new Set(
    (payments ?? [])
      .map((p) => (p as { requirementId: string | null }).requirementId)
      .filter((id): id is string => typeof id === 'string'),
  );

  return list.map((a) => {
    const ar = a as {
      id: string;
      requirementId: string;
      status: string;
      coverNote: string | null;
      sampleUrls?: unknown;
      sample_urls?: unknown;
      createdAt: string;
    };
    const req = reqById.get(ar.requirementId);
    const sampleUrls = normalizeSampleUrls(ar.sampleUrls ?? ar.sample_urls);
    return {
      id: ar.id,
      requirementId: ar.requirementId,
      status: ar.status,
      coverNote: ar.coverNote,
      sampleUrls,
      createdAt: ar.createdAt,
      requirement: {
        id: ar.requirementId,
        title: req?.title ?? 'Task',
        budget: req?.budget ?? 0,
        currency: req?.currency ?? 'INR',
        status: req?.status ?? 'open',
        currentStep: req?.currentStep ?? null,
        clientName: req ? (clientNameById.get(req.clientId) ?? 'Client') : 'Client',
      },
      paymentCaptured: paidReqIds.has(ar.requirementId),
    };
  });
}

/** Pending application counts per requirement for a client's postings. */
export async function fetchClientPendingApplicationCounts(
  clientId: string,
): Promise<Record<string, number>> {
  const { data: reqs, error: reqErr } = await supabase
    .from('requirements')
    .select('id')
    .eq('clientId', clientId);
  throwOnPostgrestError(reqErr);
  const reqIds = (reqs ?? []).map((r) => (r as { id: string }).id);
  if (!reqIds.length) return {};

  const apps = (await selectWhereInChunks<{ requirementId: string }>(
    reqIds,
    DEFAULT_IN_CHUNK_SIZE,
    (chunk) =>
      supabase
        .from('applications')
        .select('requirementId')
        .in('requirementId', chunk)
        .eq('status', 'pending'),
  )) as { requirementId: string }[];

  const counts: Record<string, number> = {};
  for (const row of apps) {
    counts[row.requirementId] = (counts[row.requirementId] ?? 0) + 1;
  }
  return counts;
}

export async function fetchApplicationsForClient(
  requirementId: string,
  clientId: string,
): Promise<ApplicationListRow[]> {
  type ProfileCell = { displayName: string | null; photoUrl: string | null } | null;
  const { data: req, error: reqErr } = await supabase
    .from('requirements')
    .select('id, clientId')
    .eq('id', requirementId)
    .maybeSingle();
  throwOnPostgrestError(reqErr);
  if (!req || (req as { clientId: string }).clientId !== clientId) {
    throw new Error('Requirement not found');
  }

  const { data: apps, error } = await supabase
    .from('applications')
    .select('id, requirementId, studentId, status, coverNote, sampleUrls, createdAt')
    .eq('requirementId', requirementId)
    .order('createdAt', { ascending: false });
  throwOnPostgrestError(error);
  const list = apps ?? [];
  const studentIds = [...new Set(list.map((a) => (a as { studentId: string }).studentId))];

  type UserRow = { id: string; profiles?: ProfileCell | ProfileCell[] };
  let users: UserRow[] = [];
  if (studentIds.length <= DEFAULT_IN_CHUNK_SIZE) {
    const { data, error: usersErr } = await supabase
      .from('users')
      .select('id, profiles(displayName, photoUrl)')
      .in('id', studentIds);
    throwOnPostgrestError(usersErr);
    users = (data ?? []) as UserRow[];
  } else {
    users = (await selectWhereInChunks<UserRow>(studentIds, DEFAULT_IN_CHUNK_SIZE, (chunk) =>
      supabase.from('users').select('id, profiles(displayName, photoUrl)').in('id', chunk),
    )) as UserRow[];
  }

  const profByStudent = new Map<string, { displayName: string | null; photoUrl: string | null }>();
  for (const u of users) {
    const p = u.profiles;
    const cell = Array.isArray(p) ? p[0] : p;
    profByStudent.set(u.id, cell ?? { displayName: null, photoUrl: null });
  }
  return list.map((a) => {
    const ar = a as {
      id: string;
      requirementId: string;
      studentId: string;
      status: string;
      coverNote: string | null;
      sampleUrls?: unknown;
      sample_urls?: unknown;
      createdAt: string;
    };
    const pr = profByStudent.get(ar.studentId) ?? { displayName: null, photoUrl: null };
    const sampleUrls = normalizeSampleUrls(ar.sampleUrls ?? ar.sample_urls);
    return {
      id: ar.id,
      requirementId: ar.requirementId,
      studentId: ar.studentId,
      status: ar.status,
      coverNote: ar.coverNote,
      sampleUrls,
      createdAt: ar.createdAt,
      student: {
        id: ar.studentId,
        profile: { displayName: pr.displayName, photoUrl: pr.photoUrl },
      },
    };
  });
}
