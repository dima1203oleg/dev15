# CURRENT ARCHITECTURE AUDIT — SIREN UA ECOSYSTEM 2026

## 1. Executive Summary & Repositories Overview
This audit establishes the baseline for the only repository available in this workspace:
- **`dima1203oleg/Dev15`** (current write target):
  React 19 + TypeScript + Vite + Express prototype with explicit demo/not-connected boundaries, spatial UI shells and typed financial domain primitives.

The previously referenced `atlastrinity/SirenUA-Website`, `atlastrinity/SirenUA` and
`atlastrinity/SirenUA-ThreatServer` repositories were checked from the available GitHub
URLs and returned `Repository not found`. Their code and integrations therefore remain
unverified and cannot be claimed as part of this audit.

## 2. Technology Stack & Runtime Profile
- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4, Motion (v12), Lucide Icons.
- **Backend/BFF**: Node.js ES2022 / Express 4.21 with TypeScript runtime (`tsx`) and bundled CJS production output (`esbuild`).
- **Data Engine**: Double-Entry Immutable Ledger in minor currency units (cents/kopecks) with strict zero-sum projection to Wallets.
- **Security boundary**: no production identity, JWT/session authorization or webhook provider integration is present in this checkout. Cap validation and idempotency primitives exist; auth/RBAC/HMAC enforcement remain integration work.

## 3. Product Mission & Positioning
- **Core Doctrine**: *"Не просто дізнатися про тривогу. Зрозуміти ситуацію."*
- Not a replacement for official state alarms, but a high-precision situational intelligence layer displaying:
  - Vector direction and forecast trajectory
  - Estimated Time of Arrival (ETA intervals: 10–15 min)
  - District risk levels (Normal, Elevated, High, Critical)
  - Shelter database
  - Data freshness & confidence markers (CONFIRMED, ESTIMATED, PREDICTED, UNVERIFIED, UNKNOWN).
