import assert from 'node:assert/strict';
import { projectTrajectory } from '../src/utils/spatialProjection';

const points = [
  { lat: 49.85, lng: 31.95, timeOffsetMin: 0, isConfirmed: true },
  { lat: 50.15, lng: 31.25, timeOffsetMin: 12, isConfirmed: false },
  { lat: 50.45, lng: 30.52, timeOffsetMin: 36, isConfirmed: false },
];

const projected = projectTrajectory(points, { lat: 49.85, lng: 31.95 }, 520, 260);
assert.ok(projected);
assert.match(projected.path, /^M/);
assert.equal(projected.path.split(' L').length, points.length);
assert.ok(projected.currentPoint);

// A renderer must not create a path from an absent or single-point payload.
assert.equal(projectTrajectory([], undefined, 520, 260), null);
assert.equal(projectTrajectory([points[0]], points[0], 520, 260)?.path, '');

console.log('Spatial acceptance tests: PASS');
