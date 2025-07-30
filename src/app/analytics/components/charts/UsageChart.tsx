"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface UsageData {
  date: string;
  videos: number;
  chats: number;
  exports: number;
}

interface UsageChartProps {
  data: UsageData[];
}

export function UsageChart({ data }: UsageChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const chartData = data.map((item) => ({
    ...item,
    date: formatDate(item.date),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="videos" fill="#3b82f6" name="Videos" />
          <Bar dataKey="chats" fill="#10b981" name="Chats" />
          <Bar dataKey="exports" fill="#8b5cf6" name="Exports" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
