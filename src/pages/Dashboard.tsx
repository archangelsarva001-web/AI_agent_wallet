import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CreditCard, Zap, Plus, Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { ToolCard } from "@/components/ToolCard";
import { ToolDialog } from "@/components/ToolDialog";
import { CreditPurchase } from "@/components/CreditPurchase";
import { SpotlightCard } from "@/components/SpotlightCard";

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  credit_cost: number;
  input_fields: any;
  icon_url: string;
  webhook_url: string | null;
}

const categories = [
  "All", "Text Processing", "Image Generation", "Language Processing",
  "Development", "Marketing", "Communication", "Sales"
];

export default function Dashboard() {
  const { user, session, credits, subscription, refreshCredits, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState<AITool[]>([]);
  const [filteredTools, setFilteredTools] = useState<AITool[]>([]);
  const [featuredTools, setFeaturedTools] = useState<AITool[]>([]);
  const [comingSoonTools, setComingSoonTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !loading) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchTools();
    if (user) {
      fetchUserRole();
      setTimeout(() => { refreshCredits(); }, 200);
    }
  }, [user]);

  useEffect(() => {
    filterTools();
    separateToolsByWebhook();
  }, [tools, searchTerm, selectedCategory]);

  const fetchUserRole = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase.rpc as any)("get_user_role", { _user_id: user.id });
      if (error) { console.error("Error fetching user role:", error); return; }
      setUserRole(data || "user");
    } catch (error) { console.error("Error in fetchUserRole:", error); }
  };

  const fetchTools = async () => {
    try {
      const { data, error } = await (supabase
        .from as any)("ai_tools")
        .select("id, name, description, category, credit_cost, input_fields, icon_url, webhook_url")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast({ title: "Error loading tools", description: "Please try refreshing the page", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const separateToolsByWebhook = () => {
    setFeaturedTools(tools.filter(tool => tool.webhook_url));
    setComingSoonTools(tools.filter(tool => !tool.webhook_url));
  };

  const filterTools = () => {
    let filtered = tools;
    if (searchTerm) filtered = filtered.filter(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || tool.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCategory !== "All") filtered = filtered.filter(tool => tool.category === selectedCategory);
    setFilteredTools(filtered);
  };

  const handleSubscribe = async () => {
    if (!user || !session) return;
    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error("Subscription error:", error);
      toast({ title: "Subscription failed", description: "Please try again or contact support", variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) return;
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error("Portal error:", error);
      toast({ title: "Unable to open portal", description: "Please try again later", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center"><p className="text-muted-foreground">Please sign in to access the dashboard</p></div>
        </div>
      </div>
    );
  }

  const renderToolGrid = (toolsList: AITool[], isComingSoon = false) => (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
      {toolsList.map((tool, index) => (
        <div
          key={tool.id}
          className="break-inside-avoid mb-6 animate-fade-in-up"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {isComingSoon ? (
            <div className="relative">
              <div className="opacity-50 pointer-events-none">
                <ToolCard tool={tool} credits={credits} onUse={() => {}} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-white/10">Coming Soon</Badge>
              </div>
            </div>
          ) : (
            <ToolCard tool={tool} credits={credits} onUse={() => setSelectedTool(tool)} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container px-4 py-8">
        {/* Welcome + Account Status */}
        <section className="mb-8 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.user_metadata?.full_name || "there"}!</h1>
              <p className="text-muted-foreground">Choose from {tools.length} powerful AI tools to supercharge your workflow</p>
            </div>
            <SpotlightCard className="lg:w-80">
              <Card className="hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Account Status</CardTitle>
                    <Button onClick={() => refreshCredits()} variant="ghost" size="sm" className="h-8 w-8 p-0"><Zap className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Credits</span>
                    <Badge variant={credits >= 999999 ? "secondary" : credits > 10 ? "default" : "destructive"}>
                      <span className="font-mono">{credits >= 999999 ? "∞ Unlimited" : `${credits} available`}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Subscription</span>
                    <Badge variant={subscription.subscribed ? "default" : "secondary"}>{subscription.subscribed ? "Pro" : "Free"}</Badge>
                  </div>
                  {!subscription.subscribed ? (
                    <Button onClick={handleSubscribe} variant="hero" size="sm" className="w-full" disabled={isSubscribing}>
                      {isSubscribing ? (<><Loader2 className="mr-2 h-3 w-3 animate-spin" />Starting...</>) : (<><Plus className="mr-2 h-3 w-3" />Upgrade to Pro</>)}
                    </Button>
                  ) : (
                    <Button onClick={handleManageSubscription} variant="outline" size="sm" className="w-full">
                      <CreditCard className="mr-2 h-3 w-3" />Manage Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            </SpotlightCard>
          </div>
        </section>

        <CreditPurchase show={userRole === "user" && credits < 3} />

        {/* Omnibar Search */}
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search AI tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 text-lg rounded-2xl bg-card/40 backdrop-blur-xl border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex gap-2 overflow-x-auto justify-center pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap rounded-full px-4"
              >
                {category}
              </Button>
            ))}
          </div>
        </section>

        {/* Tools Grid */}
        {searchTerm || selectedCategory !== "All" ? (
          <section>
            {filteredTools.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <CardTitle className="mb-2">No tools found</CardTitle>
                  <CardDescription>Try adjusting your search or filter criteria</CardDescription>
                </CardContent>
              </Card>
            ) : (
              renderToolGrid(filteredTools)
            )}
          </section>
        ) : (
          <>
            {featuredTools.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  <Zap className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Featured Tools</h2>
                  <Badge variant="default">Live</Badge>
                </div>
                {renderToolGrid(featuredTools)}
              </section>
            )}
            {comingSoonTools.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">Coming Soon</h2>
                  <Badge variant="secondary">In Development</Badge>
                </div>
                {renderToolGrid(comingSoonTools, true)}
              </section>
            )}
          </>
        )}
      </main>
      {selectedTool && (
        <ToolDialog tool={selectedTool} isOpen={!!selectedTool} onClose={() => setSelectedTool(null)} credits={credits} onCreditsUpdate={refreshCredits} />
      )}
    </div>
  );
}
