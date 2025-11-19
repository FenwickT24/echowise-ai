import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Volume2, Image, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  input_type: string;
  input_content: string;
  output_text: string;
  language: string;
  created_at: string;
}

interface HistoryProps {
  userId: string;
  refresh: number;
}

const History = ({ userId, refresh }: HistoryProps) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId, refresh]);

  const playAudio = (text: string, language: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Item removed from history",
      });

      fetchHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-lg">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <HistoryIcon className="h-6 w-6" />
          Recent History
        </CardTitle>
        <CardDescription className="text-base">
          Your last 10 processed items
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg py-8">
            No history yet. Start by processing some text or images!
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {item.input_type === 'text' ? (
                      <FileText className="h-5 w-5 text-accent" />
                    ) : (
                      <Image className="h-5 w-5 text-accent" />
                    )}
                    <span className="font-semibold text-lg capitalize">
                      {item.input_type}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.id)}
                    aria-label="Delete history item"
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
                
                <p className="text-base text-muted-foreground line-clamp-2">
                  {item.output_text}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => playAudio(item.output_text, item.language)}
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    Play Again
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default History;
