import { analyze } from "./ai";
import type { Workspace, Quality } from "./types";
// A separately labeled smoke set. Not a representative acceptance benchmark.
export const gold = [
  ["На улице нет отопления, дома холодно.", "ЖКХ", "negative"],
  ["Спасибо, воду вернули вовремя!", "ЖКХ", "positive"],
  ["Когда проверят лифт?", "ЖКХ", "neutral"],
  ["Жылу жоқ, үйде суық.", "ЖКХ", "negative"],
  ["Суды қосқандарыңызға рахмет.", "ЖКХ", "positive"],
  ["Водоснабжение қашан болады?", "ЖКХ", "neutral"],
  ["На дороге ямы, опасно ехать.", "Дороги и транспорт", "negative"],
  ["Спасибо за новый автобус!", "Дороги и транспорт", "positive"],
  ["Какой маршрут у автобуса?", "Дороги и транспорт", "neutral"],
  ["Жолда үлкен ямы, жүру опасно.", "Дороги и транспорт", "negative"],
  ["Автобус үшін рахмет.", "Дороги и транспорт", "positive"],
  ["Аялдама қайда?", "Дороги и транспорт", "neutral"],
  ["Не работает освещение во дворе.", "Благоустройство", "negative"],
  ["Спасибо за новую детскую площадку.", "Благоустройство", "positive"],
  ["Когда посадят деревья во дворе?", "Благоустройство", "neutral"],
  ["Аулада жарық жоқ.", "Благоустройство", "negative"],
  ["Жаңа аула үшін рахмет.", "Благоустройство", "positive"],
  ["Аула қашан тазартылады?", "Благоустройство", "neutral"],
  ["В поликлинике огромные очереди, ужас.", "Здравоохранение", "negative"],
  ["Спасибо врачу за помощь.", "Здравоохранение", "positive"],
  ["Где находится поликлиника?", "Здравоохранение", "neutral"],
  ["Емханада дәрігер жоқ.", "Здравоохранение", "negative"],
  ["Дәрігерге рахмет.", "Здравоохранение", "positive"],
  ["Емхана қашан ашылады?", "Здравоохранение", "neutral"],
  ["В школе нет учителя.", "Образование", "negative"],
  ["Спасибо за ремонт школы.", "Образование", "positive"],
  ["Когда запись в детский сад?", "Образование", "neutral"],
  ["Мектепте мұғалім жоқ.", "Образование", "negative"],
  ["Мектеп үшін рахмет.", "Образование", "positive"],
  ["Балабақша қайда?", "Образование", "neutral"],
  ["Дым от выбросов, ужасный воздух.", "Экология", "negative"],
  ["Спасибо за контроль выбросов.", "Экология", "positive"],
  ["Где посмотреть уровень выбросов?", "Экология", "neutral"],
  ["Ауада түтін, проблема.", "Экология", "negative"],
  ["Таза ауа үшін рахмет.", "Экология", "positive"],
  ["Ауа сапасы қандай?", "Экология", "neutral"],
] as const;
export async function evaluate(workspace: Workspace): Promise<Quality> {
  let s = 0,
    d = 0;
  const times: number[] = [];
  const errors: Quality["errors"] = [];
  let engine = "";
  for (const [text, department, sentiment] of gold) {
    const r = await analyze(text, workspace);
    engine = r.engine;
    times.push(r.latencyMs);
    if (r.analysis.department === department) d++;
    if (r.analysis.sentiment === sentiment) s++;
    if (
      r.analysis.department !== department ||
      r.analysis.sentiment !== sentiment
    )
      errors.push({
        text,
        expected: `${department} / ${sentiment}`,
        actual: `${r.analysis.department} / ${r.analysis.sentiment}`,
      });
  }
  return {
    at: new Date().toISOString(),
    engine,
    samples: gold.length,
    sentimentAccuracy: s / gold.length,
    departmentAccuracy: d / gold.length,
    p95Ms: times.sort((a, b) => a - b)[Math.ceil(times.length * 0.95) - 1],
    ru: 18,
    kk: 18,
    errors,
  };
}
