import { 
  Bot, 
  Code, 
  Globe, 
  Image, 
  MessageSquare, 
  TrendingUp,
  Shield,
  Zap,
  CreditCard
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Tools",
    description: "Access cutting-edge AI models for text processing, code review, and creative tasks."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get results in seconds with our optimized infrastructure and caching system."
  },
  {
    icon: CreditCard,
    title: "Pay Per Use",
    description: "Transparent credit system - only pay for what you use with no hidden fees."
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "API access, webhooks, and integrations for seamless workflow automation."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption and data privacy protection."
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "99.9% uptime with worldwide CDN for consistent performance anywhere."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="text-gradient">Scale</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade AI tools with enterprise features, designed for teams 
            and individuals who demand the best.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl gradient-card border shadow-subtle hover:shadow-medium transition-all duration-300 ease-smooth hover:-translate-y-1"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg gradient-primary mb-6 group-hover:shadow-glow transition-all duration-300">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};