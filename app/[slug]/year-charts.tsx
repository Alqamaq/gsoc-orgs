"use client";

import { TrendingUp, Award } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Chart 1: Top Programming Languages Bar Chart
interface LanguageData {
  language: string;
  count: number;
  percentage: number;
}

const languageChartConfig = {
  count: {
    label: "Organizations",
    color: "hsl(var(--foreground))",
  },
} satisfies ChartConfig;

export function LanguagesBarChart({ data }: { data: LanguageData[] }) {
  // Take top 10 for readability
  const topLanguages = data.slice(0, 10);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Programming Languages</CardTitle>
        <CardDescription>
          Most commonly used languages across organizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={languageChartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topLanguages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis 
                dataKey="language" 
                type="category" 
                width={80} 
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar 
                dataKey="count" 
                fill="var(--color-count)" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Python dominates with {data[0]?.percentage}% adoption <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top {topLanguages.length} programming languages
        </div>
      </CardFooter>
    </Card>
  );
}

// Chart 2: Organizations by Student Slots (Horizontal Bar Chart)
interface StudentSlotData {
  org: string;
  slots: number;
}

const slotsChartConfig = {
  slots: {
    label: "Student Slots",
    color: "hsl(var(--foreground))",
  },
} satisfies ChartConfig;

export function StudentSlotsBarChart({ 
  data, 
  year 
}: { 
  data: StudentSlotData[]; 
  year: string;
}) {
  // Take top 8 for readability
  const topOrgs = data.slice(0, 8);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Student Slots</CardTitle>
        <CardDescription>
          Organizations offering the most opportunities in {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={slotsChartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topOrgs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis 
                dataKey="org" 
                type="category" 
                width={120} 
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar 
                dataKey="slots" 
                fill="var(--color-slots)" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {topOrgs[0]?.org} leads with {topOrgs[0]?.slots} slots <Award className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Higher slots = more opportunities for contributors
        </div>
      </CardFooter>
    </Card>
  );
}

