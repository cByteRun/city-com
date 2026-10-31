# F02 · Импорт и первичная обработка обращений

- **Домен:** D02 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Сотрудник загружает обращение или выгрузку и получает структурированный результат анализа.
- **Основание ТЗ:** 3.1.3–3.1.6, 3.2.1–3.2.4, 3.3.1–3.3.4, 3.4.2, 3.7.3, 3.7.7, 8.1, 8.2, 8.4, 8.8, 8.9. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Сократить ручной поиск и сортировку, сохранив проверяемую цепочку от сообщения к проблеме.

## Поведение

Форма текста и CSV/XLSX; согласование режима данных; общий серверный ingest: маскирование → анализ RU/KZ → дедупликация → кластер.

## Инварианты

Сохраняются источник и дата; одинаковый нормализованный текст не добавляет жалобу. В LIVE нет подмены Gemini локальным DEMO-классификатором.

## Реализация

Public API: [src/features/ingest-feedback/index.ts](../../src/features/ingest-feedback/index.ts).

[src/features/ingest-feedback/ui/ingest-feedback.tsx](../../src/features/ingest-feedback/ui/ingest-feedback.tsx); [src/pages/processing/index.ts](../../src/pages/processing/index.ts); [src/entities/feedback/index.ts](../../src/entities/feedback/index.ts)

Сервер и маршрут: [src/server/connectors.ts](../../src/server/connectors.ts); [src/server/ai.ts](../../src/server/ai.ts); [src/server/domain.ts](../../src/server/domain.ts); [app/api/action/route.ts](../../app/api/action/route.ts).

## Проверка и границы

DEMO и CSV проверены; XLSX реализован. Настоящий LIVE и демонстрация на реальных данных требуют конфигурации. Ограничение MVP: 30 строк / 2 МБ.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
