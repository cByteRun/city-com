# F07 · Вход, роли и разделение DEMO/LIVE

- **Домен:** D07 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Пользователь входит в рабочее пространство с доступом в рамках своей роли.
- **Основание ТЗ:** 3.6, 3.7.4, 3.8.6, 4, 5.1, 5.3, 8.7, 8.8. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Обеспечить безопасную проверяемую работу оператора, подразделения и руководства.

## Поведение

Четыре роли; серверная подписанная сессия; пароли LIVE из окружения; ограничение сферы; физически отдельные записи пространств в хранилище.

## Инварианты

Смена роли в DEMO затрагивает синтетический набор. LIVE требует отдельного пароля. Скрытие кнопки дополняется проверкой API.

## Реализация

Public API: [src/features/workspace-access/index.ts](../../src/features/workspace-access/index.ts).

[src/features/workspace-access/ui/workspace-access.tsx](../../src/features/workspace-access/ui/workspace-access.tsx); [src/features/workspace-access/api/session.ts](../../src/features/workspace-access/api/session.ts); [src/entities/session/index.ts](../../src/entities/session/index.ts); [src/entities/workspace/index.ts](../../src/entities/workspace/index.ts)

Сервер и маршрут: [app/api/session/route.ts](../../app/api/session/route.ts); [src/server/auth.ts](../../src/server/auth.ts); [src/server/domain.ts](../../src/server/domain.ts); [src/server/store.ts](../../src/server/store.ts).

## Проверка и границы

Прототип реализован и проверен. Общие пароли ролей не заменяют управление персональными пользователями и промышленную аутентификацию. DEMO/LIVE — средство воспроизводимой проверки, а не отдельный критерий ТЗ.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
