import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Users } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="AI Tools Hub"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 gradient-subtle" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 py-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border backdrop-blur-sm mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Access 50+ AI Tools in One Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-gradient">Supercharge</span> Your Workflow
            <br />
            with AI Tools
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Access a curated collection of powerful AI tools for content creation,
            code review, translation, and more. Pay per use with transparent credit
            system.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button asChild variant="hero" size="lg" className="text-lg px-8 py-6">
              <Link to="/auth">
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/auth">View All Tools</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm text-muted-foreground">AI Tools</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/5 animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-primary/5 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-20 w-16 h-16 rounded-full bg-primary/5 animate-float" style={{ animationDelay: "4s" }} />
    </section>
  );
};