# Frontend: Feature-Sliced Design

Слои определяют направление зависимостей; бизнес-назначение slice фиксируется в [карточках фич](features/README.md). Основание модульности — ТЗ 6.1, расширяемости — раздел 4. Конкретная FSD-структура является инженерным решением по запросу заказчика; ТЗ не предписывает названия папок.

```text
app/                       Next.js App Router: route/layout/API adapters
pages/README.md            техническая граница для Next.js, без маршрутов
src/
  app/                     инициализация, навигация, состояние и композиция
    config/                названия экранов и пункты меню
    model/                 useCitycomWorkspace: сессия, загрузка, URL, команды
    ui/                    CityApp: соединение экранов, shell и сценариев
    styles/                общие стили приложения
  pages/                   композиция конкретных экранов
    overview/ departments/ issues/ feed/ processing/ moderation/
    sources/ quality/ administration/ assistant/
  widgets/                 законченные блоки интерфейса
    application-shell/     навигация, topbar, адаптивное меню
    analytics-charts/      графики и единый расчёт метрик
    feedback-feed/         таблица, сортировка, группировка, пагинация
    issue-table/           реестр проблем и drill-down
    feedback-details/      детали + формы review/assign/private/delete
  features/                пользовательские действия; один slice на сценарий
  entities/                модели предметной области и чистые правила
    feedback/ issue/ source/ department/ session/ workspace/ audit/ quality/
  shared/                  UI kit, форматирование, HTTP transport
  server/                  серверный конвейер; вне frontend FSD
```

Корневой `app/` — runtime Next.js. `src/app` — верхний слой FSD, `src/pages` — слой экранов. Пустой корневой `pages/` предотвращает обнаружение `src/pages` как второго Pages Router. Публичные URL и `?view=...` сохранены; доменные папки не создают технических URL.

## Правила зависимостей

1. Разрешённое направление: `app → pages → widgets → features → entities → shared`; любой верхний слой может пропускать промежуточные.
2. Slice не импортирует другой slice своего слоя. Бизнес-действия связывает page/widget/app, не соседняя feature.
3. Внешний импорт — через `index.ts`. `features/filter-feedback/client.ts` — отдельный публичный клиентский вход; `index.ts` экспортирует чистую модель, используемую серверным экспортом.
4. Внутри slice импорты ведут прямо в собственные сегменты, без повторного входа через свой public barrel. Используются сегменты `ui`, `model`, `api`. Новый сегмент создаётся при наличии реального кода, без пустых заготовок.
5. `entities/workspace` агрегирует DTO состояния. Связи типов сущностей объявлены через узкие type-only `@x/<consumer>.ts`; например, `feedback/@x/issue` отдаёт `Item` только модели приоритета. Runtime-импорты между entity-slices запрещены.
6. Frontend не импортирует `src/server`, Node API, Gemini SDK или PDFKit. Сервер применяет авторизацию, область данных и валидацию независимо от UI.
7. `shared` содержит универсальные контракты `Action/Notify`, HTTP transport и UI; бизнес-сущности принадлежат `entities`, фильтры — `features/filter-feedback`.

Автоматическая проверка: `npm run check:architecture`. Она проверяет направление импортов, изоляцию slices, публичные входы, существование `index.ts`, запрет собственного barrel-импорта, type-only `@x` и границу сервера. Анализируются и динамические импорты. Для полного контроля поведение проверяется TypeScript и E2E, а не только структурой каталогов.

## Владение правилами и данными

| Ответственность | Единственный владелец |
|---|---|
| Типы Item, Analysis, Sentiment | [feedback](../src/entities/feedback/index.ts) |
| Cluster, Status и формула приоритета | [issue](../src/entities/issue/index.ts) |
| Source, Department, User/Role | [source](../src/entities/source/index.ts), [department](../src/entities/department/index.ts), [session](../src/entities/session/index.ts) |
| Агрегат State и Workspace | [workspace](../src/entities/workspace/index.ts) |
| Общий предикат фильтрации | [filter-feedback](../src/features/filter-feedback/index.ts) |
| Метрики для трёх дашбордов | [derive-city-analytics](../src/widgets/analytics-charts/model/derive-city-analytics.ts) |
| Маскирование, fingerprint, кластеризация, server scope | [server/domain.ts](../src/server/domain.ts) |
| Авторизация и сессия на сервере | [server/auth.ts](../src/server/auth.ts) |
| Сбор и ingest | [server/connectors.ts](../src/server/connectors.ts), [worker](../scripts/worker.ts) |
| LLM и протокол оценки | [server/ai.ts](../src/server/ai.ts), [server/quality.ts](../src/server/quality.ts) |
| Хранение и аудит | [server/store.ts](../src/server/store.ts) |

`src/server/types.ts` — совместимый серверный фасад канонических entity-типов, без второй модели данных. Приоритет и фильтр используются сервером и браузером из одного чистого определения. Фича получает команду `Action` от композиции приложения, хранит собственное состояние формы и не управляет соседними фичами.

## Документация при изменениях

Изменение правила: обновить его владельца, соответствующую [карточку](features/README.md), [доменную связь](BUSINESS_DOMAIN.md) и чекбокс [roadmap](ROADMAP.md). Изменение статуса приёмки подтверждается проверкой в [P0_ACCEPTANCE.md](P0_ACCEPTANCE.md). `manifest.json` и `check:docs` обнаруживают потерянные/лишние карточки и битые ссылки на код.

FSD-правила сверены с [официальными правилами slices и public API](https://feature-sliced.design/docs/concepts/low-coupling) и [интеграцией Next.js](https://feature-sliced.design/kr/blog/nextjs-app-router-guide). Это источник инженерных правил; продуктовые требования остаются в ТЗ и Business Vision.
