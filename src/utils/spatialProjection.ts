import { TrajectoryPointModel } from '../data/spatialModel';

type Coordinate = { lat: number; lng: number };

export interface ProjectedTrajectory {
  path: string;
  currentPoint: { x: number; y: number } | null;
}

/**
 * Projects authoritative lat/lng points into a renderer viewport. This is a
 * display projection only; it never interpolates, predicts, or invents points.
 */
export function projectTrajectory(
  points: TrajectoryPointModel[],
  currentPosition: Coordinate | undefined,
  width: number,
  height: number,
  padding = 28
): ProjectedTrajectory | null {
  if (points.length === 0 && !currentPosition) return null;

  const coordinates = points.map(({ lat, lng }) => ({ lat, lng }));
  if (currentPosition) coordinates.push(currentPosition);
  const lats = coordinates.map(({ lat }) => lat);
  const lngs = coordinates.map(({ lng }) => lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const lngSpan = Math.max(maxLng - minLng, 0.0001);
  const project = ({ lat, lng }: Coordinate) => ({
    x: padding + ((lng - minLng) / lngSpan) * (width - padding * 2),
    y: height - padding - ((lat - minLat) / latSpan) * (height - padding * 2)
  });

  const projectedPoints = points.map(project);
  const path = projectedPoints.length > 1
    ? projectedPoints.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
    : '';

  return { path, currentPoint: currentPosition ? project(currentPosition) : null };
}
