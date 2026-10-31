"use client";
import { t, useLocale } from "@/shared/i18n";

import { Panel, Button } from "@/shared/ui";
import { Sparkles, ArrowUpRight, ExternalLink, Send } from "lucide-react";
import { type Item } from "@/entities/feedback";
import { type Cluster } from "@/entities/issue";
import { type Workspace } from "@/entities/workspace";
import { useState } from "react";
import { departments, districts } from "@/entities/department";
export function ChatView({
  items,
  clusters,
  onSelect,
  workspace,
}: {
  items: Item[];
  clusters: Cluster[];
  onSelect: (id: string) => void;
  workspace: Workspace;
}) {
  useLocale();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    {
      question: string;
      count: number;
      dep: string;
      themes: string;
      negative: number;
      refs: Item[];
    }[]
  >([]);
  function ask(q: string) {
    if (!q.trim()) return;
    const dep =
      departments.find(
        (d) =>
          q.toLowerCase().includes(d.toLowerCase()) ||
          q.toLowerCase().includes(t(d).toLowerCase()),
      ) ||
      (/школ|school|мектеп/iu.test(q)
        ? "Образование"
        : /жкх|ткш|utilities/iu.test(q)
          ? "ЖКХ"
          : "");
    const negative = /негатив|жалоб|negative|complaint|теріс|шағым/iu.test(q);
    const lastWeek = /недел|week|апта/iu.test(q);
    const district = districts.find(
      (d) =>
        q.toLowerCase().includes(d.toLowerCase()) ||
        q.toLowerCase().includes(t(d).toLowerCase()),
    );
    const matching = items.filter(
      (i) =>
        (!dep || i.department === dep) &&
        (!negative || i.sentiment === "negative") &&
        (!lastWeek || Date.now() - Date.parse(i.publishedAt) <= 7 * 86400000) &&
        (!district || i.district === district),
    );
    const themes = clusters
      .filter((c) => matching.some((i) => i.clusterId === c.id))
      .slice(0, 3);
    setMessages((m) => [
      ...m,
      {
        question: q,
        count: matching.length,
        dep,
        themes: themes.map((c) => c.title).join("; "),
        negative: matching.filter((i) => i.sentiment === "negative").length,
        refs: matching.slice(0, 3),
      },
    ]);
    setQuery("");
  }
  return (
    <Panel
      title={t("Ассистент по обращениям")}
      sub={t(
        "{0} · локальный поиск и сводка по данным, без генеративного ответа",
        [workspace.toUpperCase()],
      )}
      className="chat-panel"
    >
      <div className="chat-intro">
        <span>
          <Sparkles size={28} />
        </span>
        <h2>{t("Что происходит в городе?")}</h2>
        <p>
          {t("Задайте вопрос по сфере, району или негативным обращениям.")}
          <br />
          {t("Ответ строится из текущей выборки публичных сообщений.")}
        </p>
        <div>
          {[
            "Главные жалобы по ЖКХ за неделю",
            "Покажи негатив по школам",
            "Какие проблемы в Северном районе?",
          ].map((q) => (
            <button key={q} onClick={() => ask(t(q))}>
              {t(q)}
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((m, k) => (
          <div key={k}>
            <div className="chat-question">{m.question}</div>
            <div className="chat-answer">
              <Sparkles size={17} />
              <div>
                <p>
                  {m.count
                    ? t(
                        "В текущей выборке найдено {0} публичных обращений{1}. Основные темы: {2}. {3} сообщений с негативной тональностью. Для решения откройте первоисточники и подтвердите назначение.",
                        [
                          m.count,
                          m.dep ? t(" по сфере «{0}»", [t(m.dep)]) : "",
                          m.themes,
                          m.negative,
                        ],
                      )
                    : t(
                        "В текущей выборке нет подходящих публичных обращений. Измените фильтры или уточните сферу.",
                      )}
                </p>
                {m.refs.map((i, n) => (
                  <button key={i.id} onClick={() => onSelect(i.id)}>
                    <span>[{t(n + 1)}]</span>
                    {t(i.topic)}
                    <ExternalLink size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("Вопрос по обращениям")}
          placeholder={t("Например: какие главные жалобы по ЖКХ за неделю?")}
        />
        <Button
          type="submit"
          variant="default"
          disabled={!query.trim()}
          aria-label={t("Отправить вопрос")}
        >
          <Send size={17} />
        </Button>
      </form>
      <p className="chat-note">
        {t(
          "Сводка носит рекомендательный характер. Direct и персональные данные исключены.",
        )}
      </p>
    </Panel>
  );
}
