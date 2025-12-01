import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Volume2, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageInputProps {
  translate: boolean;
  userId: string;
  onProcessed: () => void;
}

const ImageInput = ({ translate, userId, onProcessed }: ImageInputProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!imagePreview) {
      toast({
        title: "No image",
        description: "Please select an image first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Process image with AI
      const { data: imageData, error: imageError } = await supabase.functions.invoke('process-image', {
        body: { imageData: imagePreview, language: translate ? 'nl' : 'en' },
      });

      if (imageError) throw imageError;

      let description = imageData.description;

      // Translate if needed
      if (translate) {
        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-text', {
          body: { text: description },
        });

        if (translateError) {
          console.error('Translation error:', translateError);
          toast({
            title: "Translation failed",
            description: "Proceeding with original text",
          });
        } else {
          description = translateData.translatedText;
        }
      }

      // Generate speech with OpenAI TTS
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: description, voice: 'alloy' },
      });

      if (ttsError) throw ttsError;

      // Play the audio
      const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
      audio.play();

      // Save to history
      await supabase.from('history').insert({
        user_id: userId,
        input_type: 'image',
        input_content: imagePreview,
        output_text: description,
        language: translate ? 'nl' : 'en',
      });

      toast({
        title: "Processing complete",
        description: "Image description is now playing",
      });

      onProcessed();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process image",
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
          <Image className="h-6 w-6" />
          Image Input
        </CardTitle>
        <CardDescription className="text-base">
          Upload an image to hear its description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Selected image preview"
              className="max-h-[300px] mx-auto rounded-lg"
            />
          ) : (
            <div className="space-y-4">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                No image selected
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="image-upload"
          aria-label="Upload image file"
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            className="text-lg h-12"
            size="lg"
          >
            <Upload className="mr-2 h-5 w-5" />
            Choose Image
          </Button>

          <Button
            onClick={handleProcess}
            disabled={loading || !imagePreview}
            className="text-lg h-12"
            size="lg"
            variant="prominent"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-5 w-5" />
                Describe
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageInput;
