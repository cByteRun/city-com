"use client";
import { t, useLocale } from "@/shared/i18n";

import { ManageSources } from "@/features/manage-sources";
import {
  Globe2,
  Network,
  Layers3,
  RefreshCw,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { Panel, Button } from "@/shared/ui";
import { type State } from "@/entities/workspace";
import { type User } from "@/entities/session";
import { type Action, type Notify } from "@/shared/api";
import { type Item } from "@/entities/feedback";
import { type Filters } from "@/features/filter-feedback";
import { kpi } from "@/shared/ui";

export function SourcesPage({
  state,
  user,
  busy,
  action,
  notify,
  items,
  go,
}: {
  state: State;
  user: User;
  busy: boolean;
  action: Action;
  notify: Notify;
  items: Item[];
  go: (view: string, patch?: Partial<Filters>) => void;
}) {
  useLocale();
  return (
    <>
      <div className="kpi-grid four">
        {t(
          kpi(
            "Публичных каналов",
            state.sources.filter((s) => s.type !== "Direct").length,
            "Цель P0: не менее трёх",
            <Globe2 size={18} />,
          ),
        )}
        {t(
          kpi(
            "Подключено LIVE",
            user?.workspace === "live"
              ? state.sources.filter((s) => s.lastSync && !s.error).length
              : 0,
            user?.workspace === "demo"
              ? "В DEMO нет реального сбора"
              : "Успешные синхронизации",
            <Network size={18} />,
          ),
        )}
        {t(
          kpi(
            "Дубликаты и спам",
            state.sources.reduce((n, s) => n + s.duplicates, 0),
            "Не входят в аналитику",
            <Layers3 size={18} />,
          ),
        )}
        {t(
          kpi(
            "Частота обновления",
            "≤ 60 мин",
            "Фоновый collector + ручной запуск",
            <RefreshCw size={18} />,
          ),
        )}
      </div>
      <Panel
        title={t("Каналы городской обратной связи")}
        sub={t(
          "Настройте разрешённые источники и нажмите «Собрать». DEMO загружает подготовленные записи; LIVE запрашивает источник и Gemini.",
        )}
      >
        <ManageSources
          sources={state.sources}
          user={user}
          busy={busy}
          action={action}
          notify={notify}
        />
      </Panel>
      <div className="two-columns">
        <Panel
          title={t("Импорт CSV / XLSX")}
          sub={t("Воспроизводимый сбор из разрешённой выгрузки")}
        >
          <p className="body-copy">
            {t(
              "Загрузите сообщения с текстом, датой публикации и ссылкой. Они пройдут тот же конвейер анализа, дедупликации и кластеризации.",
            )}
          </p>
          <Button onClick={() => go("processing")}>
            <Upload size={14} /> {t("Перейти к импорту")}
          </Button>
        </Panel>
        <Panel
          title={t("Публичность и происхождение")}
          sub={t("Только разрешённые источники")}
        >
          <p className="body-copy">
            {t(
              "Каждая запись сохраняет источник и оригинальную ссылку. Доступ к закрытым чатам и частным аккаунтам не используется. Разрешение на сбор подтверждается перед подключением.",
            )}
          </p>
          <span className="privacy-inline">
            <ShieldCheck size={14} />{" "}
            {t("Минимизация данных и журнал операций")}
          </span>
        </Panel>
      </div>
    </>
  );
}
