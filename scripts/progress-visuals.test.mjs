import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressMilestones, activitySummary } from '../src/features/progress/progressVisuals.ts';

const empty = () => ({
  overview: { reviewed_words: 0, longest_streak: 0 },
  reading: { completed_texts: 0 },
  evidence: { dimensions: [] },
});
const course = { completed_lessons: 0, independent_lessons: 0, confirmed_lessons: 0 };

test('no activity yields no achievements, missing course is unknown', () => {
  assert.ok(progressMilestones(empty(), course).every((item) => !item.earned));
  assert.equal(progressMilestones(empty(), undefined)[0].value, null);
});
test('practice and recognition never award independent or delayed recall', () => {
  const data = empty();
  data.overview.reviewed_words = 50;
  data.evidence.dimensions = [{ kind: 'recognition', independent_words: 100, confirmed_words: 50 }];
  const milestones = progressMilestones(data, course);
  assert.ok(milestones.find((item) => item.id === 'words').earned);
  assert.ok(!milestones.find((item) => item.id === 'recall').earned);
  assert.ok(!milestones.find((item) => item.id === 'memory').earned);
});
test('independent evidence does not imply delayed confirmation', () => {
  const data = empty();
  data.evidence.dimensions = [{ kind: 'written_recall', independent_words: 10, confirmed_words: 0 }];
  const milestones = progressMilestones(data, course);
  assert.ok(milestones.find((item) => item.id === 'recall').earned);
  assert.ok(!milestones.find((item) => item.id === 'memory').earned);
});
test('delayed word recall and confirmed lessons both qualify, without adding word modes', () => {
  const data = empty();
  data.evidence.dimensions = ['spoken_recall', 'written_recall'].map((kind) => ({ kind, independent_words: 2, confirmed_words: 1 }));
  assert.equal(progressMilestones(data, course).find((item) => item.id === 'recall').value, 2);
  assert.ok(progressMilestones(data, course).find((item) => item.id === 'memory').earned);
  assert.ok(progressMilestones(empty(), { ...course, confirmed_lessons: 1 }).find((item) => item.id === 'memory').earned);
});
test('historical streak achievement survives a broken current streak', () => {
  const data = empty();
  data.overview.longest_streak = 3;
  data.overview.current_streak = 0;
  assert.ok(progressMilestones(data, course).find((item) => item.id === 'rhythm').earned);
});
test('activity accuracy is weighted by answers; no answers means unknown', () => {
  assert.deepEqual(activitySummary([]), { attempts: 0, minutes: 0, accuracy: null });
  assert.deepEqual(activitySummary([{ attempts: 1, correct: 0, minutes: 2 }, { attempts: 9, correct: 9, minutes: 10 }]), { attempts: 10, minutes: 12, accuracy: 90 });
});

import { clampCompanion, goalTransition } from '../src/features/daily-practice/companionState.ts';

test('celebration requires a transition within the same learning day', () => {
  const complete = { date: '2026-10-18', complete: true };
  assert.equal(goalTransition(undefined, complete), false);
  assert.equal(goalTransition(complete, complete), false);
  assert.equal(goalTransition({ date: '2026-10-17', complete: false }, complete), false);
  assert.equal(goalTransition({ date: '2026-10-18', complete: false }, complete), true);
});
test('companion remains reachable after dragging or resizing to mobile', () => {
  assert.deepEqual(clampCompanion({ x: 900, y: 700 }, 390, 844), { x: 262, y: 658 });
  assert.deepEqual(clampCompanion({ x: -100, y: -20 }, 390, 844), { x: 8, y: 128 });
});
