# F08 · Разрешённый просмотр Direct demo

- **Домен:** D07 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Уполномоченный оператор открывает обезличенный текст адресованного акимату сообщения.
- **Основание ТЗ:** 3.7.3, 3.7.4, 3.7.6, 3.7.7, 3.8.6, 5.3, 8.8. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Сохранить единый triage-процесс для Direct без утечки приватного текста в общую аналитику.

## Поведение

Отдельный запрос по записи; проверка admin/analyst; маскированный текст; журнал каждого открытия; общая аналитика получает только агрегаты.

## Инварианты

viewer и department не получают текст. Реальные Direct в LIVE P0 отклоняются. Доступ к переписке жителей между собой исключён.

## Реализация

Public API: [src/features/read-private-feedback/index.ts](../../src/features/read-private-feedback/index.ts).

[src/features/read-private-feedback/ui/read-private-feedback.tsx](../../src/features/read-private-feedback/ui/read-private-feedback.tsx); [src/widgets/feedback-details/index.ts](../../src/widgets/feedback-details/index.ts)

Сервер и маршрут: [app/api/action/route.ts](../../app/api/action/route.ts); [src/server/domain.ts](../../src/server/domain.ts); [src/server/auth.ts](../../src/server/auth.ts).

## Проверка и границы

Проверен синтетический Direct. OAuth, настоящий официальный webhook, шифрование и короткое хранение реального Direct остаются до его подключения.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
