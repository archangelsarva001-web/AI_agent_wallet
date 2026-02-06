import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isPrivateIP(ip: string): boolean {
  // IPv4 private/reserved ranges
  if (/^127\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^0\./.test(ip)) return true;
  if (ip === "0.0.0.0") return true;

  // IPv6 private/reserved
  if (ip === "::1" || ip === "::") return true;
  if (/^fe80:/i.test(ip)) return true;  // link-local
  if (/^fc00:/i.test(ip)) return true;  // unique local
  if (/^fd/i.test(ip)) return true;     // unique local
  if (/^ff/i.test(ip)) return true;     // multicast

  return false;
}

function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Webhook URL must use HTTPS" };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block obvious internal hostnames
    const blockedHosts = [
      "localhost", "127.0.0.1", "0.0.0.0", "[::1]",
      "metadata.google.internal", "metadata.goog",
      "169.254.169.254",
    ];
    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: "Blocked destination" };
    }

    if (hostname.endsWith(".internal") || hostname.endsWith(".local") || hostname.endsWith(".localhost")) {
      return { valid: false, error: "Internal network addresses are not allowed" };
    }

    // Check if hostname is an IP and validate it
    // IPv4 pattern
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      if (isPrivateIP(hostname)) {
        return { valid: false, error: "Private IP addresses are not allowed" };
      }
    }

    // IPv6 in brackets
    if (hostname.startsWith("[") && hostname.endsWith("]")) {
      const ipv6 = hostname.slice(1, -1);
      if (isPrivateIP(ipv6)) {
        return { valid: false, error: "Private IPv6 addresses are not allowed" };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { webhook_url, tool_name, input_data } = await req.json();

    if (!webhook_url || typeof webhook_url !== "string") {
      return new Response(JSON.stringify({ error: "Missing webhook URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side URL validation
    const validation = validateWebhookUrl(webhook_url);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve DNS and check resolved IP before fetching
    try {
      const urlObj = new URL(webhook_url);
      const hostname = urlObj.hostname;

      // Only do DNS check for non-IP hostnames
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) && !hostname.startsWith("[")) {
        const addresses = await Deno.resolveDns(hostname, "A");
        for (const addr of addresses) {
          if (isPrivateIP(addr)) {
            console.error("DNS resolution blocked - private IP detected:", { hostname, resolved: addr });
            return new Response(JSON.stringify({ error: "Webhook destination resolves to a blocked address" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    } catch (dnsError) {
      console.error("DNS resolution failed:", dnsError);
      return new Response(JSON.stringify({ error: "Unable to resolve webhook destination" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Proxy the webhook call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const webhookBody = JSON.stringify({
      tool_name: tool_name || "",
      user_id: user.id,
      input_data: input_data || {},
      timestamp: new Date().toISOString(),
    });

    const response = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: webhookBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Webhook request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Proxy webhook error:", error);
    const message = error instanceof Error && error.name === "AbortError"
      ? "Webhook request timed out"
      : "Webhook execution failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
