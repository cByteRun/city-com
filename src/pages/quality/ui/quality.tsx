"use client";
import { EvaluateQuality } from "@/features/evaluate-quality";
import { Activity, TriangleAlert, Check } from "lucide-react";
import { Badge, Panel, Empty } from "@/shared/ui";
import { type State } from "@/entities/workspace";
import { type Action } from "@/shared/api";
import { date } from "@/shared/lib/format";
export function QualityView({
  state,
  busy,
  canEdit,
  action,
  loadMs,
}: {
  state: State;
  busy: boolean;
  canEdit: boolean;
  action: Action;
  loadMs: number | null;
}) {
  const q = state.quality;
  return (
    <>
      <div className="quality-banner">
        <div>
          <Activity size={22} />
          <div>
            <h3>Качество должно быть измерено</h3>
            <p>
              Размеченная RU/KZ smoke-выборка · 36 примеров. Не заменяет
              независимую приёмочную выборку.
            </p>
          </div>
        </div>
        <EvaluateQuality busy={busy} canEdit={canEdit} action={action} />
      </div>
      <div className="quality-grid">
        {[
          [
            "Тональность",
            q ? `${Math.round(q.sentimentAccuracy * 100)}%` : "Не измерено",
            "Цель ТЗ ≥ 80%",
            q ? q.sentimentAccuracy >= 0.8 : null,
          ],
          [
            "Подразделение",
            q ? `${Math.round(q.departmentAccuracy * 100)}%` : "Не измерено",
            "Цель ТЗ ≥ 75%",
            q ? q.departmentAccuracy >= 0.75 : null,
          ],
          [
            "Обработка · P95",
            q ? `${q.p95Ms} мс` : "Не измерено",
            "Цель ТЗ ≤ 5 секунд",
            q ? q.p95Ms <= 5000 : null,
          ],
          [
            "Загрузка данных",
            loadMs !== null ? `${loadMs} мс` : "—",
            "Локальный замер API; цель страницы ≤ 3 с",
            loadMs !== null ? loadMs < 3000 : null,
          ],
        ].map(([label, value, target, pass]) => (
          <div className="quality-card" key={String(label)}>
            <small>{label}</small>
            <strong>{value}</strong>
            <p>{target}</p>
            <Badge
              kind={pass === null ? "neutral" : pass ? "positive" : "negative"}
            >
              {pass === null
                ? "Ожидает проверки"
                : pass
                  ? "В пределах цели"
                  : "Ниже цели"}
            </Badge>
          </div>
        ))}
      </div>
      <Panel
        title="Протокол оценки"
        sub={
          q
            ? `${date(q.at)} · ${q.engine} · ${q.samples} примеров (${q.ru} RU / ${q.kk} KZ)`
            : "Проверка ещё не запускалась"
        }
      >
        {q ? (
          <>
            <div className="info-note">
              <TriangleAlert size={16} />
              <span>
                {q.engine.startsWith("demo")
                  ? "Измерен локальный демонстрационный классификатор. Качество LIVE-модели не подтверждено."
                  : "Измерен настроенный LIVE-провайдер. Для приёмки нужна репрезентативная независимая выборка."}
              </span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ошибки smoke-проверки</th>
                    <th>Эталон</th>
                    <th>Результат</th>
                  </tr>
                </thead>
                <tbody>
                  {q.errors.map((e, i) => (
                    <tr key={i}>
                      <td>{e.text}</td>
                      <td>{e.expected}</td>
                      <td>{e.actual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!q.errors.length && (
                <Empty
                  title="На этой выборке ошибок нет"
                  text="Это результат smoke-проверки; обобщать его на все обращения пока нельзя."
                />
              )}
            </div>
          </>
        ) : (
          <Empty
            title="Нет результатов измерения"
            text="Запустите проверку. Показатели не заполняются вымышленными процентами."
          />
        )}
      </Panel>
      <Panel
        title="Что проверяет P0"
        sub="Качество, безопасность и операционная пригодность"
      >
        <div className="checklist">
          {[
            "Единые данные в ленте и трёх дашбордах",
            "Отдельная уверенность подразделения и тональности",
            "Низкая уверенность передаётся оператору",
            "Direct исключён из публичных текстовых отчётов",
            "Одинаковые тексты не увеличивают число жалоб",
            "Неизвестные адреса не объединяются автоматически",
          ].map((s) => (
            <div key={s}>
              <Check size={15} />
              {s}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
