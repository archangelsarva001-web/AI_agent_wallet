import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('is_admin', {
      _user_id: user.id
    });

    if (roleError || !isAdmin) {
      console.error("Authorization check failed:", { userId: user.id, isAdmin, roleError });
      return new Response(JSON.stringify({ 
        error: "Unauthorized: Admin access required" 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { action, userId, data: userData } = await req.json();

    console.log("Admin operation:", { action, targetUserId: userId, adminUserId: user.id });

    // Handle different actions
    switch (action) {
      case 'create': {
        const { email, password, full_name, role } = userData;
        
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        // Create user account
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: full_name || null
          }
        });

        if (createError) throw createError;

        // Assign role if user was created successfully
        if (newUser.user && role) {
          const { error: roleError } = await supabaseClient.rpc('update_user_role', {
            _target_user_id: newUser.user.id,
            _new_role: role
          });

          if (roleError) {
            console.error("Failed to assign role:", roleError);
            throw new Error("User created but failed to assign role");
          }
        }

        // Log the action
        await supabaseClient.from('audit_logs').insert({
          user_id: user.id,
          action: 'admin_create_user',
          resource_type: 'users',
          resource_id: newUser.user?.id,
          new_values: { email, role }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          user: newUser.user 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'delete': {
        if (!userId) {
          throw new Error("User ID is required");
        }

        // Delete user account
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

        if (deleteError) throw deleteError;

        // Log the action
        await supabaseClient.from('audit_logs').insert({
          user_id: user.id,
          action: 'admin_delete_user',
          resource_type: 'users',
          resource_id: userId
        });

        return new Response(JSON.stringify({ 
          success: true 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        return new Response(JSON.stringify({ 
          error: "Invalid action. Supported actions: create, delete" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin operation error:", errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});
