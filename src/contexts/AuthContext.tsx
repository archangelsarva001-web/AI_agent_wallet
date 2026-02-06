import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  credits: number;
  subscription: {
    subscribed: boolean;
    product_id?: string;
    subscription_end?: string;
  };
  refreshCredits: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState({
    subscribed: false,
    product_id: undefined,
    subscription_end: undefined,
  });
  const { toast } = useToast();

  const refreshCredits = async () => {
    if (!user) return;
    
    try {
      console.log('Refreshing credits for user:', user.id);
      
      const { data, error } = await (supabase.rpc as any)("get_user_credits", { _user_id: user.id });
      
      console.log('Credits response:', { data, error });
      
      if (error) {
        console.error("Error fetching credits:", error);
        return;
      }
      
      console.log('Setting credits to:', data);
      setCredits(data || 0);
    } catch (error) {
      console.error("Error in refreshCredits:", error);
    }
  };

  const refreshSubscription = async () => {
    if (!user || !session) return;
    
    try {
      const { data: userData, error: userError } = await (supabase
        .from as any)('users')
        .select('is_subscribed')
        .eq('id', user.id)
        .single();
      
      if (userError && userError.code !== "PGRST116") {
        console.error("Error fetching user subscription status:", userError);
        return;
      }
      
      if (userData?.is_subscribed) {
        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (error) {
          console.error("Error checking Stripe subscription:", error);
          setSubscription({ 
            subscribed: true,
            product_id: undefined,
            subscription_end: undefined 
          });
          return;
        }
        
        setSubscription({
          subscribed: data.subscribed || false,
          product_id: data.product_id,
          subscription_end: data.subscription_end,
        });
      } else {
        setSubscription({
          subscribed: false,
          product_id: undefined,
          subscription_end: undefined,
        });
      }
    } catch (error) {
      console.error("Error in refreshSubscription:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            console.log('Auth state changed, refreshing credits');
            refreshCredits();
            refreshSubscription();
          }, 100);
        } else {
          setCredits(0);
          setSubscription({
            subscribed: false,
            product_id: undefined,
            subscription_end: undefined,
          });
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          console.log('Initial session found, refreshing credits');
          refreshCredits();
          refreshSubscription();
        }, 100);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !session) return;
    
    const interval = setInterval(() => {
      refreshSubscription();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user, session]);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    credits,
    subscription,
    refreshCredits,
    refreshSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
