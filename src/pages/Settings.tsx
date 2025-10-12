import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRoleManager } from "@/components/UserRoleManager";
import { ToolCreationForm } from "@/components/ToolCreationForm";
import { ToolApprovalManager } from "@/components/ToolApprovalManager";
import { ToolManagement } from "@/components/ToolManagement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, User, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const activeTab = searchParams.get("tab") || "profile";

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: adminCheck } = await supabase.rpc('is_admin', {
          _user_id: user.id
        });
        setIsAdmin(adminCheck || false);

        // Get user role
        const { data: role } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });
        setUserRole(role);
        setIsModerator(role === 'moderator');
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user permissions"
        });
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, toast]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      case 'user': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'moderator': return <SettingsIcon className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "profile": return "Profile Settings";
      case "users": return "User Management";
      case "tools": return "Tool Development";
      case "approvals": return "Tool Approvals";
      case "manage": return "Manage Tools";
      default: return "Settings";
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case "profile": return "Manage your personal profile information";
      case "users": return "Manage user roles and permissions";
      case "tools": return "Create and manage custom AI tools";
      case "approvals": return "Review and approve pending AI tools";
      case "manage": return "Activate, deactivate, or delete existing tools";
      default: return "Manage your account and system settings";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{getPageTitle()}</h1>
            <p className="text-muted-foreground">{getPageDescription()}</p>
          </div>

          <div className="space-y-6">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-lg">{user.user_metadata?.full_name || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div className="mt-1">
                      {userRole && (
                        <Badge variant={getRoleBadgeVariant(userRole)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(userRole)}
                          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                    <p className="text-lg">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "users" && isAdmin && (
              <UserRoleManager />
            )}

            {activeTab === "tools" && (isAdmin || isModerator) && (
              <ToolCreationForm />
            )}

            {activeTab === "approvals" && isAdmin && (
              <ToolApprovalManager />
            )}

            {activeTab === "manage" && (isAdmin || isModerator) && (
              <ToolManagement />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;