import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  CreditCard, 
  Zap, 
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { ToolCard } from "@/components/ToolCard";
import { ToolDialog } from "@/components/ToolDialog";

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  cost_per_use: number;
  input_schema: any;
  icon_url: string;
}

const categories = [
  "All",
  "Text Processing", 
  "Image Generation", 
  "Language Processing", 
  "Development", 
  "Marketing", 
  "Communication"
];

export default function Dashboard() {
  const { user, session, credits, subscription, refreshCredits, refreshSubscription } = useAuth();
  const [tools, setTools] = useState<AITool[]>([]);
  const [filteredTools, setFilteredTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, searchTerm, selectedCategory]);

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_tools")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast({
        title: "Error loading tools",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTools = () => {
    let filtered = tools;
    
    if (searchTerm) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== "All") {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }
    
    setFilteredTools(filtered);
  };

  const handleSubscribe = async () => {
    if (!user || !session) return;
    
    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Unable to open portal",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.user_metadata?.full_name || "there"}!
              </h1>
              <p className="text-muted-foreground">
                Choose from {tools.length} powerful AI tools to supercharge your workflow
              </p>
            </div>
            
            {/* Credits & Subscription Card */}
            <Card className="lg:w-80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Account Status</CardTitle>
                  <Button
                    onClick={refreshCredits}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Credits</span>
                  <Badge variant={credits > 10 ? "default" : "destructive"}>
                    {credits} available
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Subscription</span>
                  <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                    {subscription.subscribed ? "Pro" : "Free"}
                  </Badge>
                </div>
                
                {!subscription.subscribed ? (
                  <Button 
                    onClick={handleSubscribe}
                    variant="hero" 
                    size="sm" 
                    className="w-full"
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-3 w-3" />
                        Upgrade to Pro
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleManageSubscription}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <CreditCard className="mr-2 h-3 w-3" />
                    Manage Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search AI tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  <Filter className="mr-1 h-3 w-3" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section>
          {filteredTools.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No tools found</CardTitle>
                <CardDescription>
                  Try adjusting your search or filter criteria
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  credits={credits}
                  onUse={() => setSelectedTool(tool)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Tool Dialog */}
      {selectedTool && (
        <ToolDialog
          tool={selectedTool}
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          credits={credits}
          onCreditsUpdate={refreshCredits}
        />
      )}
    </div>
  );
}