# Фичи и их реализация

Основание scope: [ТЗ 21.10.2026](../TZ/TZ_AI_assistant_akimat.docx) и [Business Vision](../BUSINESS_VISION.md). Каждая карточка отвечает: зачем существует, каким пунктом ТЗ обоснована, где реализована и что ещё не подтверждено.

Бизнес-домен группирует связанные правила и данные; FSD feature — конкретное действие пользователя. Автоматические этапы AI, дедупликации и кластеризации описаны в [BUSINESS_DOMAIN.md](../BUSINESS_DOMAIN.md) и выполняются сервером, поэтому отдельные фиктивные UI-feature для них не создаются.

| ID | Feature / карточка | Домен | Public API | Основание ТЗ |
|---|---|---|---|---|
| F01 | [Управление источниками и сбором](manage-sources.md) | D01 | [manage-sources](../../src/features/manage-sources/index.ts) | 3.1.1, 3.1.2, 3.1.4, 3.6, 4, 8.1 |
| F02 | [Импорт и первичная обработка обращений](ingest-feedback.md) | D02 | [ingest-feedback](../../src/features/ingest-feedback/index.ts) | 3.1.3–3.1.6, 3.2.1–3.2.4, 3.3.1–3.3.4, 3.4.2, 3.7.3, 3.7.7, 8.1, 8.2, 8.4, 8.8, 8.9 |
| F03 | [Сквозные фильтры и сохранённая выборка](filter-feedback.md) | D06 | [filter-feedback](../../src/features/filter-feedback/index.ts) | 3.4.1, 3.5.2, 3.8.1, 3.8.4, 8.3, 8.5 |
| F04 | [Подтверждение и исправление классификации](review-classification.md) | D03 | [review-classification](../../src/features/review-classification/index.ts) | 3.2.2, 3.2.3, 3.2.5, 3.3.1, 3.3.5, 4, 5.4, 8.2, 8.6 |
| F05 | [Назначение ответственного и контроль статуса](assign-issue.md) | D05 | [assign-issue](../../src/features/assign-issue/index.ts) | 3.2.5, 3.4.3, 3.4.4, 3.5.3, 3.8.2, 3.8.3, 5.4, 8.4 |
| F06 | [Экспорт текущей выборки](export-report.md) | D06 | [export-report](../../src/features/export-report/index.ts) | 3.5.6, 3.8.4–3.8.6, 8.5 |
| F07 | [Вход, роли и разделение DEMO/LIVE](workspace-access.md) | D07 | [workspace-access](../../src/features/workspace-access/index.ts) | 3.6, 3.7.4, 3.8.6, 4, 5.1, 5.3, 8.7, 8.8 |
| F08 | [Разрешённый просмотр Direct demo](read-private-feedback.md) | D07 | [read-private-feedback](../../src/features/read-private-feedback/index.ts) | 3.7.3, 3.7.4, 3.7.6, 3.7.7, 3.8.6, 5.3, 8.8 |
| F09 | [Удаление записи по запросу](delete-feedback.md) | D07 | [delete-feedback](../../src/features/delete-feedback/index.ts) | 5.6, 3.6, 8.7 |
| F10 | [Настройка тематик и ответственных](manage-departments.md) | D08 | [manage-departments](../../src/features/manage-departments/index.ts) | 3.2.1, 3.2.5, 3.6, 7, 8.2 |
| F11 | [Измерение качества RU/KZ](evaluate-quality.md) | D09 | [evaluate-quality](../../src/features/evaluate-quality/index.ts) | 3.3.5, 3.2.2, 3.2.3, 4, 8.6 |
| F12 | [Поисковая сводка по обращениям](search-feedback.md) | D10 | [search-feedback](../../src/features/search-feedback/index.ts) | 3.5.5, 6.1, 5.3, 5.4 |

Три дашборда: [обзор](../../src/pages/overview/index.ts), [подразделения](../../src/pages/departments/index.ts), [проблемы](../../src/pages/issues/index.ts). Они композируют widgets/features; расчётная модель находится в [analytics-charts](../../src/widgets/analytics-charts/index.ts). Основание: ТЗ 3.5.1, 3.5.3, 3.5.4, 3.8.2, 3.8.7, критерий 8.5.

Машиночитаемое соответствие: [manifest.json](manifest.json). `npm run check:docs` проверяет полноту карточек для каждого `src/features/*`, существование файлов реализации и относительных ссылок. Добавление/удаление slice требует обновить карточку, manifest и roadmap.

Архитектура: [ARCHITECTURE.md](../ARCHITECTURE.md). Порядок реализации: [ROADMAP.md](../ROADMAP.md).
