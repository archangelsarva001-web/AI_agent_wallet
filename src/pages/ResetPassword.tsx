import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Phase = "verifying" | "form" | "error";

export default function ResetPassword() {
  const [phase, setPhase] = useState<Phase>("verifying");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const waitForSession = async (intervalMs = 50, maxTries = 200) => {
      for (let i = 0; i < maxTries; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) return true;
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPhase("form");
        window.history.replaceState(null, "", "/reset");
      }
    });

    const verifyFromUrl = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.slice(1));
      const qs = url.searchParams;

      const hashType = hash.get("type");
      const hashToken = hash.get("access_token");
      const searchType = qs.get("type");
      const tokenHash = qs.get("token_hash");
      const code = qs.get("code");

      try {
        // #access_token=...&type=recovery (standard Supabase ActionLink)
        if (hashType === "recovery" && hashToken) {
          const ok = await waitForSession();
          if (!ok) throw new Error("session_timeout");
          setPhase("form");
          window.history.replaceState(null, "", "/reset");
          return;
        }

        // ?token_hash=...&type=recovery (alt template style)
        if (searchType === "recovery" && tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          if (error) throw error;
          setPhase("form");
          window.history.replaceState(null, "", "/reset");
          return;
        }

        // ?code=...&type=recovery (SSO-style link)
        if (searchType === "recovery" && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setPhase("form");
          window.history.replaceState(null, "", "/reset");
          return;
        }

        // No recognizable tokens
        setPhase("error");
      } catch (e) {
        setPhase("error");
      }
    };

    verifyFromUrl();
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords don't match", description: "Please confirm your password", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Ensure we still have a valid session for update
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setLoading(false);
      setPhase("error");
      toast({ title: "Session expired", description: "Request a new reset link", variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated!", description: "You can now sign in with your new password." });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Card className="gradient-card shadow-large border-primary/10">
          <CardHeader className="text-center">
            <CardTitle>{phase === "form" ? "Set New Password" : "Reset Password"}</CardTitle>
            <CardDescription>
              {phase === "verifying" ? "Verifying your reset link…" :
               phase === "error" ? "This link is invalid or has expired." :
               "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phase === "verifying" && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {phase === "error" && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  The password reset link is invalid or expired. Please request a new one.
                </p>
                <Button variant="default" className="w-full" asChild>
                  <Link to="/auth">Back to Sign In</Link>
                </Button>
              </div>
            )}

            {phase === "form" && (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} 
                    minLength={6} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input 
                    id="confirm" 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link to="/auth">Cancel</Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
