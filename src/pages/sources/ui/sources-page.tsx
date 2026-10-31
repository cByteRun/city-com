"use client";
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
  return (
    <>
      <div className="kpi-grid four">
        {kpi(
          "Публичных каналов",
          state.sources.filter((s) => s.type !== "Direct").length,
          "Цель P0: не менее трёх",
          <Globe2 size={18} />,
        )}
        {kpi(
          "Подключено LIVE",
          user?.workspace === "live"
            ? state.sources.filter((s) => s.lastSync && !s.error).length
            : 0,
          user?.workspace === "demo"
            ? "В DEMO нет реального сбора"
            : "Успешные синхронизации",
          <Network size={18} />,
        )}
        {kpi(
          "Дубликаты и спам",
          state.sources.reduce((n, s) => n + s.duplicates, 0),
          "Не входят в аналитику",
          <Layers3 size={18} />,
        )}
        {kpi(
          "Частота обновления",
          "≤ 60 мин",
          "Фоновый collector + ручной запуск",
          <RefreshCw size={18} />,
        )}
      </div>
      <Panel
        title="Каналы городской обратной связи"
        sub="Подключения задаются администратором на сервере; данные Direct отделены от публичных"
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
          title="Импорт CSV / XLSX"
          sub="Воспроизводимый сбор из разрешённой выгрузки"
        >
          <p className="body-copy">
            Загрузите сообщения с текстом, датой публикации и ссылкой. Они
            пройдут тот же конвейер анализа, дедупликации и кластеризации.
          </p>
          <Button onClick={() => go("processing")}>
            <Upload size={14} /> Перейти к импорту
          </Button>
        </Panel>
        <Panel
          title="Публичность и происхождение"
          sub="Только разрешённые источники"
        >
          <p className="body-copy">
            Каждая запись сохраняет источник и оригинальную ссылку. Доступ к
            закрытым чатам и частным аккаунтам не используется. Разрешение на
            сбор подтверждается перед подключением.
          </p>
          <span className="privacy-inline">
            <ShieldCheck size={14} /> Минимизация данных и журнал операций
          </span>
        </Panel>
      </div>
    </>
  );
}
