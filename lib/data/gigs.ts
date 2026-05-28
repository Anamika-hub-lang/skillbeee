import type { Gig, GigCategory } from '@/types';

import { ensureClientRole } from '@/lib/auth/ensureClientRole';
import { formatPostedAgo } from '@/lib/formatPostedAgo';
import { DEFAULT_IN_CHUNK_SIZE, selectWhereInChunks, throwOnPostgrestError } from '@/lib/supabase/queryHelpers';
import { supabase } from '@/lib/supabase';

type ReqRow = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  deadlineHours: number;
  urgent: boolean;
  category: string;
  imageUrl: string | null;
  status: string;
  createdAt: string;
};

type ProfileRow = { displayName: string | null; photoUrl: string | null };

function normCategory(c: string): GigCategory {
  const allowed: GigCategory[] = [
    'shopify',
    'canva',
    'video',
    'framer',
    'ai',
    'resume',
    'ppt',
    'code',
  ];
  return (allowed.includes(c as GigCategory) ? c : 'code') as GigCategory;
}

function profilesCell(u: { profiles?: ProfileRow | ProfileRow[] | null }): ProfileRow | null {
  const p = u.profiles;
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export function rowsToGigs(
  reqs: ReqRow[],
  profilesByUserId: Map<string, ProfileRow | null>,
  skillsByReq: Map<string, string[]>,
): Gig[] {
  return reqs.map((r) => {
    const prof = profilesByUserId.get(r.clientId);
    const skills = skillsByReq.get(r.id) ?? [];
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      budget: r.budget,
      currency: r.currency,
      deadlineHours: r.deadlineHours,
      urgent: r.urgent,
      skills,
      clientName: prof?.displayName?.trim() || 'Client',
      clientAvatar: prof?.photoUrl ?? undefined,
      category: normCategory(r.category),
      postedAgo: formatPostedAgo(r.createdAt),
      imageUrl: r.imageUrl ?? undefined,
    };
  });
}

async function loadProfilesForUsers(userIds: string[]) {
  const map = new Map<string, ProfileRow | null>();
  if (userIds.length === 0) return map;
  const data = await selectWhereInChunks<{ id: string; profiles?: ProfileRow | ProfileRow[] | null }>(
    userIds,
    DEFAULT_IN_CHUNK_SIZE,
    (chunk) => supabase.from('users').select('id, profiles(displayName, photoUrl)').in('id', chunk),
  );
  for (const row of data) {
    map.set(row.id, profilesCell(row));
  }
  return map;
}

async function loadSkillsForRequirements(reqIds: string[]) {
  const map = new Map<string, string[]>();
  if (reqIds.length === 0) return map;
  const data = await selectWhereInChunks<{ requirementId: string; name: string }>(
    reqIds,
    DEFAULT_IN_CHUNK_SIZE,
    (chunk) => supabase.from('requirement_skills').select('requirementId, name').in('requirementId', chunk),
  );
  for (const row of data) {
    const cur = map.get(row.requirementId) ?? [];
    cur.push(row.name);
    map.set(row.requirementId, cur);
  }
  return map;
}

export async function fetchOpenFeedGigs(): Promise<Gig[]> {
  const { data: reqs, error } = await supabase
    .from('requirements')
    .select(
      'id, clientId, title, description, budget, currency, deadlineHours, urgent, category, imageUrl, status, createdAt',
    )
    .eq('status', 'open')
    .order('createdAt', { ascending: false })
    .limit(100);
  throwOnPostgrestError(error);
  const list = (reqs ?? []) as ReqRow[];
  const clientIds = [...new Set(list.map((r) => r.clientId))];
  const reqIds = list.map((r) => r.id);
  const [profiles, skills] = await Promise.all([
    loadProfilesForUsers(clientIds),
    loadSkillsForRequirements(reqIds),
  ]);
  return rowsToGigs(list, profiles, skills);
}

export async function fetchClientRequirementsGigs(clientId: string): Promise<Gig[]> {
  const { data: reqs, error } = await supabase
    .from('requirements')
    .select(
      'id, clientId, title, description, budget, currency, deadlineHours, urgent, category, imageUrl, status, createdAt',
    )
    .eq('clientId', clientId)
    .order('createdAt', { ascending: false })
    .limit(80);
  throwOnPostgrestError(error);
  const list = (reqs ?? []) as ReqRow[];
  const clientIds = [...new Set(list.map((r) => r.clientId))];
  const reqIds = list.map((r) => r.id);
  const [profiles, skills] = await Promise.all([
    loadProfilesForUsers(clientIds),
    loadSkillsForRequirements(reqIds),
  ]);
  return rowsToGigs(list, profiles, skills);
}

export async function fetchRequirementGigForViewer(requirementId: string, viewerId: string): Promise<Gig> {
  const { data: row, error } = await supabase
    .from('requirements')
    .select(
      'id, clientId, title, description, budget, currency, deadlineHours, urgent, category, imageUrl, status, createdAt',
    )
    .eq('id', requirementId)
    .maybeSingle();
  throwOnPostgrestError(error);
  if (!row) throw new Error('Requirement not found');

  const r = row as ReqRow;
  const isClient = r.clientId === viewerId;
  let canSee = isClient || r.status === 'open';
  if (!canSee) {
    const { data: appRow } = await supabase
      .from('applications')
      .select('id')
      .eq('requirementId', requirementId)
      .eq('studentId', viewerId)
      .maybeSingle();
    canSee = Boolean(appRow);
  }
  if (!canSee) throw new Error('Requirement not found');

  const [profiles, skills] = await Promise.all([
    loadProfilesForUsers([r.clientId]),
    loadSkillsForRequirements([r.id]),
  ]);
  return rowsToGigs([r], profiles, skills)[0]!;
}

export async function insertRequirementWithSkills(input: {
  clientId: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  deadlineHours: number;
  urgent: boolean;
  category: string;
  skills: string[];
}): Promise<void> {
  await ensureClientRole(input.clientId);

  const { error } = await supabase.rpc('create_client_requirement', {
    p_title: input.title,
    p_description: input.description,
    p_budget: input.budget,
    p_currency: input.currency,
    p_deadline_hours: input.deadlineHours,
    p_urgent: input.urgent,
    p_category: input.category,
    p_skills: input.skills,
  });
  throwOnPostgrestError(error);
}
