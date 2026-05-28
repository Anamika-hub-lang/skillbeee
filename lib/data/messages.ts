import { formatPostedAgo } from '@/lib/formatPostedAgo';
import { DEFAULT_IN_CHUNK_SIZE, selectWhereInChunks, throwOnPostgrestError } from '@/lib/supabase/queryHelpers';
import { supabase } from '@/lib/supabase';

import type { InboxThread } from '@/types';

function shortTime(iso: string): string {
  return formatPostedAgo(iso).replace('just now', 'now');
}

type ReqSummary = { id: string; clientId: string; title: string; updatedAt: string };

export async function fetchInboxThreads(userId: string): Promise<InboxThread[]> {
  const [cRes, aRes] = await Promise.all([
    supabase
      .from('requirements')
      .select('id, clientId, title, updatedAt')
      .eq('clientId', userId)
      .order('updatedAt', { ascending: false })
      .limit(80),
    supabase.from('applications').select('requirementId').eq('studentId', userId),
  ]);
  throwOnPostgrestError(cRes.error);
  throwOnPostgrestError(aRes.error);
  const asClient = cRes.data;
  const appRows = aRes.data;

  const studentReqIds = [...new Set((appRows ?? []).map((r) => (r as { requirementId: string }).requirementId))];
  let asStudent: ReqSummary[] = [];
  if (studentReqIds.length) {
    if (studentReqIds.length <= DEFAULT_IN_CHUNK_SIZE) {
      const { data, error } = await supabase
        .from('requirements')
        .select('id, clientId, title, updatedAt')
        .in('id', studentReqIds)
        .order('updatedAt', { ascending: false })
        .limit(80);
      throwOnPostgrestError(error);
      asStudent = (data ?? []) as ReqSummary[];
    } else {
      const rows = await selectWhereInChunks<ReqSummary>(
        studentReqIds,
        DEFAULT_IN_CHUNK_SIZE,
        (chunk) =>
          supabase.from('requirements').select('id, clientId, title, updatedAt').in('id', chunk),
      );
      asStudent = [...rows]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 80);
    }
  }

  const byId = new Map<string, ReqSummary>();
  for (const r of [...(asClient ?? []), ...asStudent]) {
    const row = r as ReqSummary;
    byId.set(row.id, row);
  }
  const reqs = [...byId.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const requirementIds = reqs.map((r) => r.id);
  if (requirementIds.length === 0) return [];

  type AppRow = { requirementId: string; studentId: string; status: string; createdAt: string };
  let apps: AppRow[] = [];
  if (requirementIds.length <= DEFAULT_IN_CHUNK_SIZE) {
    const { data, error } = await supabase
      .from('applications')
      .select('requirementId, studentId, status, createdAt')
      .in('requirementId', requirementIds)
      .in('status', ['pending', 'accepted'])
      .order('createdAt', { ascending: false });
    throwOnPostgrestError(error);
    apps = (data ?? []) as AppRow[];
  } else {
    const merged = await selectWhereInChunks<AppRow>(
      requirementIds,
      DEFAULT_IN_CHUNK_SIZE,
      (chunk) =>
        supabase
          .from('applications')
          .select('requirementId, studentId, status, createdAt')
          .in('requirementId', chunk)
          .in('status', ['pending', 'accepted'])
          .order('createdAt', { ascending: false }),
    );
    apps = merged
      .filter((r) => r.status === 'pending' || r.status === 'accepted')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const appsByReq = new Map<string, { studentId: string; status: string }[]>();
  for (const a of apps) {
    const cur = appsByReq.get(a.requirementId) ?? [];
    cur.push(a);
    appsByReq.set(a.requirementId, cur);
  }

  const studentIds = new Set<string>();
  for (const a of apps) {
    studentIds.add(a.studentId);
  }
  const clientIds = [...new Set(reqs.map((r) => r.clientId))];
  const allUserIds = [...new Set([...studentIds, ...clientIds])];

  type UserRow = { id: string; profiles?: unknown };
  let users: UserRow[] = [];
  if (allUserIds.length <= DEFAULT_IN_CHUNK_SIZE) {
    const { data, error } = await supabase
      .from('users')
      .select('id, profiles(displayName, photoUrl)')
      .in('id', allUserIds);
    throwOnPostgrestError(error);
    users = (data ?? []) as UserRow[];
  } else {
    users = (await selectWhereInChunks<UserRow>(allUserIds, DEFAULT_IN_CHUNK_SIZE, (chunk) =>
      supabase.from('users').select('id, profiles(displayName, photoUrl)').in('id', chunk),
    )) as UserRow[];
  }

  const prof = new Map<string, { displayName: string | null; photoUrl: string | null }>();
  for (const u of users) {
    const p = u.profiles as
      | { displayName: string | null; photoUrl: string | null }[]
      | { displayName: string | null; photoUrl: string | null }
      | null
      | undefined;
    const cell = Array.isArray(p) ? p[0] : p;
    prof.set(u.id, cell ?? { displayName: null, photoUrl: null });
  }

  type LastMsg = { requirementId: string; body: string; createdAt: string; senderId: string };
  const lastByReq = new Map<string, LastMsg>();
  if (requirementIds.length <= DEFAULT_IN_CHUNK_SIZE) {
    const { data: lastMsgs, error } = await supabase
      .from('messages')
      .select('requirementId, body, createdAt, senderId')
      .in('requirementId', requirementIds)
      .order('createdAt', { ascending: false });
    throwOnPostgrestError(error);
    for (const m of lastMsgs ?? []) {
      const row = m as LastMsg;
      if (!lastByReq.has(row.requirementId)) lastByReq.set(row.requirementId, row);
    }
  } else {
    const merged = await selectWhereInChunks<LastMsg>(
      requirementIds,
      DEFAULT_IN_CHUNK_SIZE,
      (chunk) =>
        supabase
          .from('messages')
          .select('requirementId, body, createdAt, senderId')
          .in('requirementId', chunk)
          .order('createdAt', { ascending: false }),
    );
    for (const row of merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )) {
      if (!lastByReq.has(row.requirementId)) lastByReq.set(row.requirementId, row);
    }
  }

  const unreadByReq = new Map<string, number>();
  for (let i = 0; i < requirementIds.length; i += DEFAULT_IN_CHUNK_SIZE) {
    const chunk = requirementIds.slice(i, i + DEFAULT_IN_CHUNK_SIZE);
    const { data: unreadRows, error } = await supabase
      .from('messages')
      .select('requirementId')
      .in('requirementId', chunk)
      .is('readAt', null)
      .neq('senderId', userId);
    throwOnPostgrestError(error);
    for (const row of unreadRows ?? []) {
      const rid = (row as { requirementId: string }).requirementId;
      unreadByReq.set(rid, (unreadByReq.get(rid) ?? 0) + 1);
    }
  }

  const out: InboxThread[] = [];
  for (const req of reqs) {
    const isClient = req.clientId === userId;
    const reqApps = appsByReq.get(req.id) ?? [];
    const accepted = reqApps.find((x) => x.status === 'accepted');
    const latestApp = accepted ?? reqApps[0];
    const peerId = isClient ? latestApp?.studentId : req.clientId;
    const peer = peerId ? prof.get(peerId) : undefined;
    const peerName = isClient
      ? peer?.displayName?.trim() || 'Student'
      : prof.get(req.clientId)?.displayName?.trim() || 'Client';
    const peerPhotoUrl = isClient ? peer?.photoUrl ?? undefined : prof.get(req.clientId)?.photoUrl ?? undefined;

    const lastMsg = lastByReq.get(req.id);
    const lastPreview = lastMsg?.body ?? (isClient ? 'Tap to view applicants' : 'Say hi 👋');

    const refTime = lastMsg?.createdAt ?? req.updatedAt;
    out.push({
      id: req.id,
      name: peerName,
      peerPhotoUrl,
      last: lastPreview.slice(0, 120),
      time: shortTime(refTime),
      unread: unreadByReq.get(req.id) ?? 0,
    });
  }
  return out;
}

export type ThreadMessageApi = {
  id: string;
  requirementId: string;
  senderId: string;
  body: string;
  attachmentUri: string | null;
  isVoice: boolean;
  readAt: string | null;
  createdAt: string;
};

export async function fetchThreadMessages(requirementId: string, userId: string): Promise<ThreadMessageApi[]> {
  const { data: allowed, error: allowErr } = await supabase
    .from('requirements')
    .select('id, clientId')
    .eq('id', requirementId)
    .maybeSingle();
  throwOnPostgrestError(allowErr);
  if (!allowed) return [];
  const cid = (allowed as { clientId: string }).clientId;
  if (cid !== userId) {
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id')
      .eq('requirementId', requirementId)
      .eq('studentId', userId)
      .maybeSingle();
    throwOnPostgrestError(appErr);
    if (!app) return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, requirementId, senderId, body, attachmentUri, isVoice, readAt, createdAt')
    .eq('requirementId', requirementId)
    .order('createdAt', { ascending: true });
  throwOnPostgrestError(error);
  return (data ?? []) as ThreadMessageApi[];
}

export async function sendThreadMessage(
  requirementId: string,
  senderId: string,
  body: string,
): Promise<ThreadMessageApi> {
  void senderId;
  const { data, error } = await supabase.rpc('send_thread_message', {
    p_requirement_id: requirementId,
    p_body: body,
    p_attachment_uri: null,
    p_is_voice: false,
  });
  throwOnPostgrestError(error);
  if (!data || typeof data !== 'object') throw new Error('Message was not sent');
  return data as ThreadMessageApi;
}

export async function markThreadRead(requirementId: string, _readerId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_thread_read', { p_requirement_id: requirementId });
  throwOnPostgrestError(error);
}
