import { departments, type State, type Source } from "./types";
import { demoAnalyze, insertItem } from "./domain";
export function sources(demo: boolean): Source[] {
  return [1, 2, 3]
    .map((n) => ({
      id: `source-${n}`,
      name: demo
        ? [
            "Социальные сети · демо",
            "Новости · демо",
            "Городской портал · демо",
          ][n - 1]
        : process.env[`CITYCOM_SOURCE_${n}_NAME`] || `Источник ${n}`,
      type: (demo
        ? "JSON"
        : process.env[`CITYCOM_SOURCE_${n}_TYPE`] || "JSON") as Source["type"],
      url: demo ? "" : process.env[`CITYCOM_SOURCE_${n}_URL`] || "",
      enabled: true,
      permission:
        demo || process.env[`CITYCOM_SOURCE_${n}_APPROVED`] === "true",
      intervalMinutes: 60,
      fetched: 0,
      inserted: 0,
      duplicates: 0,
    }))
    .concat([
      {
        id: "direct",
        name: demo
          ? "Direct · синтетический поток"
          : "Direct · официальный Telegram-бот",
        type: "Direct",
        url: "",
        enabled: true,
        permission: true,
        intervalMinutes: 60,
        fetched: 0,
        inserted: 0,
        duplicates: 0,
      },
    ]);
}
export function seed(demo: boolean): State {
  const state: State = {
    directory: departments.map((name, index) => ({
      id: String(index),
      name,
      topics:
        (
          {
            ЖКХ: "Отопление, вода, лифты, коммунальные услуги",
            Образование: "Школы, детские сады, питание, обучение",
            Благоустройство: "Освещение, дворы, снег, озеленение",
          } as Record<string, string>
        )[name] || name,
      responsible: "",
    })),
    items: [],
    clusters: [],
    sources: sources(demo),
    audit: [],
    quality: null,
    updatedAt: new Date().toISOString(),
  };
  if (!demo) return state;
  const cases = [
    [
      "На ул. Лермонтова 44 нет отопления, дети мерзнут. Северный район.",
      "Перебои с отоплением",
      "ЖКХ",
      "Северный",
      "ул. Лермонтова 44",
    ],
    [
      "На ул. Ак. Сатпаева 19 ямы на дороге, опасно ехать. Центральный район.",
      "Ямы на проезжей части",
      "Дороги и транспорт",
      "Центральный",
      "ул. Ак. Сатпаева 19",
    ],
    [
      "На ул. Естая 82 не работает освещение во дворе. Усольский район.",
      "Не работает уличное освещение",
      "Благоустройство",
      "Усольский",
      "ул. Естая 82",
    ],
    [
      "Промышленный район, ул. Торайгырова 12: дым и неприятный запах, проблема с воздухом.",
      "Дым и качество воздуха",
      "Экология",
      "Промышленный",
      "ул. Торайгырова 12",
    ],
    [
      "На ул. Камзина 70 бродячие собаки, опасно детям. Восточный район.",
      "Бродячие животные",
      "Безопасность и порядок",
      "Восточный",
      "ул. Камзина 70",
    ],
    [
      "Спасибо за ремонт школы на ул. Пушкина 30. Центральный район.",
      "Ремонт школы",
      "Образование",
      "Центральный",
      "ул. Пушкина 30",
    ],
    [
      "Емханада дәрігер жоқ, кезек ұзақ. Южный район, ул. Толстого 15.",
      "Очереди в поликлинике",
      "Здравоохранение",
      "Южный",
      "ул. Толстого 15",
    ],
    [
      "Спасибо, мусор во дворе на ул. Назарбаева 21 вывезли вовремя.",
      "Вывоз мусора",
      "ЖКХ",
      "Центральный",
      "ул. Назарбаева 21",
    ],
    [
      "Когда изменится маршрут автобуса на ул. Мира 10?",
      "Маршруты общественного транспорта",
      "Дороги и транспорт",
      "Северный",
      "ул. Мира 10",
    ],
    [
      "Кітапханаға жаңа кітаптар керек. На ул. Астана 5.",
      "Городские библиотеки",
      "Культура",
      "Усольский",
      "ул. Астана 5",
    ],
    [
      "Как оформить пособие? Южный район, ул. Бекхожина 8.",
      "Оформление социальных пособий",
      "Социальная защита",
      "Южный",
      "ул. Бекхожина 8",
    ],
    [
      "Не понятно, кто отвечает за этот объект возле дома.",
      "Требуется уточнение темы",
      "Другое",
      "Не определён",
      "",
    ],
  ];
  let n = 0;
  for (let j = 0; j < cases.length; j++) {
    const [text, topic, department, district, location] = cases[j];
    const count = j < 5 ? 12 + (j % 4) : j === 11 ? 4 : 7;
    for (let k = 0; k < count; k++) {
      const privateMessage = k % 7 === 6;
      const publishedAt = new Date(
        Date.now() -
          ((k % 5 === 0 ? 0 : k % 14) * 86400000 +
            (k + 1) * 180000 +
            j * 60000),
      ).toISOString();
      const analysis = {
        ...demoAnalyze(text),
        topic,
        department,
        district,
        location,
        confidence:
          j === 11 ? 0.42 : k % 9 === 8 ? 0.55 : 0.82 + (k % 4) * 0.04,
      };
      const item = insertItem(
        state,
        {
          text: `${text} Сообщение жителя №${++n}.`,
          sourceId: privateMessage ? "direct" : `source-${(k % 3) + 1}`,
          url: "",
          publishedAt,
          authorId: `resident-${j}-${k}`,
          private: privateMessage,
        },
        analysis,
        20 + (k % 5) * 8,
        "demo-rules-v1",
      );
      if (item) item.reviewed = k % 5 === 0;
    }
  }
  state.clusters.forEach((c, j) => {
    if (j % 5 === 3) {
      c.status = "Решено";
      c.assignee = c.department;
      c.assignedAt = new Date(
        new Date(c.createdAt).getTime() + 1200000,
      ).toISOString();
      c.resolvedAt = new Date().toISOString();
    } else if (j % 3 === 2) {
      c.status = "В работе";
      c.assignee = c.department;
      c.assignedAt = new Date(
        new Date(c.createdAt).getTime() + 2400000,
      ).toISOString();
    }
  });
  state.sources.forEach((s) => {
    s.fetched = state.items.filter((i) => i.sourceId === s.id).length;
    s.inserted = s.fetched;
    s.lastSync = state.updatedAt;
  });
  state.audit.push({
    id: "initial",
    at: state.updatedAt,
    actor: "Система",
    action: "Создан отдельный демонстрационный набор",
    target: "demo",
  });
  return state;
}
