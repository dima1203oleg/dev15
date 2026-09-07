/**
 * SIREN UA ThreatServer Integration Service
 * 
 * Provides unified, contract-locked integration with SirenUA-ThreatServer & SirenUA core.
 * Handles live polling, status probing, spatial threat radar, structured fallback caching,
 * and explicit connectivity states ('LIVE' | 'NOT_CONNECTED' | 'CACHED' | 'STALE' | 'DEMO').
 * 
 * ZERO FAKE LIVE DATA: Never claims LIVE unless verified from upstream ingest.
 */

import { RegionData, AlertEvent, ThreatTrajectory, ThreatSceneModel, ThreatDataMode, Shelter, DataEnvelope, DataState } from '../types';
import { INITIAL_REGIONS, INITIAL_ALERTS_FEED } from '../data/ukraineMapData';
import { INITIAL_TRAJECTORIES } from '../data/spatialThreatData';
import { CacheManager } from '../utils/cacheManager';
import { apiUrl, runtimeConfig } from '../config/runtime';
import { getJsonFromPaths, isJsonObject } from './apiClient';

export type ThreatServerConnectionStatus = 
  | 'CONNECTED' 
  | 'NOT_CONNECTED' 
  | 'STALE' 
  | 'OFFLINE' 
  | 'DEMO_MODE';

export interface ThreatServerSystemStatus {
  service: string;
  version: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  uptimeSeconds: number;
  activeIngestSources: string[];
  lastIngestTimestamp: string;
  latencyMs: number;
  totalActiveAlerts: number;
  totalActiveVectors: number;
  environment: 'production' | 'staging' | 'development' | 'offline_fallback';
}

export interface LiveThreatsPayload {
  regions: RegionData[];
  alerts: AlertEvent[];
  trajectories: ThreatTrajectory[];
  systemStatus: ThreatServerSystemStatus;
  threatScene: ThreatSceneModel;
  connectionStatus: ThreatServerConnectionStatus;
  lastUpdated: string;
  isRealData: boolean;
}

const API_BASE = apiUrl('/api/v1');
const CACHE_KEY_THREATS = 'sirenua_threat_payload_cache';

const offlineRegions = () => INITIAL_REGIONS.map((region) => ({
  ...region,
  isAlarm: false,
  threatType: 'none' as const,
  startedAt: null,
  durationMinutes: 0,
  threatDetails: undefined,
  activeRayons: undefined,
}));

const REGION_CODE_BY_ID: Record<string, string> = {
  kyiv_obl: 'UA-32',
  vinnytsia: 'UA-05',
  cherkasy: 'UA-71',
  lviv: 'UA-46',
  dnipro: 'UA-12',
};

type Dev15Region = {
  code?: unknown;
  name?: unknown;
  hasAlert?: unknown;
  riskLevel?: unknown;
  threatCount?: unknown;
  lastUpdated?: unknown;
  districts?: unknown;
};

type Dev15Threat = {
  id?: unknown;
  category?: unknown;
  categoryLabel?: unknown;
  speedKmh?: unknown;
  directionDeg?: unknown;
  directionLabel?: unknown;
  originRegion?: unknown;
  trajectory?: unknown;
  estimatedArrivalMin?: unknown;
  targetDistricts?: unknown;
  status?: unknown;
  source?: unknown;
};

const dev15ThreatType = (value: unknown): ThreatTrajectory['threatType'] => {
  const category = String(value ?? '').toUpperCase();
  if (category.includes('MISSILE')) return 'missile';
  if (category.includes('BALLISTIC')) return 'ballistic';
  if (category.includes('AVIATION')) return 'aviation';
  return 'drone';
};

const dev15ThreatRegion = (threat: Dev15Threat): string => {
  const text = [threat.originRegion, ...(Array.isArray(threat.targetDistricts) ? threat.targetDistricts : [])]
    .map(String)
    .join(' ')
    .toLowerCase();
  if (text.includes('вінниц') || text.includes('гайсин')) return 'vinnytsia';
  if (text.includes('київ') || text.includes('обух') || text.includes('борисп')) return 'kyiv_obl';
  if (text.includes('черкас')) return 'cherkasy';
  if (text.includes('дніпр')) return 'dnipro';
  return 'kyiv_obl';
};

const projectDev15Point = (value: unknown): { x: number; y: number } | null => {
  if (!isJsonObject(value) || typeof value.lat !== 'number' || typeof value.lng !== 'number') return null;
  return {
    x: Math.max(0, Math.min(1000, ((value.lng - 22) / 18) * 1000)),
    y: Math.max(0, Math.min(650, ((53.5 - value.lat) / 8.5) * 650)),
  };
};

const mapDev15Regions = (remoteRegions: unknown): RegionData[] => {
  const rows = Array.isArray(remoteRegions) ? remoteRegions.filter(isJsonObject) as Dev15Region[] : [];
  const byCode = new Map(rows.map((row) => [String(row.code ?? ''), row]));
  return INITIAL_REGIONS.map((base) => {
    const row = byCode.get(REGION_CODE_BY_ID[base.id]);
    if (!row) return { ...base, isAlarm: false, threatType: 'none', threatDetails: undefined };
    const risk = String(row.riskLevel ?? '').toUpperCase();
    const threatType: RegionData['threatType'] = risk === 'CRITICAL' ? 'ballistic' : risk === 'HIGH' || risk === 'ELEVATED' ? 'drone' : 'none';
    return {
      ...base,
      isAlarm: row.hasAlert === true,
      threatType,
      threatDetails: typeof row.name === 'string' ? `Backend status: ${row.name}` : undefined,
      startedAt: typeof row.lastUpdated === 'string' ? row.lastUpdated : base.startedAt,
    };
  });
};

const mapDev15Trajectories = (remoteThreats: unknown): ThreatTrajectory[] => {
  const rows = Array.isArray(remoteThreats) ? remoteThreats.filter(isJsonObject) as Dev15Threat[] : [];
  return rows.flatMap((threat, index) => {
    const points = Array.isArray(threat.trajectory)
      ? threat.trajectory.map(projectDev15Point).filter((point): point is { x: number; y: number } => Boolean(point))
      : [];
    if (!points.length) return [];
    const etaMatch = String(threat.estimatedArrivalMin ?? '').match(/\d+/);
    const type = dev15ThreatType(threat.category);
    return [{
      id: typeof threat.id === 'string' ? threat.id : `dev15-threat-${index}`,
      threatType: type,
      name: typeof threat.categoryLabel === 'string' ? threat.categoryLabel : 'Активна подія',
      altitudeMeters: 0,
      speedKmh: typeof threat.speedKmh === 'number' ? threat.speedKmh : 0,
      azimuthDeg: typeof threat.directionDeg === 'number' ? threat.directionDeg : 0,
      azimuthDirection: typeof threat.directionLabel === 'string' ? threat.directionLabel : 'Напрямок не визначено',
      pathD: `M ${points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' L ')}`,
      currentPoint: { x: points[0].x, y: points[0].y, z: 22 },
      origin: typeof threat.originRegion === 'string' ? threat.originRegion : 'Джерело не визначено',
      targetRegion: dev15ThreatRegion(threat),
      etaMinutes: etaMatch ? Number(etaMatch[0]) : 0,
      status: threat.status === 'ACTIVE' || threat.status === 'TRACKING' ? 'ACTIVE' : 'WARNING',
      altitudeLevel: 'MEDIUM',
    } satisfies ThreatTrajectory];
  });
};

// Verified Shelters registry mapped to regions
const REGION_SHELTERS: Record<string, Shelter> = {
  kyiv_city: {
    id: 'sh-kyiv-1',
    name: 'Станція метро «Золоті Ворота»',
    type: 'metro',
    address: 'вул. Володимирська, 44, Київ',
    regionId: 'kyiv_city',
    capacity: 2500,
    features: { powerGenerator: true, wifi: true, ventilation: true, waterSupply: true, wheelchairAccessible: true, allDayOpen: true },
    distanceMeters: 340,
    walkTimeMins: 4,
    verifiedStatus: 'VERIFIED_DSNS',
  },
  kyiv_obl: {
    id: 'sh-kyiv-obl-1',
    name: 'Центральне сховище цивільного захисту',
    type: 'bunker',
    address: 'вул. Соборна, 12, Біла Церква',
    regionId: 'kyiv_obl',
    capacity: 1200,
    features: { powerGenerator: true, wifi: true, ventilation: true, waterSupply: true, wheelchairAccessible: true, allDayOpen: true },
    distanceMeters: 480,
    walkTimeMins: 6,
    verifiedStatus: 'VERIFIED_DSNS',
  },
  odesa: {
    id: 'sh-odesa-1',
    name: 'Бомбосховище №14 (Підземний паркінг)',
    type: 'parking',
    address: 'вул. Дерибасівська, 16, Одеса',
    regionId: 'odesa',
    capacity: 900,
    features: { powerGenerator: true, wifi: true, ventilation: true, waterSupply: true, wheelchairAccessible: true, allDayOpen: true },
    distanceMeters: 280,
    walkTimeMins: 3,
    verifiedStatus: 'VERIFIED_DSNS',
  },
  kharkiv: {
    id: 'sh-kharkiv-1',
    name: 'Станція метро «Університет»',
    type: 'metro',
    address: 'пл. Свободи, Харків',
    regionId: 'kharkiv',
    capacity: 3500,
    features: { powerGenerator: true, wifi: true, ventilation: true, waterSupply: true, wheelchairAccessible: true, allDayOpen: true },
    distanceMeters: 190,
    walkTimeMins: 2,
    verifiedStatus: 'VERIFIED_DSNS',
  },
  dnipro: {
    id: 'sh-dnipro-1',
    name: 'Станція метро «Вокзальна»',
    type: 'metro',
    address: 'Вокзальна площа, Дніпро',
    regionId: 'dnipro',
    capacity: 2200,
    features: { powerGenerator: true, wifi: true, ventilation: true, waterSupply: true, wheelchairAccessible: true, allDayOpen: true },
    distanceMeters: 310,
    walkTimeMins: 4,
    verifiedStatus: 'VERIFIED_DSNS',
  },
  lviv: {
    id: 'sh-lviv-1',
    name: 'Укриття ЛНУ ім. Івана Франка',
    type: 'bunker',
    address: 'вул. Університетська, 1, Львів',
    regionId: 'lviv',
    capacity: 1500,
    features: { powerGenerator: true, wifi: true, ventilation: true, waterSupply: true, wheelchairAccessible: true, allDayOpen: true },
    distanceMeters: 420,
    walkTimeMins: 5,
    verifiedStatus: 'VERIFIED_DSNS',
  },
};

class ThreatServerService {
  private connectionStatus: ThreatServerConnectionStatus = 'NOT_CONNECTED';
  private lastStatus: ThreatServerSystemStatus | null = null;
  private isDemoMode: boolean = false;
  private demoState: {
    regions: RegionData[];
    alerts: AlertEvent[];
    trajectories: ThreatTrajectory[];
  } | null = null;

  public setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
  }

  public getIsDemoMode(): boolean {
    return this.isDemoMode;
  }

  public setDemoState(regions: RegionData[], alerts: AlertEvent[], trajectories: ThreatTrajectory[]) {
    this.demoState = { regions, alerts, trajectories };
  }

  public getConnectionStatus(): ThreatServerConnectionStatus {
    if (this.isDemoMode) return 'DEMO_MODE';
    return this.connectionStatus;
  }

  /**
   * Helper to format time truthfully from Date or timestamp
   */
  public formatTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  /**
   * Normalizes threat data into a single verified ThreatSceneModel
   */
  public normalizeThreatScene(
    regions: RegionData[],
    trajectories: ThreatTrajectory[],
    myRegionId: string,
    state: DataState,
    updatedAt: string
  ): ThreatSceneModel {
    const safeRegions = regions || [];
    const activeAlarms = safeRegions.filter(r => r.isAlarm);
    const activeAlarmsCount = activeAlarms.length;
    
    const myRegionObj = safeRegions.find(r => r.id === myRegionId) || {
      id: myRegionId,
      name: myRegionId === 'odesa' ? 'Одеська область' : myRegionId,
      isAlarm: false,
      threatType: 'none',
    };

    // Find active trajectory targeting my region or highest speed primary threat
    const primaryTrajectory = trajectories.find(t => t.status === 'ACTIVE' && t.targetRegion === myRegionId)
      || trajectories.find(t => t.status === 'ACTIVE')
      || (trajectories.length > 0 ? trajectories[0] : null);

    // Calculate dynamic ETA for my region
    let calculatedEta = 0;
    if (myRegionObj.isAlarm && primaryTrajectory) {
      calculatedEta = primaryTrajectory.etaMinutes || 12;
    }

    // A threat payload does not prove shelter availability. Only expose the
    // local catalog in explicit DEMO mode; LIVE/CACHED scenes must wait for
    // the shelter registry contract instead of presenting invented proximity.
    const nearestShelter = state === 'DEMO'
      ? REGION_SHELTERS[myRegionId] || REGION_SHELTERS['kyiv_city'] || null
      : null;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (myRegionObj.isAlarm) {
      if (myRegionObj.threatType === 'ballistic' || myRegionObj.threatType === 'missile') {
        riskLevel = 'CRITICAL';
      } else if (myRegionObj.threatType === 'drone' || myRegionObj.threatType === 'aviation') {
        riskLevel = 'HIGH';
      } else {
        riskLevel = 'MEDIUM';
      }
    }

    let dataMode: ThreatDataMode = 'NOT_CONNECTED';
    if (state === 'LIVE') dataMode = 'LIVE';
    else if (state === 'DEMO') dataMode = 'DEMO_DATA';
    else if (state === 'CACHED') dataMode = 'CACHED';
    else if (state === 'STALE') dataMode = 'STALE';
    else if (state === 'ERROR') dataMode = 'ERROR';

    let freshness: 'REALTIME' | 'STABLE' | 'STALE' | 'DEGRADED' = 'DEGRADED';
    if (state === 'LIVE') freshness = 'REALTIME';
    else if (state === 'DEMO' || state === 'CACHED') freshness = 'STABLE';
    else if (state === 'STALE') freshness = 'STALE';

    return {
      timestamp: updatedAt,
      freshness,
      dataMode,
      activeAlarmsCount,
      criticalRegions: safeRegions.filter(r => r.isAlarm && (r.threatType === 'ballistic' || r.threatType === 'missile')).map(r => r.id),
      primaryThreat: primaryTrajectory,
      nearestShelter,
      myRegionStatus: {
        id: myRegionId,
        name: myRegionObj.name || 'Одеська область',
        isAlarm: myRegionObj.isAlarm || false,
        etaMinutes: calculatedEta,
        riskLevel,
      },
    };
  }

  /**
   * Probes ThreatServer health
   */
  public async checkHealth(): Promise<ThreatServerSystemStatus> {
    const start = performance.now();
    try {
      const response = await fetch(`${API_BASE}/system/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000)
      });

      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        const data = await response.json();
        this.connectionStatus = 'CONNECTED';
        this.lastStatus = {
          ...data,
          latencyMs,
          status: 'HEALTHY'
        };
        return this.lastStatus;
      } else {
        this.connectionStatus = 'STALE';
      }
    } catch {
      this.connectionStatus = 'NOT_CONNECTED';
    }

    this.lastStatus = {
      service: 'SirenUA-ThreatServer',
      version: '2.4.0',
      status: 'OFFLINE',
      uptimeSeconds: 0,
      activeIngestSources: [],
      lastIngestTimestamp: new Date().toISOString(),
      latencyMs: 0,
      totalActiveAlerts: 0,
      totalActiveVectors: 0,
      environment: 'offline_fallback'
    };

    return this.lastStatus;
  }

  /**
   * Fetches threat dataset wrapped in DataEnvelope
   */
  public async fetchLiveThreats(myRegionId: string = 'odesa'): Promise<DataEnvelope<LiveThreatsPayload>> {
    const nowTime = this.formatTime();

    // 1. Explicit DEMO Mode
    if (this.isDemoMode) {
      const demoRegions = this.demoState?.regions || INITIAL_REGIONS;
      const demoAlerts = this.demoState?.alerts || INITIAL_ALERTS_FEED;
      const demoTrajectories = this.demoState?.trajectories || INITIAL_TRAJECTORIES;

      const threatScene = this.normalizeThreatScene(demoRegions, demoTrajectories, myRegionId, 'DEMO', nowTime);

      const payload: LiveThreatsPayload = {
        regions: demoRegions,
        alerts: demoAlerts,
        trajectories: demoTrajectories,
        systemStatus: {
          service: 'SirenUA-Simulator',
          version: '2.4.0',
          status: 'HEALTHY',
          uptimeSeconds: 3600,
          activeIngestSources: ['SIMULATOR_SCENARIO'],
          lastIngestTimestamp: new Date().toISOString(),
          latencyMs: 8,
          totalActiveAlerts: demoRegions.filter(r => r.isAlarm).length,
          totalActiveVectors: demoTrajectories.length,
          environment: 'development',
        },
        threatScene,
        connectionStatus: 'DEMO_MODE',
        lastUpdated: nowTime,
        isRealData: false,
      };

      return {
        data: payload,
        state: 'DEMO',
        source: 'SIMULATOR_ENGINE',
        updatedAt: nowTime,
        isRealData: false,
        latencyMs: 5,
      };
    }

    // A static production build without an explicitly configured API must be
    // instant and truthful. Do not probe same-origin demo routes or wait on
    // network timeouts before showing the unavailable state.
    if (!runtimeConfig.apiBaseUrl && !runtimeConfig.allowDemoData) {
      return this.offlineResponse(myRegionId, nowTime);
    }

    // 2. Attempt real upstream backend fetch
    // Dev15 is the canonical local integration boundary. Its responses are
    // deliberately labelled DEMO_DATA until an authoritative threat source
    // is configured, so the UI must preserve that state end-to-end.
    try {
        const [regionsRemote, liveRemote, statusRemote] = await Promise.all([
          getJsonFromPaths<unknown>(['/api/threats/regions'], 2500),
          getJsonFromPaths<unknown>(['/api/threats/live'], 2500),
          getJsonFromPaths<unknown>(['/api/threats/status'], 2500),
        ]);
        const remoteRegions = isJsonObject(regionsRemote) ? regionsRemote.regions : regionsRemote;
        const remoteThreats = isJsonObject(liveRemote) ? liveRemote.threats : [];
        if (!Array.isArray(remoteRegions) || !Array.isArray(remoteThreats)) throw new Error('Canonical threat payload has invalid shape');

        const regions = mapDev15Regions(remoteRegions);
        const trajectories = mapDev15Trajectories(remoteThreats);
        const timestamp = isJsonObject(liveRemote) && typeof liveRemote.timestamp === 'string'
          ? liveRemote.timestamp
          : new Date().toISOString();
        const demo = (isJsonObject(liveRemote) && liveRemote.dataMode === 'DEMO_DATA')
          || (isJsonObject(statusRemote) && statusRemote.status === 'DEMO_DATA');
        if (demo && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
        const state: DataState = demo ? 'DEMO' : 'LIVE';
        const alerts: AlertEvent[] = regions.filter((region) => region.isAlarm).map((region) => ({
          id: `backend-${region.id}`,
          regionId: region.id,
          regionName: region.name,
          type: 'update',
          threatType: region.threatType === 'none' ? 'air' : region.threatType,
          timestamp,
          description: region.threatDetails || 'Оновлено статус регіону',
          source: demo ? 'Dev15 DEMO_DATA' : 'Dev15 ThreatServer',
        }));
        const threatScene = this.normalizeThreatScene(regions, trajectories, myRegionId, state, this.formatTime(new Date(timestamp)));
        const payload: LiveThreatsPayload = {
          regions,
          alerts,
          trajectories,
          systemStatus: {
            service: 'SirenUA-ThreatServer',
            version: 'Dev15',
            status: 'HEALTHY',
            uptimeSeconds: 0,
            activeIngestSources: isJsonObject(statusRemote) && typeof statusRemote.authoritativeSource === 'string' ? [statusRemote.authoritativeSource] : [],
            lastIngestTimestamp: timestamp,
            latencyMs: 0,
            totalActiveAlerts: regions.filter((region) => region.isAlarm).length,
            totalActiveVectors: trajectories.length,
            environment: demo ? 'development' : 'production',
          },
          threatScene,
          connectionStatus: demo ? 'DEMO_MODE' : 'CONNECTED',
          lastUpdated: this.formatTime(new Date(timestamp)),
          isRealData: !demo,
        };
        this.connectionStatus = demo ? 'DEMO_MODE' : 'CONNECTED';
        CacheManager.set(CACHE_KEY_THREATS, payload, 300, 'SIREN_UA_DEV15_THREATS');
        return {
          data: payload,
          state,
          source: demo ? 'SIREN_UA_DEV15_DEMO' : 'SIREN_UA_DEV15_THREATSERVER',
          updatedAt: payload.lastUpdated,
          isRealData: !demo,
        };
    } catch {
      // Continue to the legacy `/api/v1` contract and then the truthful
      // cache/offline path below.
    }

    try {
      const start = performance.now();
      const [regionsRes, alertsRes, radarRes] = await Promise.all([
        fetch(`${API_BASE}/threats/regions`, { signal: AbortSignal.timeout(2500) }),
        fetch(`${API_BASE}/alerts/feed`, { signal: AbortSignal.timeout(2500) }),
        fetch(`${API_BASE}/threats/spatial`, { signal: AbortSignal.timeout(2500) }),
      ]);

      const latencyMs = Math.round(performance.now() - start);

      if (regionsRes.ok && alertsRes.ok && radarRes.ok) {
        const regions: RegionData[] = await regionsRes.json();
        const alerts: AlertEvent[] = await alertsRes.json();
        const trajectories: ThreatTrajectory[] = await radarRes.json();
        
        this.connectionStatus = 'CONNECTED';
        const threatScene = this.normalizeThreatScene(regions, trajectories, myRegionId, 'LIVE', nowTime);

        const payload: LiveThreatsPayload = {
          regions,
          alerts,
          trajectories,
          systemStatus: await this.checkHealth(),
          threatScene,
          connectionStatus: 'CONNECTED',
          lastUpdated: nowTime,
          isRealData: true,
        };

        // Cache for structured offline continuity
        CacheManager.set(CACHE_KEY_THREATS, payload, 300, 'SIREN_UA_LIVE_API');

        return {
          data: payload,
          state: 'LIVE',
          source: 'SIREN_UA_THREAT_INGEST',
          updatedAt: nowTime,
          isRealData: true,
          latencyMs,
        };
      }
    } catch {
      // Backend not running / offline container
    }

    this.connectionStatus = 'NOT_CONNECTED';

    // 3. Structured Cache Evaluation
    const cached = CacheManager.get<LiveThreatsPayload>(CACHE_KEY_THREATS);
    if (cached.data && cached.data.isRealData === true && (cached.state === 'CACHED' || cached.state === 'STALE')) {
      const cachedPayload = cached.data;
      const formattedCachedTime = cached.fetchedAt 
        ? new Date(cached.fetchedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        : nowTime;

      const threatScene = this.normalizeThreatScene(
        cachedPayload.regions, 
        cachedPayload.trajectories, 
        myRegionId, 
        cached.state, 
        formattedCachedTime
      );

      return {
        data: {
          ...cachedPayload,
          threatScene,
          connectionStatus: cached.state === 'CACHED' ? 'CONNECTED' : 'STALE',
          lastUpdated: formattedCachedTime,
          isRealData: true,
        },
        state: cached.state,
        source: cached.source || 'LOCAL_CACHE',
        updatedAt: formattedCachedTime,
        isRealData: true,
      };
    }

    // 4. Default Offline / Unconnected State (Truthful fallback without fake LIVE claims)
    return this.offlineResponse(myRegionId, nowTime);
  }

  private offlineResponse(myRegionId: string, nowTime: string): DataEnvelope<LiveThreatsPayload> {
    const fallbackRegions = offlineRegions();
    const fallbackTrajectories: ThreatTrajectory[] = [];
    const fallbackScene = this.normalizeThreatScene(fallbackRegions, fallbackTrajectories, myRegionId, 'NOT_CONNECTED', nowTime);
    return {
      data: {
        regions: fallbackRegions,
        alerts: [],
        trajectories: fallbackTrajectories,
        systemStatus: {
          service: 'SirenUA-ThreatServer',
          version: '2.4.0',
          status: 'OFFLINE',
          uptimeSeconds: 0,
          activeIngestSources: [],
          lastIngestTimestamp: new Date().toISOString(),
          latencyMs: 0,
          totalActiveAlerts: 0,
          totalActiveVectors: 0,
          environment: 'offline_fallback',
        },
        threatScene: fallbackScene,
        connectionStatus: 'NOT_CONNECTED',
        lastUpdated: nowTime,
        isRealData: false,
      },
      state: 'NOT_CONNECTED',
      source: 'OFFLINE_BASELINE',
      updatedAt: nowTime,
      isRealData: false,
      error: 'Сервер моніторингу тимчасово недоступний',
    };
  }
}

export const threatServerService = new ThreatServerService();
