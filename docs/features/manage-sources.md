# F01 · Управление источниками и сбором

- **Домен:** D01 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Оператор получает сообщения из разрешённых городских источников по запросу и расписанию.
- **Основание ТЗ:** 3.1.1, 3.1.2, 3.1.4, 3.6, 4, 8.1. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Единое наблюдение за разрозненными публичными сигналами — первый шаг раннего обнаружения.

## Поведение

JSON/RSS адаптеры; три конфигурируемых канала; запуск сбора; включение/пауза; статистика и ошибки. Расписание запускает отдельный worker.

## Инварианты

URL и разрешение задаются сервером; импорт не означает успешное подключение. Отключённые/неразрешённые источники не собираются.

## Реализация

Public API: [src/features/manage-sources/index.ts](../../src/features/manage-sources/index.ts).

[src/features/manage-sources/ui/manage-sources.tsx](../../src/features/manage-sources/ui/manage-sources.tsx); [src/pages/sources/index.ts](../../src/pages/sources/index.ts); [src/entities/source/index.ts](../../src/entities/source/index.ts)

Сервер и маршрут: [src/server/connectors.ts](../../src/server/connectors.ts); [scripts/worker.ts](../../scripts/worker.ts); [app/api/action/route.ts](../../app/api/action/route.ts).

## Проверка и границы

Механизм реализован; три реальных разрешённых подключения и часовой сбор в LIVE ещё не подтверждены.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
