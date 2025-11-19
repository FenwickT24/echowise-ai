import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import AccessibilityControls from "@/components/AccessibilityControls";
import TextInput from "@/components/TextInput";
import ImageInput from "@/components/ImageInput";
import History from "@/components/History";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [language, setLanguage] = useState("en");
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  const handleProcessed = () => {
    setRefreshHistory((prev) => prev + 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Vision AI Assistant</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-lg h-12"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AccessibilityControls
              language={language}
              onLanguageChange={setLanguage}
            />

            <TextInput
              language={language}
              userId={user.id}
              onProcessed={handleProcessed}
            />

            <ImageInput
              language={language}
              userId={user.id}
              onProcessed={handleProcessed}
            />
          </div>

          <div>
            <History userId={user.id} refresh={refreshHistory} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
