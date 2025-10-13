import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { FeaturesSection } from "@/components/FeaturesSection";

const Features = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main>
        <FeaturesSection />
      </main>
      
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

export default Features;
