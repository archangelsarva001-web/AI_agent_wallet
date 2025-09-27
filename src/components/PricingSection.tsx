import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const pricingFeatures = [
  "Access to all 50+ AI tools",
  "500 credits per month included",
  "Priority processing",
  "API access & webhooks",
  "24/7 email support",
  "Usage analytics & insights",
  "No setup fees",
  "Cancel anytime"
];

export const PricingSection = () => {
  return (
    <section className="py-24">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One plan, all features included. Start with 500 credits monthly and 
            add more as you scale.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>

            <div className="p-8 rounded-2xl gradient-card border-2 border-primary/20 shadow-large">
              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Includes 500 credits • Additional credits $0.02 each
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {pricingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button asChild variant="hero" size="lg" className="w-full">
                <Link to="/auth">
                  Start Free Trial
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                7-day free trial • No credit card required
              </p>
            </div>
          </div>
        </div>

        {/* Credit Usage Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-2">1-2</div>
              <div className="text-sm font-medium mb-1">Credits</div>
              <div className="text-xs text-muted-foreground">
                Text processing, translation, email generation
              </div>
            </div>
            <div className="p-6 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-2">3-5</div>
              <div className="text-sm font-medium mb-1">Credits</div>
              <div className="text-xs text-muted-foreground">
                Code review, SEO optimization, complex analysis
              </div>
            </div>
            <div className="p-6 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-2">5-10</div>
              <div className="text-sm font-medium mb-1">Credits</div>
              <div className="text-xs text-muted-foreground">
                Image generation, advanced AI models
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};