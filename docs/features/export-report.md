# F06 · Экспорт текущей выборки

- **Домен:** D06 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Сотрудник выгружает данные выбранного периода и сферы для управленческого решения.
- **Основание ТЗ:** 3.5.6, 3.8.4–3.8.6, 8.5. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Передать подтверждаемую картину проблем руководству и профильной службе.

## Поведение

CSV; XLSX с листом сводки; PDF с кириллицей; текущие фильтры передаются в защищённый endpoint.

## Инварианты

Права применяются до экспорта. Исходные тексты Direct исключены; PDF/XLSX содержат только их агрегированное количество. CSV защищён от формул.

## Реализация

Public API: [src/features/export-report/index.ts](../../src/features/export-report/index.ts).

[src/features/export-report/ui/export-report.tsx](../../src/features/export-report/ui/export-report.tsx)

Сервер и маршрут: [app/api/export/route.ts](../../app/api/export/route.ts); [src/server/pdf.ts](../../src/server/pdf.ts); [src/server/domain.ts](../../src/server/domain.ts).

## Проверка и границы

Три формата проверены браузером как реальные файлы. Полноценный экспорт графических дашбордов и автоматические отчёты ещё не реализованы.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
