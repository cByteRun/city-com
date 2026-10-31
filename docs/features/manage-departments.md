# F10 · Настройка тематик и ответственных

- **Домен:** D08 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Администратор уточняет темы подразделения и ответственную должность для маршрутизации.
- **Основание ТЗ:** 3.2.1, 3.2.5, 3.6, 7, 8.2. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Согласовать AI triage с реальными сферами ответственности акимата.

## Поведение

Редактирование тематик и ответственного; аудит; темы входят в последующий LIVE prompt. Базовые сферы сохранены для сопоставимости.

## Инварианты

Изменять справочник может администратор. Тематические подсказки передаются модели как данные.

## Реализация

Public API: [src/features/manage-departments/index.ts](../../src/features/manage-departments/index.ts).

[src/features/manage-departments/ui/manage-departments.tsx](../../src/features/manage-departments/ui/manage-departments.tsx); [src/pages/administration/index.ts](../../src/pages/administration/index.ts); [src/entities/department/index.ts](../../src/entities/department/index.ts)

Сервер и маршрут: [app/api/action/route.ts](../../app/api/action/route.ts); [src/server/ai.ts](../../src/server/ai.ts); [src/server/store.ts](../../src/server/store.ts).

## Проверка и границы

Темы/ответственные редактируются. Полный CRUD сфер и управление отдельными пользовательскими аккаунтами пока не реализованы.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
