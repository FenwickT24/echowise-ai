import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AccessibilityControlsProps {
  onLanguageChange: (language: string) => void;
  language: string;
}

const AccessibilityControls = ({ onLanguageChange, language }: AccessibilityControlsProps) => {
  const [scale, setScale] = useState([100]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale[0]}%`;
  }, [scale]);

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "nl", label: "Dutch" },
    { value: "pl", label: "Polish" },
    { value: "ru", label: "Russian" },
    { value: "ja", label: "Japanese" },
    { value: "zh", label: "Chinese" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Accessibility Settings</CardTitle>
        <CardDescription className="text-base">
          Customize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="language" className="text-lg">
            Audio Output Language
          </Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger id="language" className="text-lg h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} className="text-lg">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="scale" className="text-lg">
              Text & Layout Scale
            </Label>
            <span className="text-lg font-semibold text-accent">
              {scale[0]}%
            </span>
          </div>
          <Slider
            id="scale"
            min={75}
            max={200}
            step={25}
            value={scale}
            onValueChange={setScale}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Smaller</span>
            <span>Larger</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessibilityControls;
