import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Zap } from "lucide-react";

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  cost_per_use: number;
  input_schema: any;
  icon_url: string;
}

interface ToolCardProps {
  tool: AITool;
  credits: number;
  onUse: () => void;
}

export const ToolCard = ({ tool, credits, onUse }: ToolCardProps) => {
  const canAfford = credits >= tool.cost_per_use;

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 gradient-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl">{tool.icon_url}</div>
          <Badge variant="secondary" className="text-xs">
            {tool.cost_per_use} credit{tool.cost_per_use !== 1 ? "s" : ""}
          </Badge>
        </div>
        <CardTitle className="text-lg">{tool.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tool.description}
        </p>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {tool.category}
          </Badge>
          
          <Button
            onClick={onUse}
            size="sm"
            variant={canAfford ? "default" : "secondary"}
            disabled={!canAfford}
            className="group-hover:shadow-glow transition-all duration-300"
          >
            {canAfford ? (
              <>
                <Play className="mr-1 h-3 w-3" />
                Use Tool
              </>
            ) : (
              <>
                <Zap className="mr-1 h-3 w-3" />
                Need Credits
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};