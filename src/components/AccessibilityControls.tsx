import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface AccessibilityControlsProps {
  onTranslateChange: (translate: boolean) => void;
  translate: boolean;
}

const AccessibilityControls = ({ onTranslateChange, translate }: AccessibilityControlsProps) => {
  const [scale, setScale] = useState([100]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale[0]}%`;
  }, [scale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Accessibility Settings</CardTitle>
        <CardDescription className="text-base">
          Customize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="translate" className="text-lg">
            Translate to Dutch
          </Label>
          <Switch
            id="translate"
            checked={translate}
            onCheckedChange={onTranslateChange}
          />
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
