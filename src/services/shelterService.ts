import { Shelter } from '../types';
import { DataEnvelope } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';
import { getJsonFromPaths, inferDataState, isJsonObject } from './apiClient';
import { INITIAL_SHELTERS } from '../data/spatialThreatData';

const nowTime = () => new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

const isShelter = (value: unknown): value is Shelter => {
  if (!isJsonObject(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.address !== 'string') return false;
  if (typeof value.regionId !== 'string' || typeof value.capacity !== 'number' || typeof value.distanceMeters !== 'number' || typeof value.walkTimeMins !== 'number') return false;
  if (!['metro', 'bunker', 'basement', 'parking'].includes(String(value.type))) return false;
  if (!['VERIFIED_DSNS', 'COMMUNITY_CHECKED'].includes(String(value.verifiedStatus))) return false;
  if (!isJsonObject(value.features)) return false;
  return ['powerGenerator', 'wifi', 'ventilation', 'waterSupply', 'wheelchairAccessible', 'allDayOpen']
    .every((key) => typeof value.features?.[key] === 'boolean');
};

class ShelterService {
  public async getShelters(regionId: string): Promise<DataEnvelope<Shelter[]>> {
    const updatedAt = nowTime();

    if (!runtimeConfig.apiBaseUrl && !runtimeConfig.allowDemoData) {
      return {
        data: null,
        state: 'NOT_CONNECTED',
        source: 'SIREN_UA_SHELTER_REGISTRY',
        updatedAt,
        isRealData: false,
        error: 'Реєстр укриттів не підключений',
      };
    }

    if (runtimeConfig.apiBaseUrl) {
      try {
        const remote = await getJsonFromPaths<unknown>([
          `/api/threats/shelters?district=${encodeURIComponent(regionId)}`,
          `/api/v1/shelters?regionId=${encodeURIComponent(regionId)}`,
        ], 2500);
        const sourceItems = Array.isArray(remote)
          ? remote
          : isJsonObject(remote) && Array.isArray(remote.shelters) ? remote.shelters : [];
        const mapped: Array<Shelter | null> = sourceItems.map((item, index): Shelter | null => {
          if (!isJsonObject(item)) return null;
          const type = String(item.type).toUpperCase();
          const mappedType: Shelter['type'] = type === 'SUBWAY' ? 'metro' : type === 'PARKING' ? 'parking' : type === 'BASEMENT' ? 'basement' : 'bunker';
          const distanceMeters = typeof item.distanceMeters === 'number' ? item.distanceMeters : 0;
          return {
            id: typeof item.id === 'string' ? item.id : `shelter-${index}`,
            name: typeof item.name === 'string' ? item.name : 'Укриття',
            type: mappedType,
            address: typeof item.address === 'string' ? item.address : 'Адреса не вказана',
            regionId,
            capacity: typeof item.capacity === 'number' ? item.capacity : 0,
            features: {
              powerGenerator: item.hasPowerBackup === true,
              wifi: false,
              ventilation: true,
              waterSupply: item.hasWater === true,
              wheelchairAccessible: false,
              allDayOpen: item.isOpen24h === true,
            },
            distanceMeters,
            walkTimeMins: Math.max(1, Math.round(distanceMeters / 80)),
            verifiedStatus: 'VERIFIED_DSNS' as const,
          };
        }).filter((item): item is Shelter => item !== null);
        if (!mapped.length && !sourceItems.length) throw new Error('Shelter payload has invalid shape');
        const state = inferDataState(remote);
        if (state === 'DEMO' && !runtimeConfig.allowDemoData) throw new Error('DEMO_DATA_DISABLED_IN_PRODUCTION');
        return {
          data: mapped,
          state,
          source: 'SIREN_UA_SHELTER_REGISTRY',
          updatedAt,
          isRealData: state === 'LIVE',
        };
      } catch {
        return {
          data: null,
          state: 'NOT_CONNECTED',
          source: 'SIREN_UA_SHELTER_REGISTRY',
          updatedAt,
          isRealData: false,
          error: 'Реєстр укриттів не підключений або повернув некоректні дані',
        };
      }
    }

    return {
      data: INITIAL_SHELTERS.filter((shelter) => shelter.regionId === regionId),
      state: 'DEMO',
      source: 'LOCAL_DEMO_SHELTER_DATA',
      updatedAt,
      isRealData: false,
    };
  }
}

export const shelterService = new ShelterService();
