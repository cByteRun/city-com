# F04 · Подтверждение и исправление классификации

- **Домен:** D03 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Оператор проверяет неоднозначную классификацию, корректирует сферу и тональность, указывает основание.
- **Основание ТЗ:** 3.2.2, 3.2.3, 3.2.5, 3.3.1, 3.3.5, 4, 5.4, 8.2, 8.6. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Human-in-the-Loop снижает риск ошибочной маршрутизации при автоматизации сортировки.

## Поведение

Очередь при уверенности ниже 0,6; форма проверки; обоснование; сохранение reviewed и журнал действия.

## Инварианты

Самооценка модели не является вероятностью. Право исправления проверяет API; сотрудник подразделения ограничен своей сферой.

## Реализация

Public API: [src/features/review-classification/index.ts](../../src/features/review-classification/index.ts).

[src/features/review-classification/ui/review-classification.tsx](../../src/features/review-classification/ui/review-classification.tsx); [src/pages/moderation/index.ts](../../src/pages/moderation/index.ts); [src/widgets/feedback-details/index.ts](../../src/widgets/feedback-details/index.ts)

Сервер и маршрут: [app/api/action/route.ts](../../app/api/action/route.ts); [src/server/auth.ts](../../src/server/auth.ts); [src/server/store.ts](../../src/server/store.ts).

## Проверка и границы

Исправления сохраняются. Автоматическое дообучение по ним не реализовано и не заявляется.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
