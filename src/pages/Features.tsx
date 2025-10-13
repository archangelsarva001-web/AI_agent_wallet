import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Code2, Webhook, Database, Shield, Zap } from "lucide-react";

const Features = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Powerful Features for <span className="text-gradient">Modern Workflows</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Everything you need to build, deploy, and scale your AI-powered applications with confidence.
              </p>
              <Link to="/auth">
                <Button size="lg" className="gradient-primary hover:shadow-glow">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Features Grid */}
        <FeaturesSection />

        {/* Detailed Feature Sections */}
        <section className="py-24">
          <div className="container px-4">
            <div className="max-w-6xl mx-auto space-y-24">
              
              {/* API & Integrations */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Code2 className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold">Developer-Friendly API</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    Integrate AutoHub into your existing workflows with our comprehensive REST API. 
                    Full documentation, code examples, and SDKs available.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>RESTful API with OpenAPI specification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Client libraries for popular languages</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Rate limiting and usage monitoring</span>
                    </li>
                  </ul>
                </div>
                <div className="gradient-card p-8 rounded-xl border shadow-medium">
                  <pre className="text-sm overflow-x-auto">
                    <code>{`// Example API call
fetch('https://api.autohub.com/v1/tools', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'text-analysis',
    input: 'Your text here'
  })
})`}</code>
                  </pre>
                </div>
              </div>

              {/* Webhooks */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 gradient-card p-8 rounded-xl border shadow-medium">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
                      <Webhook className="h-5 w-5 text-primary" />
                      <span className="font-mono text-sm">tool.created</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
                      <Webhook className="h-5 w-5 text-primary" />
                      <span className="font-mono text-sm">tool.completed</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
                      <Webhook className="h-5 w-5 text-primary" />
                      <span className="font-mono text-sm">payment.succeeded</span>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Webhook className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold">Real-Time Webhooks</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    Get instant notifications about important events. Build reactive 
                    applications that respond to changes in real-time.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Secure webhook endpoints with signature verification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Automatic retry logic for failed deliveries</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Detailed event logs and debugging tools</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Security */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold">Enterprise-Grade Security</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    Your data security is our top priority. We implement industry-leading 
                    security practices to protect your information.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>End-to-end encryption for all data transfers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>SOC 2 Type II compliant infrastructure</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Role-based access control (RBAC)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Regular security audits and penetration testing</span>
                    </li>
                  </ul>
                </div>
                <div className="gradient-card p-8 rounded-xl border shadow-medium">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <span className="font-semibold">Data Encryption</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <span className="font-semibold">2FA Authentication</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <span className="font-semibold">SOC 2 Compliance</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <span className="font-semibold">GDPR Ready</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 gradient-card p-8 rounded-xl border shadow-medium text-center">
                  <div className="space-y-6">
                    <div>
                      <div className="text-5xl font-bold text-gradient mb-2">99.9%</div>
                      <div className="text-muted-foreground">Uptime SLA</div>
                    </div>
                    <div>
                      <div className="text-5xl font-bold text-gradient mb-2">&lt;100ms</div>
                      <div className="text-muted-foreground">Average Response Time</div>
                    </div>
                    <div>
                      <div className="text-5xl font-bold text-gradient mb-2">50+</div>
                      <div className="text-muted-foreground">Global Data Centers</div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold">Lightning-Fast Performance</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    Built on cutting-edge infrastructure to deliver exceptional speed 
                    and reliability, no matter where your users are located.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Global CDN for low-latency access worldwide</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Intelligent caching and optimization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span>Auto-scaling to handle traffic spikes</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of developers and businesses already using AutoHub
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="gradient-primary hover:shadow-glow">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/#pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
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
