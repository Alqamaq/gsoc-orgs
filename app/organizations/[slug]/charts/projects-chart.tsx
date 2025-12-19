"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";

interface ProjectsChartProps {
  data: Array<{ year: string; projects: number }>;
}

export function ProjectsChart({ data }: ProjectsChartProps) {
  // Take last 12 years and add gradient colors
  const chartData = data.slice(-12).map((d, index) => ({
    ...d,
    // Create gradient effect - lighter for older, darker for recent
    fill: index < 4 ? "#a5f3fc" : index < 8 ? "#67e8f9" : "#22d3ee",
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
        No projects data available
      </div>
    );
  }

  const maxProjects = Math.max(...chartData.map((d) => d.projects), 1);

  // Custom label renderer for bar tops
  const renderCustomBarLabel = (props: { x?: number; y?: number; width?: number; value?: number }) => {
    const { x = 0, y = 0, width = 0, value } = props;
    if (!value || value === 0) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#6b7280"
        textAnchor="middle"
        fontSize={9}
        fontWeight={500}
      >
        {value}
      </text>
    );
  };

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 5, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={35}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxProjects + 5]}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [value, "Projects"]}
          />
          <Bar
            dataKey="projects"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="projects"
              position="top"
              content={renderCustomBarLabel}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
