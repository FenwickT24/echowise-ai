import { useState, useEffect, useRef } from 'react';
import { pipeline } from '@huggingface/transformers';

export const useTranslation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const translatorRef = useRef<any>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        // Load the custom model from the trained_en_nl_model directory
        translatorRef.current = await pipeline(
          'translation',
          '/trained_en_nl_model/'
        );
        setIsModelReady(true);
      } catch (error) {
        console.error('Error loading translation model:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  const translate = async (text: string): Promise<string> => {
    if (!translatorRef.current) {
      throw new Error('Translation model not loaded');
    }

    try {
      const result = await translatorRef.current(text);
      return result[0]?.translation_text || text;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  };

  return { translate, isLoading, isModelReady };
};
