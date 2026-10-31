# F11 · Измерение качества RU/KZ

- **Домен:** D09 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Аналитик запускает оценку классификатора и видит фактические ошибки и задержку.
- **Основание ТЗ:** 3.3.5, 3.2.2, 3.2.3, 4, 8.6. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Подтвердить экономию труда без ухудшения маршрутизации и безопасности.

## Поведение

Запуск оценки; отдельно точность сферы и тональности; RU/KZ support; ошибки; P95; сохранение протокола с именем engine.

## Инварианты

Нет фиктивных процентов: до запуска показано «не измерено». DEMO-результат не является доказательством качества LIVE.

## Реализация

Public API: [src/features/evaluate-quality/index.ts](../../src/features/evaluate-quality/index.ts).

[src/features/evaluate-quality/ui/evaluate-quality.tsx](../../src/features/evaluate-quality/ui/evaluate-quality.tsx); [src/pages/quality/index.ts](../../src/pages/quality/index.ts); [src/entities/quality/index.ts](../../src/entities/quality/index.ts)

Сервер и маршрут: [src/server/quality.ts](../../src/server/quality.ts); [src/server/ai.ts](../../src/server/ai.ts); [app/api/action/route.ts](../../app/api/action/route.ts).

## Проверка и границы

36 smoke-примеров. Независимая приёмочная выборка, confusion matrix и замеры реального LIVE / полной загрузки страницы ещё нужны.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
