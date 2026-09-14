import type {
  AppData,
  Feedback,
  Message,
  Note,
  Notification,
  Request,
  Session,
  Skill,
  User,
} from './skillswap-data';
import { getSupabase } from './supabase-client';

const emptyData = (): AppData => ({
  users: [], skills: [], requests: [], messages: [], sessions: [], feedback: [], notifications: [], notes: [],
});

const profileToUser = (row: any): User => ({
  id: row.id,
  name: row.full_name || 'Student',
  email: row.email || '',
  college: row.college || 'College student',
  course: row.course || 'Student',
  year: row.year || '',
  bio: row.bio || '',
  profileImage: row.avatar_url || undefined,
  skillsToTeach: [],
  skillsToLearn: [],
  rating: Number(row.rating ?? 5),
  availability: row.availability || 'Flexible',
});

export async function getSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUp(name: string, email: string, password: string) {
  const sb = getSupabase();

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) throw error;

  let session = data.session;

  if (!session) {
    const { data: loginData, error: loginError } =
      await sb.auth.signInWithPassword({ email, password });

    if (loginError) {
      throw new Error(
        'Direct signup is enabled in the app, but Supabase is still requiring email confirmation.'
      );
    }

    session = loginData.session;
  }

  if (!session) {
    throw new Error('Could not create the SkillSwap account.');
  }

  const userId = session.user.id;

  const { error: profileError } = await sb
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: name,
        email,
      },
      { onConflict: 'id' }
    );

  if (profileError) throw profileError;

  return session;
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function loadRemoteData(userId: string): Promise<AppData> {
  const sb = getSupabase();
  const result = emptyData();

  const [profiles, skills, userSkills, requests, sessions, notifications, notes, feedback, memberships] = await Promise.all([
    sb.from('profiles').select('id,full_name,email,college,course,year,bio,avatar_url,rating,availability').order('full_name'),
    sb.from('skills').select('id,name,category').order('name'),
    sb.from('user_skills').select('id,user_id,skill_id,skill_type'),
    sb.from('swap_requests').select('id,sender_id,receiver_id,message,status,created_at').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }),
    sb.from('sessions').select('id,host_id,participant_id,title,description,scheduled_at,duration_minutes,meeting_url,status').or(`host_id.eq.${userId},participant_id.eq.${userId}`).order('scheduled_at'),
    sb.from('notifications').select('id,type,title,message,created_at,read').eq('user_id', userId).order('created_at', { ascending: false }),
    sb.from('notes').select('id,title,subject,description,file_name,file_type,file_size,file_data,uploaded_at,owner_id').eq('owner_id', userId).order('uploaded_at', { ascending: false }),
    sb.from('feedback').select('id,session_id,user_id,rating,comment,tags,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    sb.from('conversation_members').select('conversation_id,user_id').eq('user_id', userId),
  ]);

  for (const response of [profiles, skills, userSkills, requests, sessions, notifications, notes, feedback, memberships]) {
    if (response.error) throw response.error;
  }

  const profileRows = profiles.data || [];
  result.users = profileRows.map(profileToUser);

  const skillRows = skills.data || [];
  const membershipRows = userSkills.data || [];
  result.skills = membershipRows.map((us: any) => {
    const s = skillRows.find((item: any) => item.id === us.skill_id);
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      category: s.category || 'Other',
      level: 'Intermediate' as const,
      description: us.skill_type === 'teach' ? 'A skill I enjoy sharing with other students.' : 'A skill I would like to practice with a peer.',
      experience: 'Some experience',
      ownerId: us.user_id,
      mode: us.skill_type,
    } as Skill;
  }).filter(Boolean) as Skill[];

  for (const user of result.users) {
    user.skillsToTeach = result.skills.filter(s => s.ownerId === user.id && s.mode === 'teach').map(s => s.name);
    user.skillsToLearn = result.skills.filter(s => s.ownerId === user.id && s.mode === 'learn').map(s => s.name);
  }

  result.requests = (requests.data || []).map((r: any): Request => ({
    id: r.id, senderId: r.sender_id, receiverId: r.receiver_id,
    status: r.status, message: r.message || '', createdAt: r.created_at,
  }));

  result.sessions = (sessions.data || []).map((s: any): Session => ({
    id: s.id, userId: s.host_id, partnerId: s.participant_id || '', skill: s.title,
    date: new Date(s.scheduled_at).toISOString().slice(0, 10),
    time: new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    duration: `${s.duration_minutes} min`, type: s.meeting_url ? 'Video call' : 'In person',
    status: s.status === 'scheduled' ? 'upcoming' : s.status,
    meetingUrl: s.meeting_url || '',
  }));

  result.notifications = (notifications.data || []).map((n: any): Notification => ({
    id: n.id, type: n.type, title: n.title, body: n.message || '', createdAt: n.created_at, read: n.read,
  }));

  result.notes = (notes.data || []).map((n: any): Note => ({
    id: n.id, title: n.title, subject: n.subject, description: n.description || '',
    fileName: n.file_name, fileType: n.file_type, fileSize: Number(n.file_size || 0), fileData: n.file_data || undefined,
    uploadedAt: n.uploaded_at, ownerId: n.owner_id,
  }));

  result.feedback = (feedback.data || []).map((f: any): Feedback => ({
    id: f.id, sessionId: f.session_id, rating: Number(f.rating), comment: f.comment || '', tags: f.tags || [],
  }));

  const conversationIds = (memberships.data || []).map((m: any) => m.conversation_id);
  if (conversationIds.length) {
    const { data: messages, error } = await sb.from('messages').select('id,conversation_id,sender_id,content,created_at').in('conversation_id', conversationIds).order('created_at');
    if (error) throw error;
    result.messages = (messages || []).map((m: any): Message => ({
      id: m.id, conversationId: m.conversation_id, senderId: m.sender_id, body: m.content, createdAt: m.created_at,
    }));
  }

  return result;
}

const ids = (items: any[]) => new Set(items.map(item => item.id));

async function deleteMissing(sb: any, table: string, before: any[], after: any[]) {
  const keep = ids(after);
  const remove = before.filter(item => item.id && !keep.has(item.id)).map(item => item.id);
  if (remove.length) {
    const { error } = await sb.from(table).delete().in('id', remove);
    if (error) throw error;
  }
}

export async function syncAppData(next: AppData, before: AppData, currentUserId: string) {
  const sb = getSupabase();

  const me = next.users.find(u => u.id === currentUserId);
  if (me) {
    const { error } = await sb.from('profiles').upsert({
      id: currentUserId,
      full_name: me.name,
      email: me.email,
      bio: me.bio,
      avatar_url: me.profileImage || null,
      college: me.college,
      course: me.course,
      year: me.year,
      rating: me.rating,
      availability: me.availability,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
  }

  // Reconcile the current user's skills as one complete set. This avoids stale
  // upserts/races that can leave a Learn skill stored as Teach or disappear
  // after a refresh. The UI remains the source of truth for this user's list.
  const nextOwnSkills = next.skills.filter(s => s.ownerId === currentUserId);
  const { error: clearSkillsError } = await sb.from('user_skills').delete().eq('user_id', currentUserId);
  if (clearSkillsError) console.error('Skills cleanup failed:', clearSkillsError);

  for (const skill of nextOwnSkills) {
    const { data: existingSkill, error: lookupError } = await sb.from('skills').select('id').eq('name', skill.name).maybeSingle();
    if (lookupError) {
      console.error('Skill lookup failed:', lookupError);
      continue;
    }
    let skillId = existingSkill?.id as string | undefined;
    if (!skillId) {
      const { data: created, error: skillError } = await sb.from('skills').insert({ name: skill.name, category: skill.category }).select('id').single();
      if (skillError) {
        console.error('Skill creation failed:', skillError);
        continue;
      }
      skillId = created.id;
    } else {
      const { error: skillError } = await sb.from('skills').update({ category: skill.category }).eq('id', skillId);
      if (skillError) console.error('Skill update failed:', skillError);
    }
    const { error: usError } = await sb.from('user_skills').insert({
      id: skill.id,
      user_id: currentUserId,
      skill_id: skillId,
      skill_type: skill.mode,
    });
    if (usError) console.error('User skill save failed:', usError);
  }

  for (const request of next.requests.filter(r => r.senderId === currentUserId || r.receiverId === currentUserId)) {
    const { error } = await sb.from('swap_requests').upsert({
      id: request.id, sender_id: request.senderId, receiver_id: request.receiverId, message: request.message,
      status: request.status, created_at: request.createdAt, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const session of next.sessions.filter(s => s.userId === currentUserId || s.partnerId === currentUserId)) {
    const [hours, minutes] = session.time.split(':').map(Number);
    const scheduled = new Date(`${session.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`).toISOString();
    const { error } = await sb.from('sessions').upsert({
      id: session.id, host_id: session.userId, participant_id: session.partnerId || null, title: session.skill,
      scheduled_at: scheduled, duration_minutes: Number.parseInt(session.duration) || 45,
      meeting_url: session.meetingUrl || '', status: session.status === 'upcoming' ? 'scheduled' : session.status,
    }, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const message of next.messages.filter(m => m.senderId === currentUserId)) {
    const { error } = await sb.from('messages').upsert({ id: message.id, conversation_id: message.conversationId, sender_id: currentUserId, content: message.body, created_at: message.createdAt }, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const notification of next.notifications) {
    const { error } = await sb.from('notifications').upsert({ id: notification.id, user_id: currentUserId, type: notification.type, title: notification.title, message: notification.body, created_at: notification.createdAt, read: notification.read }, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const note of next.notes.filter(n => n.ownerId === currentUserId)) {
    const { error } = await sb.from('notes').upsert({ id: note.id, title: note.title, subject: note.subject, description: note.description, file_name: note.fileName, file_type: note.fileType, file_size: note.fileSize, file_data: note.fileData || null, uploaded_at: note.uploadedAt, owner_id: currentUserId }, { onConflict: 'id' });
    if (error) throw error;
  }
  await deleteMissing(sb, 'notes', before.notes.filter(n => n.ownerId === currentUserId), next.notes.filter(n => n.ownerId === currentUserId));

  for (const feedback of next.feedback) {
    const { error } = await sb.from('feedback').upsert({ id: feedback.id, session_id: feedback.sessionId, user_id: currentUserId, rating: feedback.rating, comment: feedback.comment, tags: feedback.tags }, { onConflict: 'id' });
    if (error) throw error;
  }
}

export async function createConversationForUsers(userA: string, userB: string) {
  const sb = getSupabase();
  const { data: existingMembers, error: existingError } = await sb.from('conversation_members').select('conversation_id').eq('user_id', userA);
  if (existingError) throw existingError;
  for (const row of existingMembers || []) {
    const { data: second } = await sb.from('conversation_members').select('user_id').eq('conversation_id', row.conversation_id).eq('user_id', userB).maybeSingle();
    if (second) return row.conversation_id;
  }
  const { data: conversation, error } = await sb.from('conversations').insert({}).select('id').single();
  if (error) throw error;
  const { error: memberError } = await sb.from('conversation_members').insert([
    { conversation_id: conversation.id, user_id: userA },
    { conversation_id: conversation.id, user_id: userB },
  ]);
  if (memberError) throw memberError;
  return conversation.id;
}

export async function acceptRequestExtras(request: Request, receiverName: string) {
  const sb = getSupabase();
  const a = request.senderId < request.receiverId ? request.senderId : request.receiverId;
  const b = request.senderId < request.receiverId ? request.receiverId : request.senderId;
  await sb.from('connections').upsert({ user_a_id: a, user_b_id: b }, { onConflict: 'user_a_id,user_b_id' });
  const conversationId = await createConversationForUsers(request.senderId, request.receiverId);
  await sb.from('messages').insert({ conversation_id: conversationId, sender_id: request.receiverId, content: `Hi! Your exchange request was accepted. Looking forward to learning together.`, });
  await sb.from('notifications').insert({ user_id: request.senderId, type: 'request', title: 'Exchange request accepted', message: `${receiverName} accepted your request.` });
}

export function subscribeToRealtime(userId: string, onChange: () => void) {
  const sb = getSupabase();
  const channel = sb.channel(`skillswap-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_requests' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_skills' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, onChange)
    .subscribe();
  return () => { sb.removeChannel(channel); };
}
