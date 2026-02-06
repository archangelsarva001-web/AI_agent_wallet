import { useRef, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Zap } from "lucide-react";

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  credit_cost: number;
  input_fields: any;
  icon_url: string;
}

interface ToolCardProps {
  tool: AITool;
  credits: number;
  onUse: () => void;
}

export const ToolCard = ({ tool, credits, onUse }: ToolCardProps) => {
  const canAfford = credits >= tool.credit_cost;
  const ref = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <Card className="group bg-noise hover:shadow-glow transition-all duration-300 hover:-translate-y-1 overflow-hidden relative border border-white/5 hover:border-primary/50">
        {/* Spotlight overlay */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: isHovered
              ? `radial-gradient(circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(255,255,255,0.06), transparent 80%)`
              : "none",
            opacity: isHovered ? 1 : 0,
          }}
        />
        <CardHeader className="pb-3 relative z-20">
          <div className="flex items-center justify-between">
            <div className="text-2xl transition-transform duration-300 group-hover:scale-110">{tool.icon_url}</div>
            <Badge variant="secondary" className="text-xs font-mono">
              {tool.credit_cost} credit{tool.credit_cost !== 1 ? "s" : ""}
            </Badge>
          </div>
          <CardTitle className="text-lg">{tool.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 relative z-20">
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
              className={canAfford
                ? "transition-all duration-300 shadow-[0_0_15px_hsl(var(--primary)/0.5),0_0_30px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.6),0_0_40px_hsl(var(--primary)/0.3)] [text-shadow:0_0_10px_hsl(var(--primary)/0.5)]"
                : "transition-all duration-300"
              }
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
    </div>
  );
};
