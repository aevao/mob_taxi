# Подключение Google Maps

Инструкция для интеграции **Google Maps** в WHYP Taxi (Expo SDK 54 + React Native).

> Сейчас в demo используется `MapContainer` — статичная заглушка.  
> После подключения Google Maps она заменяется на `react-native-maps` + Directions API.

---

## 1. Google Cloud Console

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект (например `whyp-taxi-chicago`)
3. Включите API:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Places API** — автокомплит на экране Where to?
   - **Geocoding API** — координаты по адресу
   - **Directions API** — маршрут на карте (Ride Selection / Matching)
   - **Distance Matrix API** — опционально, тариф с учётом трафика
4. **APIs & Services → Credentials → Create Credentials → API key** — нужно **3 ключа**:

| Ключ | `.env` | Application restriction | API restriction |
|------|--------|-------------------------|-----------------|
| REST (поиск + маршруты) | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | **None** | Places, Geocoding, Directions |
| Native iOS (карта) | `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY` | iOS apps → `com.whypinc.passenger` | Maps SDK for iOS |
| Native Android (карта) | `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` | Android apps → package + SHA-1 | Maps SDK for Android |

> **Частая ошибка `REQUEST_DENIED`:** один iOS-ключ во все три поля. REST-запросы (Places autocomplete) идут по HTTP с IP телефона — ключ с restriction «iOS apps» их блокирует.

---

## 2. Установка пакетов

```bash
cd frontend
npx expo install react-native-maps
npx expo install expo-location
```

Для autocomplete (опционально):

```bash
npm install react-native-google-places-autocomplete
```

---

## 3. Переменные окружения

Скопируйте шаблон и заполните ключи:

```bash
cd frontend
cp .env.example .env
# отредактируйте .env — подробные комментарии внутри файла
```

Переменные:

| Переменная | Куда в GCP | Куда ещё |
|------------|------------|----------|
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Places, Geocoding (JS) | только `.env` |
| `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY` | iOS apps → `com.whypinc.passenger` | `.env` → `app.config.js` подставляет в native iOS |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` | Android apps → package + SHA-1 | `.env` → `app.config.js` подставляет в native Android |

Ключи **не хранятся в `app.json`** — только в `.env`. Файл `app.config.js` читает их при `prebuild`.

Файл `.env` уже в `.gitignore` — в репозиторий не попадёт.

---

## 4. Native config (`app.config.js`)

Ключи iOS/Android подставляются из `.env` автоматически через `frontend/app.config.js`.
Руками в `app.json` ничего добавлять не нужно.

После изменения `.env` или native config:

```bash
npx expo prebuild --clean
```

Для **Expo Go** карты Google работают ограниченно — для полного функционала нужен **development build**:

```bash
npx expo run:ios
npx expo run:android
```

---

## 5. Компонент карты (замена mock)

Создайте `frontend/components/GoogleMapView.tsx`:

```tsx
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { CHICAGO_CENTER } from "@/constants/chicago";
import type { Location } from "@/constants/mockData";

interface Props {
  pickup?: Location | null;
  dropoff?: Location | null;
  routeCoordinates?: { latitude: number; longitude: number }[];
  height?: number;
}

export function GoogleMapView({ pickup, dropoff, routeCoordinates, height = 240 }: Props) {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={{ width: "100%", height }}
      initialRegion={{
        latitude: pickup?.latitude ?? CHICAGO_CENTER.latitude,
        longitude: pickup?.longitude ?? CHICAGO_CENTER.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }}
    >
      {pickup && (
        <Marker
          coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
          pinColor="green"
          title="Pickup"
        />
      )}
      {dropoff && (
        <Marker
          coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
          pinColor="violet"
          title="Dropoff"
        />
      )}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline coordinates={routeCoordinates} strokeColor="#059669" strokeWidth={4} />
      )}
    </MapView>
  );
}
```

---

## 6. Directions API (backend или frontend)

**Рекомендация:** вызывать Directions с **Go backend**, чтобы не светить ключ в клиенте.

```go
// GET /api/v1/routes?origin=lat,lng&destination=lat,lng
// → distance, duration, polyline, traffic-adjusted duration
```

URL Google:

```
https://maps.googleapis.com/maps/api/directions/json
  ?origin=41.952,-87.694
  &destination=41.9742,-87.9073
  &departure_time=now
  &traffic_model=best_guess
  &key=SERVER_KEY
```

Ответ используйте для:
- отрисовки `Polyline` (decode polyline)
- расчёта тарифа `$/hour` и `$/mile` (ТЗ PDF)
- ETA на экране Ride Selection

---

## 7. Где подключить в проекте

| Экран | Файл | Действие |
|-------|------|----------|
| Ride Selection | `app/(app)/ride-selection.tsx` | заменить `MapContainer` → `GoogleMapView` |
| Matching | `app/(app)/matching.tsx` | live tracking marker |
| Where To? | `app/(app)/where-to.tsx` | Places autocomplete |
| Pick pin | `where-to.tsx` | `MapView` + `onPress` для координат |

---

## 8. Стоимость и лимиты

- Google даёт **$200/month credit** на Maps Platform
- Directions: ~$5 / 1000 запросов
- Для demo включите **billing alerts** в GCP

---

## 9. Чеклист перед production

- [ ] Отдельные ключи iOS / Android / Server
- [ ] Directions через backend, не из mobile key
- [ ] Ограничения API key по bundle/package
- [ ] Fallback на mock-карту если API недоступен
- [ ] Тест на реальном устройстве (не только Expo Go)

---

## 10. Полезные ссылки

- [Expo Maps](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Google Directions API](https://developers.google.com/maps/documentation/directions)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
