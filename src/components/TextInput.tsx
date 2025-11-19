import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TextInputProps {
  language: string;
  userId: string;
  onProcessed: () => void;
}

const TextInput = ({ language, userId, onProcessed }: TextInputProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!text.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some text to process",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Process text with AI
      const { data, error } = await supabase.functions.invoke('process-text', {
        body: { text, language },
      });

      if (error) throw error;

      // Convert to speech
      const utterance = new SpeechSynthesisUtterance(data.processedText);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);

      // Save to history
      await supabase.from('history').insert({
        user_id: userId,
        input_type: 'text',
        input_content: text,
        output_text: data.processedText,
        language,
      });

      toast({
        title: "Processing complete",
        description: "Audio is now playing",
      });

      onProcessed();
      setText("");
    } catch (error: any) {
      console.error('Error processing text:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process text",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Volume2 className="h-6 w-6" />
          Text Input
        </CardTitle>
        <CardDescription className="text-base">
          Enter text to hear it as audio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Type or paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] text-lg resize-none"
          aria-label="Text input for audio conversion"
        />
        <Button
          onClick={handleProcess}
          disabled={loading || !text.trim()}
          className="w-full text-lg h-12"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Volume2 className="mr-2 h-5 w-5" />
              Generate Audio
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TextInput;
