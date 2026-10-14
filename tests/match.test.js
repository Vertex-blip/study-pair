import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProfile, scoreMatch, encodeProfile, decodeProfile } from '../match.js';

const alex = { alias: 'Alex', subject: 'Physics', level: 2, style: 'practice', goal: 'Study optics', slots: ['Mon-Evening', 'Sat-Morning'] };
const maya = { alias: 'Maya', subject: 'Physics', level: 3, style: 'practice', slots: ['Mon-Evening', 'Tue-Morning'] };

test('matching rewards shared subject, times, level and study style', () => {
  const match = scoreMatch(alex, maya);
  assert.equal(match.score, 40 + 20 + 10 + 10);
  assert.deepEqual(match.overlap, ['Mon-Evening']);
});
test('unrelated subject and schedule cannot receive those points', () => {
  const match = scoreMatch(alex, { ...maya, subject: 'History', slots: ['Sun-Afternoon'] });
  assert.equal(match.subjectPoints, 0);
  assert.equal(match.schedulePoints, 0);
});
test('unicode names survive a share code round trip', () => {
  const profile = { ...alex, alias: 'Әлия' };
  assert.deepEqual(decodeProfile(encodeProfile(profile)), normalizeProfile(profile));
});
test('malformed profile codes fail safely', () => {
  assert.throws(() => decodeProfile('SP1.broken'), /could not be read/);
  assert.throws(() => normalizeProfile({ ...alex, slots: [] }), /time block/);
});
