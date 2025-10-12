import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type TimeFilter = "day" | "week" | "month" | "year";

interface UsageData {
  date: string;
  credits: number;
  count: number;
}

interface ToolUsage {
  tool_name: string;
  total_credits: number;
  usage_count: number;
}

export default function Usage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [chartData, setChartData] = useState<UsageData[]>([]);
  const [toolStats, setToolStats] = useState<ToolUsage[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalUsages, setTotalUsages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchUsageData();
  }, [user, timeFilter]);

  const getDateFilter = () => {
    const now = new Date();
    const filters = {
      day: new Date(now.setDate(now.getDate() - 1)),
      week: new Date(now.setDate(now.getDate() - 7)),
      month: new Date(now.setMonth(now.getMonth() - 1)),
      year: new Date(now.setFullYear(now.getFullYear() - 1)),
    };
    return filters[timeFilter].toISOString();
  };

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch usage data with tool names
      const { data: usageData, error } = await supabase
        .from("tool_usages")
        .select(`
          id,
          used_at,
          credits_deducted,
          tool_id,
          ai_tools (name)
        `)
        .eq("user_id", user?.id)
        .gte("used_at", dateFilter)
        .order("used_at", { ascending: true });

      if (error) throw error;

      // Process chart data
      const dataByDate = new Map<string, { credits: number; count: number }>();
      const toolUsageMap = new Map<string, { credits: number; count: number }>();

      usageData?.forEach((usage: any) => {
        const date = new Date(usage.used_at).toLocaleDateString();
        const toolName = usage.ai_tools?.name || "Unknown";
        
        // Aggregate by date
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { credits: 0, count: 0 });
        }
        const dateData = dataByDate.get(date)!;
        dateData.credits += usage.credits_deducted || 0;
        dateData.count += 1;

        // Aggregate by tool
        if (!toolUsageMap.has(toolName)) {
          toolUsageMap.set(toolName, { credits: 0, count: 0 });
        }
        const toolData = toolUsageMap.get(toolName)!;
        toolData.credits += usage.credits_deducted || 0;
        toolData.count += 1;
      });

      // Convert to arrays
      const chartDataArray = Array.from(dataByDate.entries()).map(([date, data]) => ({
        date,
        credits: data.credits,
        count: data.count,
      }));

      const toolStatsArray = Array.from(toolUsageMap.entries())
        .map(([tool_name, data]) => ({
          tool_name,
          total_credits: data.credits,
          usage_count: data.count,
        }))
        .sort((a, b) => b.total_credits - a.total_credits);

      setChartData(chartDataArray);
      setToolStats(toolStatsArray);

      // Calculate totals
      const totalCreds = usageData?.reduce((sum, u: any) => sum + (u.credits_deducted || 0), 0) || 0;
      setTotalCredits(totalCreds);
      setTotalUsages(usageData?.length || 0);

    } catch (error: any) {
      console.error("Error fetching usage data:", error);
      toast.error("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Usage Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Track your tool usage and credit consumption
              </p>
            </div>
            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Credits Used</CardTitle>
              <CardDescription>In selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{totalCredits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Usages</CardTitle>
              <CardDescription>Number of times tools were used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{totalUsages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Credits</CardTitle>
              <CardDescription>Per usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {totalUsages > 0 ? (totalCredits / totalUsages).toFixed(1) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usage Over Time</CardTitle>
            <CardDescription>Credits used and usage count by date</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credits" className="w-full">
              <TabsList>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="count">Usage Count</TabsTrigger>
              </TabsList>
              <TabsContent value="credits">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--foreground))" }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))"
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="credits" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Credits Used"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="count">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--foreground))" }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))"
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Usage Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Tool Usage Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Tool</CardTitle>
            <CardDescription>Breakdown of credits and usage by tool</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool Name</TableHead>
                  <TableHead className="text-right">Usage Count</TableHead>
                  <TableHead className="text-right">Total Credits</TableHead>
                  <TableHead className="text-right">Avg Credits/Use</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No usage data for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  toolStats.map((tool, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{tool.tool_name}</TableCell>
                      <TableCell className="text-right">{tool.usage_count}</TableCell>
                      <TableCell className="text-right">{tool.total_credits}</TableCell>
                      <TableCell className="text-right">
                        {(tool.total_credits / tool.usage_count).toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
