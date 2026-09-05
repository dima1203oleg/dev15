/**
 * Normalized model for every SIREN UA spatial presentation.
 *
 * The renderers consume this model instead of binding directly to raw
 * ThreatServer responses. DEMO_SPATIAL_MODEL is a visual fixture only and
 * must never be presented as authoritative live data.
 */

import { RegionAlert, Shelter, ThreatEvent } from '../types';

export type SpatialDevice = 'TV' | 'DESKTOP' | 'LAPTOP' | 'TABLET' | 'MOBILE' | 'WATCH' | 'CAR' | 'AR';

export type SpatialDataMode = 'LIVE' | 'DEMO_DATA' | 'NOT_CONNECTED';

export type SpatialLayerKey = 'LIVE_DATA' | 'SHELTERS' | 'PERSONAL_REGION' | 'RISK' | 'TRAJECTORY' | 'EVENTS';

export type SpatialTone = 'cyan' | 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';

export interface SpatialLayer {
  id: SpatialLayerKey;
  label: string;
  shortLabel: string;
  detail: string;
  tone: SpatialTone;
}

export interface RegionState {
  id: string;
  label: string;
  status: string;
  risk: string;
}

export interface ThreatEventModel {
  id: string;
  label: string;
  status: string;
  confidence: string;
  eta: string;
}

export interface TrajectoryPointModel {
  lat: number;
  lng: number;
  timeOffsetMin: number;
  isConfirmed: boolean;
}

export interface TrajectoryModel {
  id: string;
  direction: string;
  confidence: string;
  status: string;
  points: TrajectoryPointModel[];
  currentPosition?: { lat: number; lng: number };
}

export interface RiskState {
  label: string;
  level: string;
  confidence: string;
}

export interface ShelterModel {
  id: string;
  label: string;
  distance: string;
  status: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  label: string;
  tone: SpatialTone;
}

export interface ThreatSceneModel {
  dataMode: SpatialDataMode;
  lastUpdated: string | null;
  region: RegionState;
  risk: RiskState;
  activeEvents: number;
  layers: SpatialLayer[];
  events: ThreatEventModel[];
  trajectories: TrajectoryModel[];
  shelters: ShelterModel[];
  timeline: TimelineEvent[];
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

function isValidThreatEvent(value: unknown): value is ThreatEvent {
  if (!value || typeof value !== 'object') return false;
  const threat = value as ThreatEvent;
  return isString(threat.id)
    && isString(threat.categoryLabel)
    && isFiniteNumber(threat.currentLat)
    && isFiniteNumber(threat.currentLng)
    && isString(threat.updatedAt)
    && isString(threat.source)
    && Array.isArray(threat.trajectory)
    && threat.trajectory.every((point) => point && isFiniteNumber(point.lat) && isFiniteNumber(point.lng) && isFiniteNumber(point.timeOffsetMin) && typeof point.isConfirmed === 'boolean');
}

function isValidRegion(value: unknown): value is RegionAlert {
  if (!value || typeof value !== 'object') return false;
  const region = value as RegionAlert;
  return isString(region.id)
    && isString(region.name)
    && isString(region.riskLevel)
    && Number.isInteger(region.threatCount)
    && region.threatCount >= 0
    && Number.isInteger(region.sheltersCount)
    && region.sheltersCount >= 0
    && Array.isArray(region.districts);
}

function isValidShelter(value: unknown): value is Shelter {
  if (!value || typeof value !== 'object') return false;
  const shelter = value as Shelter;
  return isString(shelter.id)
    && isString(shelter.name)
    && isString(shelter.address)
    && isFiniteNumber(shelter.lat)
    && isFiniteNumber(shelter.lng)
    && (shelter.distanceMeters === undefined || isFiniteNumber(shelter.distanceMeters));
}

export function isValidThreatPayload(value: unknown): value is { threats: ThreatEvent[]; regions: RegionAlert[]; shelters: Shelter[] } {
  if (!value || typeof value !== 'object') return false;
  const payload = value as { threats?: unknown; regions?: unknown; shelters?: unknown };
  return Array.isArray(payload.threats)
    && Array.isArray(payload.regions)
    && Array.isArray(payload.shelters)
    && payload.threats.every(isValidThreatEvent)
    && payload.regions.every(isValidRegion)
    && payload.shelters.every(isValidShelter);
}

export function createSpatialModel(args: {
  dataMode: SpatialDataMode;
  threats: ThreatEvent[];
  regions: RegionAlert[];
  shelters: Shelter[];
  lastUpdated: string | null;
}): ThreatSceneModel {
  const region = args.regions[0];
  const leadThreat = args.threats[0];
  return {
    dataMode: args.dataMode,
    lastUpdated: args.lastUpdated,
    region: {
      id: region?.id ?? 'unknown',
      label: region?.name ?? 'Регіон не визначено',
      status: region?.riskLevel ?? 'Дані недоступні',
      risk: region?.riskLevel ?? 'UNKNOWN'
    },
    risk: {
      label: region?.riskLevel ?? 'Очікуємо підключення',
      level: region?.riskLevel ?? 'UNKNOWN',
      confidence: leadThreat?.confidence ?? 'UNKNOWN'
    },
    activeEvents: args.threats.length,
    layers: SPATIAL_LAYERS,
    events: args.threats.map((threat) => ({
      id: threat.id,
      label: threat.categoryLabel,
      status: threat.status,
      confidence: threat.confidence,
      eta: threat.estimatedArrivalMin
    })),
    trajectories: args.threats.map((threat) => ({
      id: `${threat.id}-trajectory`,
      direction: threat.directionLabel,
      confidence: threat.confidence,
      status: threat.status,
      points: threat.trajectory.map((point) => ({
        lat: point.lat,
        lng: point.lng,
        timeOffsetMin: point.timeOffsetMin,
        isConfirmed: point.isConfirmed
      })),
      currentPosition: { lat: threat.currentLat, lng: threat.currentLng }
    })),
    shelters: args.shelters.map((shelter) => ({
      id: shelter.id,
      label: shelter.name,
      distance: shelter.distanceMeters === undefined ? 'Відстань недоступна' : `${shelter.distanceMeters} м`,
      status: 'Статус доступності не надано'
    })),
    // The current HTTP contract has no historical timeline endpoint. Do not
    // manufacture history from current events; an empty timeline is honest.
    timeline: []
  };
}

export const SPATIAL_LAYERS: SpatialLayer[] = [
  { id: 'LIVE_DATA', label: 'АКТУАЛЬНІ ДАНІ', shortLabel: 'Дані', detail: 'freshness + джерело', tone: 'cyan' },
  { id: 'SHELTERS', label: 'УКРИТТЯ', shortLabel: 'Укриття', detail: 'поруч із вами', tone: 'emerald' },
  { id: 'PERSONAL_REGION', label: 'ТВІЙ РАЙОН', shortLabel: 'Район', detail: 'персональний контекст', tone: 'blue' },
  { id: 'RISK', label: 'РІВЕНЬ РИЗИКУ', shortLabel: 'Ризик', detail: 'статус + впевненість', tone: 'amber' },
  { id: 'TRAJECTORY', label: 'ТРАЄКТОРІЯ', shortLabel: 'Напрямок', detail: 'оцінка, не гарантія', tone: 'rose' },
  { id: 'EVENTS', label: 'LIVE EVENTS', shortLabel: 'Події', detail: 'синхронізована шкала', tone: 'violet' },
];

export const DEMO_SPATIAL_MODEL: ThreatSceneModel = {
  dataMode: 'DEMO_DATA',
  lastUpdated: '18:34:21',
  region: { id: 'kyiv', label: 'Київський регіон', status: 'Підвищений ризик', risk: 'HIGH' },
  risk: { label: 'Підвищений ризик', level: 'HIGH', confidence: 'ESTIMATED' },
  activeEvents: 14,
  layers: SPATIAL_LAYERS,
  events: [
    { id: 'demo-1', label: 'Повітряна загроза', status: 'Спостереження', confidence: 'CONFIRMED', eta: '10–15 хв' },
    { id: 'demo-2', label: 'Зміна напрямку', status: 'Оцінюється', confidence: 'PREDICTED', eta: '20–30 хв' },
  ],
  trajectories: [
    { id: 'trajectory-1', direction: 'північно-західний', confidence: 'ESTIMATED', status: 'Оцінка', points: [] },
    { id: 'trajectory-2', direction: 'східний сектор', confidence: 'PREDICTED', status: 'Прогноз', points: [] },
  ],
  shelters: [
    { id: 'shelter-1', label: 'Найближче укриття', distance: '450 м', status: 'Відкрите' },
    { id: 'shelter-2', label: 'Резервне укриття', distance: '920 м', status: 'Перевірка' },
  ],
  timeline: [
    { id: 'time-1', time: '18:18', label: 'Перший сигнал', tone: 'cyan' },
    { id: 'time-2', time: '18:28', label: 'Оновлення ризику', tone: 'amber' },
    { id: 'time-3', time: '18:34', label: 'Поточний стан', tone: 'rose' },
  ],
};

export const EMPTY_SPATIAL_MODEL: ThreatSceneModel = {
  dataMode: 'NOT_CONNECTED',
  lastUpdated: null,
  region: { id: 'unknown', label: 'Регіон не визначено', status: 'Дані недоступні', risk: 'UNKNOWN' },
  risk: { label: 'Очікуємо підключення', level: 'UNKNOWN', confidence: 'UNKNOWN' },
  activeEvents: 0,
  layers: SPATIAL_LAYERS,
  events: [],
  trajectories: [],
  shelters: [],
  timeline: [],
};
