# CURRENT ARCHITECTURE AUDIT — SIREN UA ECOSYSTEM 2026

## 1. Executive Summary & Repositories Overview
This audit establishes the baseline across the three core repositories of the Atlas Trinity ecosystem:
- **`atlastrinity/SirenUA-Website`** (Primary Write-Target & Central Web Platform):
  Modernized React 19 + TypeScript + Vite + Express BFF with immutable ledger, referral engine, and threat visualization.
- **`atlastrinity/SirenUA`** (Read-Only Mobile Application Context):
  Native/cross-platform client handling push notifications, localized background location geofencing, district risk cache, deep links (`sirenua://ref/{code}`).
- **`atlastrinity/SirenUA-ThreatServer`** (Read-Only Authoritative Threat Context):
  Authoritative threat event pipeline processing raw radar telemetry, regional sirens, trajectory vectors, ETA calculations, and district risk states.

## 2. Technology Stack & Runtime Profile
- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4, Motion (v12), Lucide Icons.
- **Backend/BFF**: Node.js ES2022 / Express 4.21 with TypeScript runtime (`tsx`) and bundled CJS production output (`esbuild`).
- **Data Engine**: Double-Entry Immutable Ledger in minor currency units (cents/kopecks) with strict zero-sum projection to Wallets.
- **Security**: JWT & Session authentication, HMAC webhook validation, Role-Based Access Control (13 distinct roles), Cap validation engine.

## 3. Product Mission & Positioning
- **Core Doctrine**: *"Не просто дізнатися про тривогу. Зрозуміти ситуацію."*
- Not a replacement for official state alarms, but a high-precision situational intelligence layer displaying:
  - Vector direction and forecast trajectory
  - Estimated Time of Arrival (ETA intervals: 10–15 min)
  - District risk levels (Normal, Elevated, High, Critical)
  - Shelter database
  - Data freshness & confidence markers (CONFIRMED, ESTIMATED, PREDICTED, UNVERIFIED, UNKNOWN).
