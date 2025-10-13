// Update this page (the content is just a fallback if you fail to update the page)

import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      
      {/* Footer */}
      <footer className="bg-muted/30 py-12 mt-24">
        <div className="container px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary">
                <span className="text-white font-bold">AH</span>
              </div>
              <span className="text-xl font-bold">AutoHub</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Supercharge your workflow with powerful AI tools
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 AutoHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
