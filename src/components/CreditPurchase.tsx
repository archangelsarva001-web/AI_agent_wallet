import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Zap, Loader2 } from "lucide-react";

interface CreditPurchaseProps {
  show: boolean;
}

export const CreditPurchase = ({ show }: CreditPurchaseProps) => {
  const [purchasing, setPurchasing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { session, refreshCredits } = useAuth();
  const { toast } = useToast();

  const handleVerifyPayment = async () => {
    if (!session) return;

    try {
      setVerifying(true);
      
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Credits added!",
          description: data.message,
        });
        await refreshCredits();
      } else {
        toast({
          title: "No recent payment found",
          description: "Complete your purchase first, then try verifying again.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Verification failed",
        description: "Unable to verify payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handlePurchaseCredits = async () => {
    if (!session) return;

    try {
      setPurchasing(true);
      
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to payment",
        description: "Complete your purchase in the new tab, then refresh your credits here.",
      });

    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast({
        title: "Purchase failed",
        description: "Unable to start credit purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRefreshCredits = async () => {
    await refreshCredits();
    toast({
      title: "Credits refreshed",
      description: "Your credit balance has been updated.",
    });
  };

  if (!show) return null;

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <CardTitle className="text-lg">Credits Required</CardTitle>
        </div>
        <CardDescription>
          You need credits to use AI tools. Purchase a credit pack to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-background p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold">100 Credits Pack</h4>
              <p className="text-sm text-muted-foreground">Perfect for regular users</p>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              $9.99
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            • Use any AI tool in our collection<br/>
            • Credits never expire<br/>
            • Instant activation
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePurchaseCredits}
            disabled={purchasing || verifying}
            className="flex-1"
          >
            {purchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Purchase Credits
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleVerifyPayment}
            disabled={purchasing || verifying}
            variant="outline"
            className="flex-1"
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Payment"
            )}
          </Button>
          <Button
            onClick={handleRefreshCredits}
            variant="outline"
            size="sm"
          >
            Refresh Credits
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};