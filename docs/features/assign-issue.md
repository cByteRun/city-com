# F05 · Назначение ответственного и контроль статуса

- **Домен:** D05 — [связь доменов](../BUSINESS_DOMAIN.md).
- **Зачем:** Сотрудник проверяет проблему, подтверждает подразделение и ведёт её до решения.
- **Основание ТЗ:** 3.2.5, 3.4.3, 3.4.4, 3.5.3, 3.8.2, 3.8.3, 5.4, 8.4. Номера `8.n` обозначают n-й критерий раздела 8; в DOCX они перечислены без отдельных заголовков.
- **Business Vision:** Сократить время от публичного сигнала до подтверждённой передачи — North Star из Business Vision.

## Поведение

Форма назначения; пять последовательных статусов; отметки времени передачи/решения; изменения отражаются в ленте и аналитике.

## Инварианты

ИИ рекомендует; назначение подтверждает человек. API проверяет допустимый переход, роль и сферу; действие попадает в аудит.

## Реализация

Public API: [src/features/assign-issue/index.ts](../../src/features/assign-issue/index.ts).

[src/features/assign-issue/ui/assign-issue.tsx](../../src/features/assign-issue/ui/assign-issue.tsx); [src/pages/issues/index.ts](../../src/pages/issues/index.ts); [src/entities/issue/index.ts](../../src/entities/issue/index.ts)

Сервер и маршрут: [app/api/action/route.ts](../../app/api/action/route.ts); [src/server/auth.ts](../../src/server/auth.ts); [src/server/store.ts](../../src/server/store.ts).

## Проверка и границы

Реализовано и проверено в DEMO. Передача — внутреннее состояние; интеграция с 109/eOtinish не выполнена.

Регрессия: [ядро](../../tests/domain.test.ts), [API-контракты](../../tests/api.test.ts), [браузерный E2E](../../tests/browser/p0.spec.ts). Точный статус приёмки — в [матрице P0](../P0_ACCEPTANCE.md); незавершённые работы — в [roadmap](../ROADMAP.md).
