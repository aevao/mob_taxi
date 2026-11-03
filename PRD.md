# WHYP INC. — Consolidated PRD

> Единый backlog: PDF ТЗ + эскизы заказчика + референс Curb  
> Рынок: **Chicago, IL** | Стек: **Expo RN + Go + PostgreSQL**

---

## 1. Продукт

| Параметр | Значение |
|----------|----------|
| Бренд | **WHYP INC.** (My WHYP) |
| Сервисы | **Black Service** (premium) / **Public Service** |
| Роли | Passenger / Driver |
| Референс UX | Curb (home, QR, bottom sheet) |

---

## 2. Парк автомобилей

| Модель | Вместимость | Black | Public |
|--------|-------------|-------|--------|
| My WHYP Pretorian Sedan | 1–3 | ✅ | ✅ |
| My WHYP Pretorian SUV | 1–6 | ✅ | ✅ |
| My WHYP Personal Van | 1–7 | ✅ | ✅ |
| My WHYP Personal SUV | 1–7 | ✅ | ❌ |

---

## 3. Backlog по фазам

### ✅ Phase 1 — Demo UI

- [x] WHYP rebrand, Black/Public, 4 vehicles, Home, bottom sheet

### ✅ Phase 2 — MVP Mobile (частично)

- [x] P2-01 Auth mock (login + card at signup)
- [x] P2-02 Payment mock (card, Apple/Google Pay)
- [x] P2-03 Commission $10 в расчёте заказа
- [x] P2-04 Pretorian Order (time, stops, add-ons +$60, 1–3 cars)
- [x] P2-05 Ride Later (schedule picker)
- [ ] P2-06 Push «водитель прибыл» 
- [ ] P2-07 Google Maps / Mapbox

### 🔴 Phase 3 — Backend + Real-time

| ID | Задача | Источник |
|----|--------|----------|
| P3-01 | Go API: auth, orders, vehicles | PDF #2 (БД) |
| P3-02 | PostgreSQL schema | PDF #2 |
| P3-03 | WebSocket: GPS tracking, live route | PDF #11 |
| P3-04 | Таймер поездки с подачи | PDF #5 |
| P3-05 | Auto-complete по geofence | PDF #6 |
| P3-06 | Смена destination mid-ride | PDF #7 |
| P3-07 | SMS водителю (лимит 3–5) | PDF #13 |
| P3-08 | Тариф $/час + traffic API | PDF #2, #3 |

### 🟣 Phase 4 — Driver + Admin

| ID | Задача | Источник |
|----|--------|----------|
| P4-01 | Driver Account: Selfie + Invitation | Эскиз |
| P4-02 | KYC водитель + клиент | PDF #17, #18 |
| P4-03 | Admin panel | PDF #16 |
| P4-04 | Web stats portal для водителей | PDF #19 |
| P4-05 | Fleet management (10+ cars, 2 types) | Roadmap эскиз |

---

## 4. PDF ТЗ — статус покрытия

| # | Требование | Phase 1 | Target |
|---|------------|---------|--------|
| 1 | Авторизация | ❌ | P2 |
| 2 | $/час | 🟡 mock estimate | P3 |
| 3 | Google Maps traffic | ❌ | P2/P3 |
| 4 | Маршрут A→B | 🟡 mock map | P2 |
| 5 | Таймер подачи | ❌ | P3 |
| 6 | Auto-finish | ❌ | P3 |
| 7 | Смена destination | ❌ | P3 |
| 8 | Эл.кошельки | ❌ | P2 |
| 9 | Карта при auth | ❌ | P2 |
| 10 | Комиссия $10 | ❌ | P2 |
| 11 | Live tracking | ❌ | P3 |
| 12 | Выбор авто | ✅ | — |
| 13 | SMS 3–5 | ❌ | P3 |
| 14 | Push приезда | ❌ | P2 |
| 15 | Отмена | 🟡 partial | P2 |
| 16 | Admin | ❌ | P4 |
| 17–18 | KYC | ❌ | P4 |
| 19 | Web stats | ❌ | P4 |
| 20 | *(пусто)* | — | уточнить у заказчика |

---

## 5. Открытые вопросы заказчику

1. **Комиссия $10** — за поездку, месяц или регистрацию?
2. **Тариф** — приоритет $/час (PDF) или $/mile (Curb)?
3. **Пункт 20** PDF — что планировалось?
4. **Google Maps** — бюджет на API?
5. **SMS** — 3 или 5 на поездку?

---

## 6. Навигация приложения

```
Home → Ride Now → Where To? → Ride Selection
  ├─ Request (Pretorian) → Pretorian Order → Matching
  ├─ Request (other)     → Matching
  └─ Ride Later → schedule → Where To? / back

Auth: login / add-payment (mock Stripe)
```

---

## 7. Mock-константы

- `CLIENT_COMMISSION_USD = 10` — зарезервировано для Phase 2
- `BLACK_SERVICE_MULTIPLIER = 1.45` — наценка Black vs Public
- Default pickup: **3102 West Grace Street** (из референса Curb)
