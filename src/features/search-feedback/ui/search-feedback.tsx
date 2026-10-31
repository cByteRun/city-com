"use client";
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
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    { question: string; answer: string; refs: Item[] }[]
  >([]);
  function ask(q: string) {
    if (!q.trim()) return;
    const dep =
      departments.find((d) => q.toLowerCase().includes(d.toLowerCase())) ||
      (/школ/iu.test(q) ? "Образование" : "");
    const negative = /негатив|жалоб/iu.test(q);
    const lastWeek = /недел/iu.test(q);
    const district = districts.find((d) =>
      q.toLowerCase().includes(d.toLowerCase()),
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
        answer: matching.length
          ? `В текущей выборке найдено ${matching.length} публичных обращений${dep ? ` по сфере «${dep}»` : ""}. Основные темы: ${themes.map((c) => c.title.toLowerCase()).join("; ")}. ${matching.filter((i) => i.sentiment === "negative").length} сообщений с негативной тональностью. Для решения откройте первоисточники и подтвердите назначение.`
          : "В текущей выборке нет подходящих публичных обращений. Измените фильтры или уточните сферу.",
        refs: matching.slice(0, 3),
      },
    ]);
    setQuery("");
  }
  return (
    <Panel
      title="Ассистент по обращениям"
      sub={`${workspace.toUpperCase()} · локальный поиск и сводка по данным, без генеративного ответа`}
      className="chat-panel"
    >
      <div className="chat-intro">
        <span>
          <Sparkles size={28} />
        </span>
        <h2>Что происходит в городе?</h2>
        <p>
          Задайте вопрос по сфере, району или негативным обращениям.
          <br />
          Ответ строится из текущей выборки публичных сообщений.
        </p>
        <div>
          {[
            "Главные жалобы по ЖКХ за неделю",
            "Покажи негатив по школам",
            "Какие проблемы в Северном районе?",
          ].map((q) => (
            <button key={q} onClick={() => ask(q)}>
              {q}
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
                <p>{m.answer}</p>
                {m.refs.map((i, n) => (
                  <button key={i.id} onClick={() => onSelect(i.id)}>
                    <span>[{n + 1}]</span>
                    {i.topic}
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
          aria-label="Вопрос по обращениям"
          placeholder="Например: какие главные жалобы по ЖКХ за неделю?"
        />
        <Button
          type="submit"
          variant="default"
          disabled={!query.trim()}
          aria-label="Отправить вопрос"
        >
          <Send size={17} />
        </Button>
      </form>
      <p className="chat-note">
        Сводка носит рекомендательный характер. Direct и персональные данные
        исключены.
      </p>
    </Panel>
  );
}
