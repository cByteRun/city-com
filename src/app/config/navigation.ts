import {
  LayoutDashboard,
  BarChart3,
  ListFilter,
  MessagesSquare,
  Sparkles,
  ShieldCheck,
  Globe2,
  Activity,
  Settings2,
  MessageSquare,
} from "lucide-react";
export const navigation = [
  {
    group: "АНАЛИТИКА",
    items: [
      ["overview", "Общая картина", LayoutDashboard],
      ["departments", "По подразделениям", BarChart3],
      ["issues", "Проблемы и приоритеты", ListFilter],
    ],
  },
  {
    group: "ОПЕРАЦИИ",
    items: [
      ["feed", "Лента обращений", MessagesSquare],
      ["processing", "AI-обработка", Sparkles],
      ["moderation", "Модерация", ShieldCheck],
      ["sources", "Источники", Globe2],
    ],
  },
  {
    group: "УПРАВЛЕНИЕ",
    items: [
      ["quality", "Качество и KPI", Activity],
      ["settings", "Администрирование", Settings2],
      ["chat", "AI-ассистент", MessageSquare],
    ],
  },
] as const;
export const titles: Record<string, [string, string]> = {
  overview: ["Ситуация в городе", "Единая аналитика городской обратной связи"],
  departments: [
    "По подразделениям",
    "Нагрузка, тональность и результаты работы городских служб",
  ],
  issues: [
    "Проблемы и приоритеты",
    "От разрозненных сигналов — к подтверждённым решениям",
  ],
  feed: [
    "Лента обращений",
    "Публичные сигналы и обращения жителей в одном месте",
  ],
  processing: [
    "AI-обработка",
    "Сбор → анализ → городская проблема → управленческое действие",
  ],
  moderation: [
    "Проверка классификации",
    "Человек в контуре: подтвердите или уточните рекомендации системы",
  ],
  sources: [
    "Источники данных",
    "Разрешённые каналы, расписание и результаты сбора",
  ],
  quality: [
    "Качество и KPI",
    "Проверяемые результаты обработки русских и казахских текстов",
  ],
  settings: [
    "Администрирование",
    "Доступ, справочник подразделений и журнал действий",
  ],
  chat: [
    "AI-ассистент",
    "Ответы по собранным обращениям с проверяемыми основаниями",
  ],
};
