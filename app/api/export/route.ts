import { buildPDF } from "@/server/pdf";
import ExcelJS from "exceljs";
import { requireUser, errorResponse } from "@/server/auth";
import { readState, mutate, audit } from "@/server/store";
import { scope, filterItems, priority } from "@/server/domain";
import { sentimentLabels, type Filters } from "@/server/types";
export const runtime = "nodejs";
const safeCell = (text: string) =>
  /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;
    const state = scope(readState(user.workspace), user);
    const filters = Object.fromEntries(params) as Partial<Filters>;
    const items = filterItems(state, filters);
    const rows = items
      .filter((i) => !i.private)
      .map((i) => {
        const c = state.clusters.find((c) => c.id === i.clusterId)!;
        return [
          i.id,
          i.publishedAt,
          state.sources.find((s) => s.id === i.sourceId)?.name || "",
          i.text,
          i.department,
          sentimentLabels[i.sentiment],
          i.confidence,
          i.sentimentConfidence,
          i.district,
          i.topic,
          priority(c, state.items).label,
          c.status,
          i.url,
          i.reason,
        ];
      });
    const headers = [
      "ID",
      "Публикация",
      "Источник",
      "Текст",
      "Подразделение",
      "Тональность",
      "Уверенность подразделения",
      "Уверенность тональности",
      "Район",
      "Проблема",
      "Приоритет",
      "Статус",
      "Оригинал",
      "Обоснование",
    ];
    const format = params.get("format") || "csv";
    mutate(user.workspace, (s) =>
      audit(
        s,
        user.name,
        `Экспорт ${format.toUpperCase()}: ${rows.length} публичных записей; Direct только агрегат`,
        user.workspace,
      ),
    );
    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Обращения");
      ws.addRow(headers);
      rows.forEach((row) =>
        ws.addRow(row.map((c) => (typeof c === "string" ? safeCell(c) : c))),
      );
      ws.getRow(1).font = { bold: true };
      ws.columns.forEach((c, i) => {
        c.width = i === 3 ? 70 : 24;
      });
      ws.autoFilter = { from: "A1", to: "N1" };
      const summary = wb.addWorksheet("Сводка");
      summary.addRows([
        ["CityCom", user.workspace.toUpperCase()],
        ["Сформировано", new Date().toISOString()],
        ["Фильтры", JSON.stringify(filters)],
        ["Всего обращений", items.length],
        ["Direct (только количество)", items.filter((i) => i.private).length],
        ["Рекомендательный характер", "Итоговое решение принимает сотрудник"],
      ]);
      const buffer = await wb.xlsx.writeBuffer();
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="citycom.xlsx"',
          "Cache-Control": "no-store",
        },
      });
    }
    if (format === "pdf") {
      const buffer = await buildPDF(rows, {
        workspace: user.workspace,
        total: items.length,
        direct: items.filter((i) => i.private).length,
        filters: JSON.stringify(filters),
      });
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="citycom.pdf"',
          "Cache-Control": "no-store",
        },
      });
    }
    const csv =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row
            .map((v) => '"' + safeCell(String(v)).replace(/"/g, '""') + '"')
            .join(";"),
        )
        .join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="citycom.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
