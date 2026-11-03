# WHYP INC. — Chicago Taxi Demo

Монорепозиторий демо-приложения **WHYP INC.** для рынка Чикаго.

## Структура

```
├── backend/    # Go API (Gin/Fiber, WebSockets, PostgreSQL)
├── frontend/   # React Native (Expo Router, NativeWind)
└── PRD.md      # Consolidated backlog (PDF + эскизы)
```

## Тема оформления

По умолчанию — **светлая тема** (как Curb). Переключатель **Light / Dark**:
- Home — иконки солнце/луна в шапке
- Where To? — переключатель в Header

Выбор сохраняется в AsyncStorage.

## Google Maps

Подробная инструкция: [`docs/GOOGLE_MAPS.md`](../docs/GOOGLE_MAPS.md)

Кратко:
```bash
npx expo install react-native-maps expo-location
cp .env.example .env   # ключи Google Maps — см. комментарии в файле
# Native keys → app.config.js (из .env)
# Заменить MapContainer на GoogleMapView
```

## Backend

```bash
cd backend && go run ./cmd/api
```

## Frontend

```bash
cd frontend
npm install
npx expo start
```

> **Expo Go:** проект использует SDK 54. Убедитесь, что приложение Expo Go на телефоне обновлено до последней версии.

## Режимы

- **Passenger** — Home → Where To → Ride Selection → (Pretorian Order) → Matching
- **Auth** — mock login + card (`/(auth)/login`)
- **Payment** — mock Stripe / Apple Pay / Google Pay
- **Pretorian Order** — add-ons +$60, 1–3 cars, stops, $10 service fee
- **Ride Later** — отложенное бронирование
- **Driver** — placeholder (Phase 4)
