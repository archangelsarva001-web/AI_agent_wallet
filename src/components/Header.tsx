import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Menu, X, Zap, Settings, User, Users, Code } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  user?: any;
}

export const Header = ({ user }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsModerator(false);
        return;
      }

      try {
        const { data: adminCheck } = await supabase.rpc('is_admin', {
          _user_id: user.id
        });
        setIsAdmin(adminCheck || false);

        const { data: role } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });
        setIsModerator(role === 'moderator');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsModerator(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
      toast({
        title: "Signed out successfully",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">AutoHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/usage"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Usage
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1 outline-none">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/settings?tab=profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/settings?tab=users" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        User Management
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(isAdmin || isModerator) && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/settings?tab=tools" className="flex items-center gap-2 cursor-pointer">
                          <Code className="h-4 w-4" />
                          Tool Dev
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings?tab=manage" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Manage Tools
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings?tab=approvals" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Tool Approvals
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                to="/auth"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container px-4 py-4 space-y-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/usage"
                  className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Usage
                </Link>
                <div className="space-y-2">
                  <Link
                    to="/settings?tab=profile"
                    className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2 pl-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/settings?tab=users"
                      className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2 pl-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      User Management
                    </Link>
                  )}
                  {(isAdmin || isModerator) && (
                    <>
                      <Link
                        to="/settings?tab=tools"
                        className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2 pl-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Code className="h-4 w-4" />
                        Tool Dev
                      </Link>
                      <Link
                        to="/settings?tab=manage"
                        className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2 pl-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Manage Tools
                      </Link>
                      <Link
                        to="/settings?tab=approvals"
                        className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2 pl-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Tool Approvals
                      </Link>
                    </>
                  )}
                </div>
                <Button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/features"
                  className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/auth"
                  className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};