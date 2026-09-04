import { ThreatEvent, RegionAlert, Shelter } from '../types';

export const DEFAULT_REGIONS: RegionAlert[] = [
  {
    id: 'reg-kyiv',
    name: 'Київська область та м. Київ',
    nameEn: 'Kyiv Region & Kyiv City',
    code: 'UA-32',
    hasAlert: true,
    alertType: 'YELLOW',
    riskLevel: 'HIGH',
    threatCount: 2,
    sheltersCount: 4120,
    lastUpdated: '18:34:21',
    districts: [
      { name: 'Бориспільський район', riskLevel: 'HIGH', etaMinutes: '10–15 хв' },
      { name: 'Обухівський район', riskLevel: 'HIGH', etaMinutes: '20–25 хв' },
      { name: 'м. Київ (Лівий берег)', riskLevel: 'HIGH', etaMinutes: '25–35 хв' },
      { name: 'м. Київ (Правий берег)', riskLevel: 'ELEVATED', etaMinutes: '30–40 хв' },
      { name: 'Білоцерківський район', riskLevel: 'NORMAL' }
    ]
  },
  {
    id: 'reg-kharkiv',
    name: 'Харківська область',
    nameEn: 'Kharkiv Region',
    code: 'UA-63',
    hasAlert: true,
    alertType: 'RED',
    riskLevel: 'CRITICAL',
    threatCount: 3,
    sheltersCount: 2310,
    lastUpdated: '18:34:15',
    districts: [
      { name: 'Харківський район', riskLevel: 'CRITICAL', etaMinutes: '5–8 хв' },
      { name: 'Чугуївський район', riskLevel: 'CRITICAL', etaMinutes: '6–10 хв' },
      { name: 'Куп’янський район', riskLevel: 'CRITICAL', etaMinutes: '3–5 хв' },
      { name: 'Ізюмський район', riskLevel: 'HIGH', etaMinutes: '12–15 хв' }
    ]
  },
  {
    id: 'reg-vin',
    name: 'Вінницька область',
    nameEn: 'Vinnytsia Region',
    code: 'UA-05',
    hasAlert: true,
    alertType: 'RED',
    riskLevel: 'CRITICAL',
    threatCount: 1,
    sheltersCount: 1840,
    lastUpdated: '18:33:50',
    districts: [
      { name: 'Гайсинський район', riskLevel: 'CRITICAL', etaMinutes: '8–12 хв' },
      { name: 'Вінницький район', riskLevel: 'HIGH', etaMinutes: '15–20 хв' },
      { name: 'Жмеринський район', riskLevel: 'ELEVATED', etaMinutes: '25–35 хв' }
    ]
  },
  {
    id: 'reg-cherkasy',
    name: 'Черкаська область',
    nameEn: 'Cherkasy Region',
    code: 'UA-71',
    hasAlert: true,
    alertType: 'YELLOW',
    riskLevel: 'ELEVATED',
    threatCount: 1,
    sheltersCount: 1250,
    lastUpdated: '18:34:02',
    districts: [
      { name: 'Золотоніський район', riskLevel: 'HIGH', etaMinutes: '10–15 хв' },
      { name: 'Черкаський район', riskLevel: 'ELEVATED', etaMinutes: '20–30 хв' },
      { name: 'Уманський район', riskLevel: 'NORMAL' }
    ]
  },
  {
    id: 'reg-odesa',
    name: 'Одеська область',
    nameEn: 'Odesa Region',
    code: 'UA-51',
    hasAlert: false,
    alertType: 'NONE',
    riskLevel: 'NORMAL',
    threatCount: 0,
    sheltersCount: 2450,
    lastUpdated: '18:32:10',
    districts: [
      { name: 'Одеський район', riskLevel: 'NORMAL' },
      { name: 'Ізмаїльський район', riskLevel: 'NORMAL' },
      { name: 'Білгород-Дністровський район', riskLevel: 'NORMAL' }
    ]
  },
  {
    id: 'reg-lviv',
    name: 'Львівська область',
    nameEn: 'Lviv Region',
    code: 'UA-46',
    hasAlert: false,
    alertType: 'NONE',
    riskLevel: 'NORMAL',
    threatCount: 0,
    sheltersCount: 3100,
    lastUpdated: '18:30:00',
    districts: [
      { name: 'Львівський район', riskLevel: 'NORMAL' },
      { name: 'Стрийський район', riskLevel: 'NORMAL' },
      { name: 'Дрогобицький район', riskLevel: 'NORMAL' }
    ]
  },
  {
    id: 'reg-dnipro',
    name: 'Дніпропетровська область',
    nameEn: 'Dnipropetrovsk Region',
    code: 'UA-12',
    hasAlert: true,
    alertType: 'YELLOW',
    riskLevel: 'HIGH',
    threatCount: 2,
    sheltersCount: 2950,
    lastUpdated: '18:34:10',
    districts: [
      { name: 'Дніпровський район', riskLevel: 'HIGH', etaMinutes: '15–20 хв' },
      { name: 'Криворізький район', riskLevel: 'ELEVATED' },
      { name: 'Нікопольський район', riskLevel: 'CRITICAL', etaMinutes: '5–10 хв' }
    ]
  },
  {
    id: 'reg-sumy',
    name: 'Сумська область',
    nameEn: 'Sumy Region',
    code: 'UA-59',
    hasAlert: true,
    alertType: 'RED',
    riskLevel: 'CRITICAL',
    threatCount: 2,
    sheltersCount: 1100,
    lastUpdated: '18:34:20',
    districts: [
      { name: 'Сумський район', riskLevel: 'CRITICAL', etaMinutes: '4–8 хв' },
      { name: 'Охтирський район', riskLevel: 'HIGH', etaMinutes: '10–14 хв' }
    ]
  }
];

export const DEFAULT_THREATS: ThreatEvent[] = [
  {
    id: 'THR-2026-0904-01',
    category: 'DRONE_SHAhed',
    categoryLabel: 'Ударний БПЛА Shahed-136 (Група 3 од.)',
    speedKmh: 185,
    directionDeg: 315,
    directionLabel: 'Північний Захід (Полтавщина → Київщина)',
    originRegion: 'Полтавська область',
    currentLat: 49.85,
    currentLng: 31.95,
    trajectory: [
      { lat: 49.85, lng: 31.95, timeOffsetMin: 0, isConfirmed: true },
      { lat: 50.15, lng: 31.25, timeOffsetMin: 12, isConfirmed: false },
      { lat: 50.35, lng: 30.75, timeOffsetMin: 24, isConfirmed: false },
      { lat: 50.45, lng: 30.52, timeOffsetMin: 36, isConfirmed: false }
    ],
    estimatedArrivalMin: '21 хв (до вашого регіону)',
    targetDistricts: ['Бориспільський р-н', 'Обухівський р-н', 'м. Київ'],
    riskLevel: 'HIGH',
    confidence: 'CONFIRMED',
    status: 'TRACKING',
    detectedAt: '18:15:00',
    updatedAt: '18:34:21',
    source: 'Радіолокаційна мережа раннього виявлення #R4'
  },
  {
    id: 'THR-2026-0904-02',
    category: 'MISSILE',
    categoryLabel: 'Крилата ракета (Х-101 / Калібр)',
    speedKmh: 780,
    directionDeg: 280,
    directionLabel: 'Західний курс (над Кіровоградщиною у напрямку Вінниччини)',
    originRegion: 'Південний сектор',
    currentLat: 48.65,
    currentLng: 31.40,
    trajectory: [
      { lat: 48.65, lng: 31.40, timeOffsetMin: 0, isConfirmed: true },
      { lat: 48.95, lng: 29.80, timeOffsetMin: 8, isConfirmed: false },
      { lat: 49.20, lng: 28.45, timeOffsetMin: 16, isConfirmed: false }
    ],
    estimatedArrivalMin: '10–15 хв (Гайсинський / Вінницький р-н)',
    targetDistricts: ['Гайсинський р-н', 'Вінницький р-н'],
    riskLevel: 'CRITICAL',
    confidence: 'CONFIRMED',
    status: 'ACTIVE',
    detectedAt: '18:22:10',
    updatedAt: '18:34:10',
    source: 'Офіційний центр оповіщення ПС ЗСУ'
  },
  {
    id: 'THR-2026-0904-03',
    category: 'BALLISTIC',
    categoryLabel: 'Загроза балістичного озброєння',
    speedKmh: 2400,
    directionDeg: 340,
    directionLabel: 'Північно-Східний напрямок (Харківський сектор)',
    originRegion: 'Бєлгородський напрямок',
    currentLat: 50.2,
    currentLng: 36.3,
    trajectory: [
      { lat: 50.2, lng: 36.3, timeOffsetMin: 0, isConfirmed: true },
      { lat: 49.98, lng: 36.25, timeOffsetMin: 2, isConfirmed: true }
    ],
    estimatedArrivalMin: '3–5 хв',
    targetDistricts: ['м. Харків', 'Чугуївський р-н'],
    riskLevel: 'CRITICAL',
    confidence: 'CONFIRMED',
    status: 'ACTIVE',
    detectedAt: '18:31:00',
    updatedAt: '18:34:18',
    source: 'Супутникове та радіолокаційне виявлення'
  }
];

export const DEFAULT_SHELTERS: Shelter[] = [
  {
    id: 'sh-1',
    name: 'Станція метро «Золоті Ворота» (Глибоке закладення)',
    address: 'м. Київ, вул. Володимирська, 40а',
    type: 'SUBWAY',
    capacity: 2500,
    lat: 50.4485,
    lng: 30.5133,
    isOpen24h: true,
    hasPowerBackup: true,
    hasWater: true,
    distanceMeters: 340
  },
  {
    id: 'sh-2',
    name: 'Спеціалізоване укриття №1042 цивільного захисту',
    address: 'м. Київ, вул. Хрещатик, 15',
    type: 'BOMB_SHELTER',
    capacity: 450,
    lat: 50.4472,
    lng: 30.5228,
    isOpen24h: true,
    hasPowerBackup: true,
    hasWater: true,
    distanceMeters: 520
  },
  {
    id: 'sh-3',
    name: 'Підземний паркінг ТРЦ (-2 та -3 поверхи, автономний генератор)',
    address: 'м. Київ, Спортивна площа, 1а',
    type: 'PARKING',
    capacity: 1200,
    lat: 50.4384,
    lng: 30.5230,
    isOpen24h: true,
    hasPowerBackup: true,
    hasWater: true,
    distanceMeters: 800
  }
];
