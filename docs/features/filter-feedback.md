# F03 · Сквозные фильтры и сохранённая выборка

- **Домен:** D06 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Сотрудник выбирает период, сферу, проблему и другие признаки; все экраны показывают ту же выборку.
- **Основание ТЗ:** 3.4.1, 3.5.2, 3.8.1, 3.8.4, 8.3, 8.5. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Дать руководителю и оператору единую картину без повторного ручного отбора.

## Поведение

Один предикат filterItems для UI и экспорта; общие поля; URL; сохранение/восстановление набора в браузере. Сортировка, группировка и пагинация ленты находятся в widget.

## Инварианты

Фильтр не расширяет серверную область доступа; поиск не раскрывает приватный текст. Экспорт использует текущие параметры.

## Реализация

Public API: [src/features/filter-feedback/index.ts](../../src/features/filter-feedback/index.ts).

[src/features/filter-feedback/client.ts](../../src/features/filter-feedback/client.ts); [src/features/filter-feedback/model/filter-items.ts](../../src/features/filter-feedback/model/filter-items.ts); [src/features/filter-feedback/model/types.ts](../../src/features/filter-feedback/model/types.ts); [src/widgets/feedback-feed/index.ts](../../src/widgets/feedback-feed/index.ts)

Сервер и маршрут: [app/api/export/route.ts](../../app/api/export/route.ts); [src/server/domain.ts](../../src/server/domain.ts).

## Проверка и границы

Реализовано и проверено для DEMO. Сохранённые фильтры локальны браузеру.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
