import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface TextInputProps {
  translate: boolean;
  userId: string;
  onProcessed: () => void;
}

const TextInput = ({ translate, userId, onProcessed }: TextInputProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { translate: translateText, isModelReady } = useTranslation();

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
      let processedText = text;

      // Translate if enabled
      if (translate) {
        if (!isModelReady) {
          toast({
            title: "Model loading",
            description: "Translation model is still loading, please wait...",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        processedText = await translateText(text);
      }

      // Generate speech with OpenAI TTS
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: processedText, voice: 'alloy' },
      });

      if (ttsError) throw ttsError;

      // Play the audio
      const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
      audio.play();

      // Save to history
      await supabase.from('history').insert({
        user_id: userId,
        input_type: 'text',
        input_content: text,
        output_text: processedText,
        language: translate ? 'nl' : 'en',
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
