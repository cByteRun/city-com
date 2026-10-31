"use client";
import { t, useLocale } from "@/shared/i18n";

import { date } from "@/shared/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
const colors = {
  total: "#577cf0",
  negative: "#e58c76",
  neutral: "#b4b8ca",
  positive: "#5bb69e",
};
export function TrendChart({
  data,
  onClick,
}: {
  data: { date: string; total: number; negative: number }[];
  onClick: () => void;
}) {
  useLocale();
  return (
    <div
      className="trend-chart"
      role="img"
      aria-label={t("Динамика обращений и негатива по дням")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 24, right: 12, left: -26, bottom: 4 }}
          onClick={onClick}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5c7ee9" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#5c7ee9" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#edf0f6" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#95a2bb" }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#95a2bb" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e8edf3",
              fontSize: 12,
            }}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            name={t("Все обращения")}
            dataKey="total"
            stroke={colors.total}
            fill="url(#trend-fill)"
            strokeWidth={2.5}
          />
          <Line
            isAnimationActive={false}
            type="linear"
            name={t("Негатив")}
            dataKey="negative"
            stroke={colors.negative}
            dot={false}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function SentimentChart({
  data,
  total,
  onSelect,
}: {
  data: { name: string; key: string; value: number }[];
  total: number;
  onSelect: (key: string) => void;
}) {
  useLocale();
  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            isAnimationActive={false}
            data={data.map((entry) => ({ ...entry, name: t(entry.name) }))}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={88}
            paddingAngle={0}
            stroke="none"
            dataKey="value"
            onClick={(_d, index) => onSelect(data[index].key)}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={colors[d.key as keyof typeof colors]} />
            ))}
          </Pie>
          <Tooltip labelFormatter={(label) => t(String(label))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <strong>{t(total)}</strong>
        <span>{t("всего")}</span>
      </div>
    </div>
  );
}
export function WorkloadChart({
  data,
  onSelect,
}: {
  data: {
    name: string;
    total: number;
    negative: number;
    neutral: number;
    positive: number;
  }[];
  onSelect: (name: string) => void;
}) {
  useLocale();
  return (
    <div style={{ height: 340 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 5, right: 22, top: 15, bottom: 10 }}
          onClick={(s) => {
            if (s?.activeLabel) onSelect(String(s.activeLabel));
          }}
        >
          <CartesianGrid horizontal={false} stroke="#edf0f6" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#8b99b2" }}
          />
          <YAxis
            type="category"
            width={155}
            dataKey="name"
            tickFormatter={(value) => t(String(value))}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip labelFormatter={(label) => t(String(label))} />
          <Bar
            isAnimationActive={false}
            name={t("Обращения")}
            dataKey="total"
            fill="#657be0"
            radius={[0, 4, 4, 0]}
            barSize={17}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function DepartmentSentiment({
  data,
}: {
  data: { name: string; negative: number; neutral: number; positive: number }[];
}) {
  useLocale();
  return (
    <div style={{ height: 340 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          stackOffset="expand"
          margin={{ left: 0, right: 15, top: 15, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fontSize: 10 }}
          />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip labelFormatter={(label) => t(String(label))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            isAnimationActive={false}
            name={t("Негатив")}
            dataKey="negative"
            stackId="s"
            fill={colors.negative}
          />
          <Bar
            isAnimationActive={false}
            name={t("Нейтрально")}
            dataKey="neutral"
            stackId="s"
            fill={colors.neutral}
          />
          <Bar
            isAnimationActive={false}
            name={t("Позитив")}
            dataKey="positive"
            stackId="s"
            fill={colors.positive}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
