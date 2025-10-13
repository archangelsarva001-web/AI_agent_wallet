import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get recent payment sessions for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }

    const customerId = customers.data[0].id;
    
    // Get recent successful payment sessions
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10,
    });

    // Find a recent successful payment session for credits
    const recentPayment = sessions.data.find((session: any) => 
      session.payment_status === 'paid' && 
      session.metadata?.credits_amount &&
      session.metadata?.user_id === user.id &&
      session.created > (Date.now() / 1000) - 3600 // Within last hour
    );

    if (!recentPayment) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No recent successful payment found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const creditsToAdd = parseInt(recentPayment.metadata.credits_amount);
    const sessionId = recentPayment.id;
    
    // Check if we already processed this payment (idempotency check)
    const { data: existingLog } = await supabaseClient
      .from('audit_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('action', 'credits_purchased')
      .contains('new_values', { stripe_session_id: sessionId })
      .single();

    if (existingLog) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get existing credits
    const { data: existingRecord } = await supabaseClient
      .from('credits')
      .select('current_credits, total_purchased, last_purchase_date')
      .eq('user_id', user.id)
      .single();

    // Add credits to user account
    const { error: updateError } = await supabaseClient
      .from('credits')
      .update({
        current_credits: (existingRecord?.current_credits || 0) + creditsToAdd,
        total_purchased: (existingRecord?.total_purchased || 0) + creditsToAdd,
        last_purchase_date: new Date().toISOString(),
        last_updated: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Log the purchase (this also serves as our idempotency record)
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'credits_purchased',
      resource_type: 'credits',
      resource_id: user.id,
      new_values: {
        credits_added: creditsToAdd,
        stripe_session_id: sessionId,
        amount_paid: recentPayment.amount_total
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      credits_added: creditsToAdd,
      message: `Successfully added ${creditsToAdd} credits to your account!`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});