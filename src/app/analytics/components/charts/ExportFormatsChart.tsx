"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ExportFormatData {
  format: string;
  count: number;
  percentage: number;
}

interface ExportFormatsChartProps {
  data: ExportFormatData[];
}

export function ExportFormatsChart({ data }: ExportFormatsChartProps) {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#8b5cf6", // purple
    "#f59e0b", // orange
    "#ef4444", // red
    "#eab308", // yellow
  ];

  const chartData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ format, percentage }) => `${format} ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
