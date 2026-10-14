import { DAYS, PERIODS, SLOTS, normalizeProfile, scoreMatch, encodeProfile, decodeProfile } from './match.js';

const PROFILE_KEY = 'studypair-profile-v1';
const PEERS_KEY = 'studypair-peers-v1';
const $ = selector => document.querySelector(selector);
const form = $('#profile-form');
const slotGrid = $('#slot-grid');
const matchesList = $('#matches-list');
let myProfile = read(PROFILE_KEY, null);
let peers = read(PEERS_KEY, []);
let examplesShown = false;

const examples = [
  { alias: 'Maya', subject: 'Programming', level: 2, style: 'practice', goal: 'Work through practical coding problems.', slots: ['Mon-Evening', 'Wed-Evening', 'Sat-Afternoon'] },
  { alias: 'Noah', subject: 'Mathematics', level: 3, style: 'review', goal: 'Prepare for calculus exams.', slots: ['Tue-Evening', 'Thu-Evening', 'Sat-Morning'] },
  { alias: 'Ari', subject: 'Languages', level: 1, style: 'accountability', goal: 'Make language practice a weekly habit.', slots: ['Mon-Morning', 'Fri-Evening', 'Sun-Afternoon'] }
];

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function status(element, message, error = false) {
  element.textContent = message;
  element.classList.toggle('error', error);
}
function buildSlots() {
  slotGrid.appendChild(document.createElement('span'));
  for (const period of PERIODS) {
    const heading = document.createElement('span'); heading.className = 'slot-head'; heading.textContent = period; slotGrid.appendChild(heading);
  }
  for (const day of DAYS) {
    const label = document.createElement('span'); label.className = 'slot-day'; label.textContent = day; slotGrid.appendChild(label);
    for (const period of PERIODS) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'slot'; button.dataset.slot = `${day}-${period}`; button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `${day} ${period}`); button.title = `${day} ${period}`; button.textContent = '✓';
      button.addEventListener('click', () => button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'));
      slotGrid.appendChild(button);
    }
  }
}
function selectedSlots() { return [...slotGrid.querySelectorAll('[aria-pressed="true"]')].map(el => el.dataset.slot); }
function collectProfile() {
  return normalizeProfile({ alias: $('#alias').value, subject: $('#subject').value, level: $('#level').value, style: $('#style').value, goal: $('#goal').value, slots: selectedSlots() });
}
function populateProfile(profile) {
  try {
    const valid = normalizeProfile(profile);
    $('#alias').value = valid.alias; $('#subject').value = valid.subject; $('#level').value = String(valid.level); $('#style').value = valid.style; $('#goal').value = valid.goal;
    slotGrid.querySelectorAll('[data-slot]').forEach(el => el.setAttribute('aria-pressed', String(valid.slots.includes(el.dataset.slot))));
    myProfile = valid;
  } catch { myProfile = null; }
}
function addText(parent, tag, className, content) {
  const node = document.createElement(tag); node.className = className; node.textContent = content; parent.appendChild(node); return node;
}
function renderMatches() {
  matchesList.replaceChildren();
  renderScheduleMap();
  if (!myProfile) {
    const box = addText(matchesList, 'div', 'empty-state', '');
    addText(box, 'span', 'empty-symbol', '✳'); addText(box, 'h3', '', 'Your people are out there.');
    addText(box, 'p', '', 'Save your study profile to see compatible partners. You can try the clearly labeled examples, then add real profiles with share codes.');
    return;
  }
  const candidateProfiles = [...peers.map((profile, index) => ({ profile, index, sample: false })), ...(examplesShown ? examples.map(profile => ({ profile, sample: true })) : [])];
  const ranked = candidateProfiles.map(item => ({ ...item, match: scoreMatch(myProfile, item.profile) })).sort((a,b) => b.match.score - a.match.score || a.profile.alias.localeCompare(b.profile.alias));
  if (!ranked.length) {
    const box = addText(matchesList, 'div', 'empty-state', '');
    addText(box, 'span', 'empty-symbol', '↗'); addText(box, 'h3', '', 'Bring a study buddy in.');
    addText(box, 'p', '', 'Exchange share codes with classmates or load example profiles to explore how matching works.');
    return;
  }
  for (const item of ranked) {
    const { profile, match } = item;
    const card = addText(matchesList, 'article', 'match-card', '');
    const top = addText(card, 'div', 'match-top', '');
    addText(top, 'span', 'match-avatar', profile.alias.slice(0,1).toUpperCase());
    addText(top, 'span', 'score-pill', `${match.score}% match`);
    addText(card, 'h3', '', profile.alias);
    addText(card, 'p', 'match-subtitle', `${profile.subject} · Level ${profile.level} · ${styleLabel(profile.style)}`);
    addText(card, 'p', 'match-goal', profile.goal || 'Ready to learn together.');
    const explanation = addText(card, 'div', 'match-why', '');
    addText(explanation, 'strong', '', `${match.overlap.length} shared time block${match.overlap.length === 1 ? '' : 's'} · `);
    explanation.append(document.createTextNode(`${match.subjectPoints ? 'Same subject' : 'Different subject'} · ${match.stylePoints ? 'Same study style' : 'Different study style'}`));
    const bottom = addText(card, 'div', 'card-bottom', '');
    addText(bottom, 'span', 'sample-tag', item.sample ? 'Example profile' : 'Imported profile');
    if (!item.sample) {
      const remove = addText(bottom, 'button', 'remove-button', 'Remove'); remove.type = 'button';
      remove.addEventListener('click', () => { peers.splice(item.index, 1); write(PEERS_KEY, peers); renderMatches(); });
    }
  }
}
function renderScheduleMap() {
  const demo = { alias: 'Alex', subject: 'Programming', level: 2, style: 'practice', goal: '', slots: ['Mon-Evening', 'Wed-Evening', 'Sat-Afternoon'] };
  const you = myProfile || demo;
  const choices = myProfile ? [...peers.map(profile => ({ profile, sample: false })), ...(examplesShown ? examples.map(profile => ({ profile, sample: true })) : [])] : [{ profile: examples[0], sample: true }];
  const best = choices.map(item => ({ ...item, match: scoreMatch(you, item.profile) })).sort((a, b) => b.match.score - a.match.score)[0];
  const other = best?.profile;
  $('#map-mode').textContent = myProfile ? other ? best.sample ? 'EXAMPLE MATCH' : 'LIVE MATCH' : 'YOUR AVAILABILITY' : 'DEMO DATA';
  $('#map-names').textContent = other ? `${you.alias} × ${other.alias}` : `${you.alias} × ?`;
  $('#map-score').replaceChildren();
  $('#map-score').append(document.createTextNode(other ? String(best.match.score) : '—'));
  if (other) { const percent = document.createElement('span'); percent.textContent = '%'; $('#map-score').append(percent); }
  const grid = $('#hero-schedule-grid'); grid.replaceChildren();
  grid.appendChild(document.createElement('span'));
  for (const period of PERIODS) { const head = document.createElement('span'); head.className = 'map-col-head'; head.textContent = period.toUpperCase(); grid.append(head); }
  for (const day of DAYS) {
    const label = document.createElement('span'); label.className = 'map-day'; label.textContent = day; grid.append(label);
    for (const period of PERIODS) {
      const slot = `${day}-${period}`, mine = you.slots.includes(slot), peer = !!other?.slots.includes(slot);
      const cell = document.createElement('span'); cell.className = `map-cell${mine && peer ? ' both' : mine ? ' mine' : peer ? ' peer' : ''}`;
      cell.title = `${day} ${period}: ${mine && peer ? 'both available' : mine ? 'you are available' : peer ? 'partner available' : 'neither available'}`;
      grid.append(cell);
    }
  }
  const shared = best?.match.overlap.length || 0;
  $('#map-summary').textContent = other ? `${shared} shared study block${shared === 1 ? '' : 's'}${myProfile ? '.' : ' in this example week.'}` : 'Your selected times are highlighted. Add a partner to see where your schedules meet.';
}
function styleLabel(style) { return ({ practice: 'Practice', review: 'Review', accountability: 'Accountability' })[style]; }

buildSlots();
if (myProfile) populateProfile(myProfile);
renderMatches();

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const profile = collectProfile();
    if (!write(PROFILE_KEY, profile)) throw new Error('Browser storage is unavailable. Your profile was not saved.');
    myProfile = profile; status($('#save-status'), 'Saved on this device.'); renderMatches();
  } catch (error) { status($('#save-status'), error.message, true); }
});
$('#import-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const profile = decodeProfile($('#import-code').value);
    if (myProfile && encodeProfile(myProfile) === encodeProfile(profile)) throw new Error('That is your own profile.');
    if (peers.some(peer => encodeProfile(peer) === encodeProfile(profile))) throw new Error('That profile is already added.');
    peers.push(profile);
    if (!write(PEERS_KEY, peers)) { peers.pop(); throw new Error('Browser storage is unavailable. This profile was not added.'); }
    $('#import-code').value = ''; status($('#import-status'), `${profile.alias} was added.`); renderMatches();
  } catch (error) { status($('#import-status'), error.message, true); }
});
$('#copy-code').addEventListener('click', async () => {
  try {
    if (!myProfile) throw new Error('Save your profile first.');
    await navigator.clipboard.writeText(encodeProfile(myProfile));
    status($('#import-status'), 'Your code was copied. Share it with someone you trust.');
  } catch (error) { status($('#import-status'), error.message || 'Clipboard unavailable. Use “Show code” instead.', true); }
});
$('#show-code').addEventListener('click', () => {
  if (!myProfile) { status($('#import-status'), 'Save your profile first.', true); return; }
  $('#own-code').value = encodeProfile(myProfile); $('#own-code-wrap').hidden = false; $('#own-code').focus(); $('#own-code').select();
});
$('#load-examples').addEventListener('click', () => { examplesShown = !examplesShown; $('#load-examples').textContent = examplesShown ? 'Hide example profiles' : 'Load example profiles'; renderMatches(); });
$('#clear-imports').addEventListener('click', () => { peers = []; write(PEERS_KEY, peers); status($('#import-status'), 'Imported profiles cleared.'); renderMatches(); });
