"use client";
import {
  Loader2,
  Check,
  ChevronRight,
  LockKeyhole,
  Upload,
  ArrowDownToLine,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Panel, Button } from "@/shared/ui";
import { type User } from "@/entities/session";
import { type State } from "@/entities/workspace";
import { type Action } from "@/shared/api";
import { useState } from "react";
import { Database, ShieldCheck, Sparkles, Layers3, Zap } from "lucide-react";
export function Processing({
  user,
  state,
  busy,
  action,
  notify,
  onFeed,
}: {
  user: User;
  state: State;
  busy: boolean;
  action: Action;
  notify: (text: string, error?: boolean) => void;
  onFeed: () => void;
}) {
  const [text, setText] = useState(
    "На ул. Лермонтова 44 нет отопления, дети мерзнут. Северный район.",
  );
  const [source, setSource] = useState("source-1");
  const [url, setUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [approved, setApproved] = useState(false);
  const [direct, setDirect] = useState(false);
  const [rows, setRows] = useState<any[] | null>(null);
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState<any>(null);
  const [working, setWorking] = useState(false);
  async function readFile(file: File) {
    try {
      if (file.size > 2000000)
        throw new Error("Максимальный размер файла — 2 МБ");
      let input: any[] = [];
      if (file.name.endsWith(".csv")) {
        const Papa = (await import("papaparse")).default;
        const parsed = Papa.parse(file.size ? await file.text() : "", {
          header: true,
          skipEmptyLines: true,
        });
        if (parsed.errors.length)
          throw new Error("Проверьте заголовки и структуру CSV");
        input = parsed.data as any[];
      } else if (file.name.endsWith(".xlsx")) {
        const ExcelJS = await import("exceljs");
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(await file.arrayBuffer());
        const sheet = wb.worksheets[0];
        if (!sheet) throw new Error("Пустая книга");
        const headers = (sheet.getRow(1).values as string[]).slice(1);
        sheet.eachRow((row, n) => {
          if (n > 1) {
            const values = (row.values as unknown[]).slice(1);
            input.push(
              Object.fromEntries(
                headers.map((h, i) => [
                  h,
                  values[i] instanceof Date
                    ? (values[i] as Date).toISOString()
                    : String(values[i] || ""),
                ]),
              ),
            );
          }
        });
      } else throw new Error("Поддерживаются CSV и XLSX");
      if (input.length > 30)
        throw new Error("Для одной операции P0 доступно до 30 сообщений");
      if (!input.length) throw new Error("Нет строк для импорта");
      const normalized = input.map((r) => ({
        text: String(r.text || ""),
        url: String(r.url || ""),
        publishedAt: new Date(r.publishedAt).toISOString(),
        authorId: r.authorId ? String(r.authorId) : undefined,
      }));
      if (normalized.some((r) => r.text.length < 5))
        throw new Error("Обязательные колонки: text, publishedAt, url");
      setRows(normalized);
      setFilename(file.name);
      notify(`Файл прочитан: ${normalized.length} записей`);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Не удалось прочитать файл",
        true,
      );
    }
  }
  async function run() {
    setWorking(true);
    setResult(null);
    const r = await action({
      action: "ingest",
      sourceId: source,
      rows: rows || [
        { text, url, publishedAt: new Date(publishedAt).toISOString() },
      ],
      approved,
      private: direct,
    });
    if (r) {
      setResult(r);
      notify(`Сохранено ${r.inserted} обращений; пропущено ${r.duplicates}`);
    }
    setWorking(false);
  }
  return (
    <>
      <div className="pipeline-steps">
        {[
          ["Сбор", Database],
          ["Обезличивание", ShieldCheck],
          ["RU / KZ анализ", Sparkles],
          ["Кластеризация", Layers3],
          ["Приоритет", Zap],
        ].map(([label, Icon], i) => {
          const I = Icon as typeof Database;
          return (
            <div
              key={String(label)}
              className={working ? "processing" : result ? "completed" : ""}
            >
              <span>
                {working ? (
                  <Loader2 size={18} className="spin" />
                ) : result ? (
                  <Check size={18} />
                ) : (
                  <I size={18} />
                )}
              </span>
              <strong>{String(label)}</strong>
              <small>{user.workspace === "demo" ? "DEMO" : "LIVE"}</small>
              {i < 4 && <ChevronRight size={14} />}
            </div>
          );
        })}
      </div>
      <div className="two-columns processing-columns">
        <Panel
          title="Новое обращение"
          sub={
            user.workspace === "demo"
              ? "Локальная демонстрационная обработка без вызова LLM"
              : "Настоящая классификация через серверный Gemini API"
          }
        >
          <div className="form-stack">
            <label className="field-label">
              Источник
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {state.sources
                  .filter((s) => s.type !== "Direct")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field-label">
              Текст обращения
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setRows(null);
                }}
                rows={5}
                placeholder="Вставьте публичное обращение на русском или казахском"
              />
            </label>
            <div className="two-fields">
              <label className="field-label">
                Ссылка на оригинал
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="field-label">
                Опубликовано
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </label>
            </div>
            {user.workspace === "demo" && (
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={direct}
                  onChange={(e) => setDirect(e.target.checked)}
                />
                <LockKeyhole size={14} /> Синтетическое Direct-сообщение
              </label>
            )}
            <label className="checkbox-field permission-check">
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              <span>
                {user.workspace === "demo"
                  ? "Подтверждаю: это синтетические данные для демонстрации."
                  : "Подтверждаю публичность, право обработки и допустимость передачи обезличенного текста AI-провайдеру."}
              </span>
            </label>
            <Button
              variant="default"
              disabled={
                busy ||
                !approved ||
                !publishedAt ||
                text.length < 5 ||
                !["admin", "analyst"].includes(user.role)
              }
              onClick={run}
            >
              {working ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <Sparkles size={15} />
              )}{" "}
              {rows
                ? `Обработать ${rows.length} записей`
                : "Анализировать обращение"}
            </Button>
          </div>
        </Panel>
        <div>
          <Panel
            title="Загрузка выгрузки"
            sub="CSV / XLSX · до 30 записей за одну операцию"
          >
            <label className="upload-zone">
              <Upload size={26} />
              <strong>{filename || "Выберите файл или перетащите сюда"}</strong>
              <span>Колонки: text, url, publishedAt, authorId</span>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  if (e.target.files?.[0]) readFile(e.target.files[0]);
                }}
              />
            </label>
            <div className="template-actions">
              <a href="/import-template.csv" download>
                Скачать шаблон CSV <ArrowDownToLine size={12} />
              </a>
              {rows && (
                <button
                  className="text-action"
                  onClick={() => {
                    setRows(null);
                    setFilename("");
                  }}
                >
                  Убрать файл
                </button>
              )}
            </div>
          </Panel>
          <Panel
            title="Результат обработки"
            sub="Изменения сразу появляются во всех дашбордах"
          >
            {result ? (
              <div className="processing-result">
                <span className="success-symbol">
                  <Check size={23} />
                </span>
                <h3>Обработка завершена</h3>
                <p>
                  Сохранено: <strong>{result.inserted}</strong> · Дубликаты /
                  спам: <strong>{result.duplicates}</strong>
                </p>
                <Button onClick={onFeed}>
                  Открыть ленту <ArrowRight size={14} />
                </Button>
              </div>
            ) : (
              <div className="processing-placeholder">
                <Activity size={24} />
                <p>
                  {working
                    ? "Маскирование и анализ…"
                    : "Результат появится после запуска"}
                </p>
                <small>Низкая уверенность → очередь модерации</small>
              </div>
            )}
          </Panel>
        </div>
      </div>
      <div className="info-note">
        <ShieldCheck size={17} />
        <span>
          Решения ИИ рекомендательны. Приоритет рассчитывается отдельно,
          повторные сообщения не увеличивают число независимых жалоб.
        </span>
      </div>
    </>
  );
}
