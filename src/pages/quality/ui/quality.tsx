"use client";
import { t, useLocale } from "@/shared/i18n";

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
  useLocale();
  const q = state.quality;
  return (
    <>
      <div className="quality-banner">
        <div>
          <Activity size={22} />
          <div>
            <h3>{t("Качество должно быть измерено")}</h3>
            <p>
              {t(
                "Размеченная RU/KZ smoke-выборка · 36 примеров. Не заменяет независимую приёмочную выборку.",
              )}
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
            q ? t("{0} мс", [q.p95Ms]) : "Не измерено",
            "Цель ТЗ ≤ 5 секунд",
            q ? q.p95Ms <= 5000 : null,
          ],
          [
            "Загрузка данных",
            loadMs !== null ? t("{0} мс", [loadMs]) : "—",
            "Локальный замер API; цель страницы ≤ 3 с",
            loadMs !== null ? loadMs < 3000 : null,
          ],
        ].map(([label, value, target, pass]) => (
          <div className="quality-card" key={String(label)}>
            <small>{t(label)}</small>
            <strong>{t(value)}</strong>
            <p>{t(target)}</p>
            <Badge
              kind={pass === null ? "neutral" : pass ? "positive" : "negative"}
            >
              {t(
                pass === null
                  ? "Ожидает проверки"
                  : pass
                    ? "В пределах цели"
                    : "Ниже цели",
              )}
            </Badge>
          </div>
        ))}
      </div>
      <Panel
        title={t("Протокол оценки")}
        sub={t(
          q
            ? t("{0} · {1} · {2} примеров ({3} RU / {4} KZ)", [
                date(q.at),
                q.engine,
                q.samples,
                q.ru,
                q.kk,
              ])
            : "Проверка ещё не запускалась",
        )}
      >
        {q ? (
          <>
            <div className="info-note">
              <TriangleAlert size={16} />
              <span>
                {t(
                  q.engine.startsWith("demo")
                    ? "Измерен локальный демонстрационный классификатор. Качество LIVE-модели не подтверждено."
                    : "Измерен настроенный LIVE-провайдер. Для приёмки нужна репрезентативная независимая выборка.",
                )}
              </span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("Ошибки smoke-проверки")}</th>
                    <th>{t("Эталон")}</th>
                    <th>{t("Результат")}</th>
                  </tr>
                </thead>
                <tbody>
                  {q.errors.map((e, i) => (
                    <tr key={i}>
                      <td>{t(e.text)}</td>
                      <td>{t(e.expected)}</td>
                      <td>{t(e.actual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!q.errors.length && (
                <Empty
                  title={t("На этой выборке ошибок нет")}
                  text="Это результат smoke-проверки; обобщать его на все обращения пока нельзя."
                />
              )}
            </div>
          </>
        ) : (
          <Empty
            title={t("Нет результатов измерения")}
            text="Запустите проверку. Показатели не заполняются вымышленными процентами."
          />
        )}
      </Panel>
      <Panel
        title={t("Что проверяет P0")}
        sub={t("Качество, безопасность и операционная пригодность")}
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
              {t(s)}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
