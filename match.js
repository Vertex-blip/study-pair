export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const PERIODS = ['Morning', 'Afternoon', 'Evening'];
export const SUBJECTS = ['Mathematics', 'Programming', 'Languages', 'Physics', 'Biology', 'History', 'Design', 'Other'];
export const STYLES = ['practice', 'review', 'accountability'];
export const SLOTS = DAYS.flatMap(day => PERIODS.map(period => `${day}-${period}`));

export function normalizeProfile(input) {
  if (!input || typeof input !== 'object') throw new Error('This is not a valid StudyPair profile.');
  const alias = String(input.alias ?? '').trim().slice(0, 32);
  const subject = String(input.subject ?? '');
  const level = Number(input.level);
  const style = String(input.style ?? '');
  const goal = String(input.goal ?? '').trim().slice(0, 100);
  const slots = Array.isArray(input.slots) ? [...new Set(input.slots.filter(slot => SLOTS.includes(slot)))] : [];
  if (!alias || !SUBJECTS.includes(subject) || !Number.isInteger(level) || level < 1 || level > 4 || !STYLES.includes(style)) {
    throw new Error('The profile has a missing or unsupported field.');
  }
  if (slots.length === 0) throw new Error('The profile needs at least one time block.');
  return { alias, subject, level, style, goal, slots };
}

export function scoreMatch(you, peer) {
  const a = normalizeProfile(you);
  const b = normalizeProfile(peer);
  const overlap = a.slots.filter(slot => b.slots.includes(slot));
  const subjectPoints = a.subject === b.subject ? 40 : 0;
  const schedulePoints = Math.min(35, overlap.length ? 15 + overlap.length * 5 : 0);
  const levelPoints = Math.max(0, 15 - Math.abs(a.level - b.level) * 5);
  const stylePoints = a.style === b.style ? 10 : 0;
  return { score: subjectPoints + schedulePoints + levelPoints + stylePoints, overlap, subjectPoints, schedulePoints, levelPoints, stylePoints };
}

export function encodeProfile(profile) {
  const json = JSON.stringify({ v: 1, profile: normalizeProfile(profile) });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `SP1.${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

export function decodeProfile(code) {
  const trimmed = String(code ?? '').trim();
  if (!trimmed.startsWith('SP1.') || trimmed.length > 4096) throw new Error('Paste a valid StudyPair share code.');
  try {
    const base64 = trimmed.slice(4).replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed.v !== 1) throw new Error('Unsupported share code version.');
    return normalizeProfile(parsed.profile);
  } catch (error) {
    if (error.message === 'Unsupported share code version.') throw error;
    throw new Error('This share code could not be read.');
  }
}
