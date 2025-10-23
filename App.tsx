

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Part, Type as GenAiType } from '@google/genai';
import { InitialPrompt } from './components/InitialPrompt';
import { Editor } from './components/Editor';
import { Loader } from './components/Loader';
import type { DocumentParagraph, AiAction, Suggestion } from './types';
import { fileToGenerativePart } from './services/geminiService';

const App: React.FC = () => {
  const [documentContent, setDocumentContent] = useState<DocumentParagraph[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showInitialPrompt, setShowInitialPrompt] = useState<boolean>(true);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<Map<string, Suggestion[]>>(new Map());

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const handleInitialGeneration = async (prompt: string, files: File[]) => {
    setIsLoading(true);
    setLoadingMessage('Generating your draft...');
    setError(null);
    try {
      const fileParts = await Promise.all(files.map(fileToGenerativePart));
      const allParts: Part[] = [{ text: `Prompt: ${prompt}\n\nTask: Based on the prompt and any provided files, write a thoughtful and well-structured document. Respond only with the content of the document.` }, ...fileParts];
      
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: { parts: allParts },
      });

      const text = response.text;
      const paragraphs = text.split('\n').filter(p => p.trim() !== '').map(p => ({
        id: crypto.randomUUID(),
        text: p,
      }));
      setDocumentContent(paragraphs);
      setShowInitialPrompt(false);
    } catch (e) {
      console.error(e);
      setError('Failed to generate document. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleAiAction = useCallback(async (action: AiAction, text: string, instruction: string, paragraphId: string) => {
    setIsLoading(true);
    setLoadingMessage('Rethinking...');
    setError(null);

    const prompt = `${instruction}: "${text}"`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const newText = response.text;
        setDocumentContent(prev => prev.map(p => {
            if (p.id === paragraphId) {
                const updatedText = p.text.replace(text, newText);
                return { ...p, text: updatedText };
            }
            return p;
        }));

    } catch (e) {
        console.error(e);
        setError('An error occurred while performing the AI action.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [ai.models]);

  const updateParagraphText = (id: string, newText: string) => {
    setDocumentContent(prev => prev.map(p => p.id === id ? { ...p, text: newText } : p));
  };
  
  const getProactiveSuggestions = useCallback(async () => {
        if (isLoading || documentContent.length === 0) return;

        setLoadingMessage('Finding suggestions...');
        setIsLoading(true);
        try {
            const fullText = documentContent.map(p => p.text).join('\n');
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: `Analyze the following text. Identify up to 3 specific sentences or phrases that could be improved for clarity, grammar, or style. For each, provide the original text, a concise explanation for the change, and the suggested replacement.

                Text to analyze:
                ---
                ${fullText}
                ---`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: GenAiType.ARRAY,
                        items: {
                            type: GenAiType.OBJECT,
                            properties: {
                                originalText: { type: GenAiType.STRING },
                                explanation: { type: GenAiType.STRING },
                                suggestion: { type: GenAiType.STRING },
                            },
                            required: ["originalText", "explanation", "suggestion"]
                        }
                    }
                }
            });

            const suggestions: Suggestion[] = JSON.parse(response.text);
            const newSuggestionMap = new Map<string, Suggestion[]>();

            documentContent.forEach(p => {
                const paraSuggestions = suggestions.filter(s => p.text.includes(s.originalText));
                if (paraSuggestions.length > 0) {
                    newSuggestionMap.set(p.id, paraSuggestions);
                }
            });
            setProactiveSuggestions(newSuggestionMap);

        } catch (e) {
            console.error("Failed to get proactive suggestions:", e);
            // Don't show user-facing error for this background task
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [documentContent, ai.models, isLoading]);
  
    useEffect(() => {
        const handler = setTimeout(() => {
            if (documentContent.length > 0 && !showInitialPrompt) {
                getProactiveSuggestions();
            }
        }, 5000); // Debounce for 5 seconds after last content change

        return () => {
            clearTimeout(handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentContent, showInitialPrompt]);


  return (
    <div className="min-h-screen font-sans">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Magic Writer AI
          </h1>
          <p className="text-slate-400 mt-2">Your AI-powered thought partner for writing.</p>
        </header>

        {isLoading && <Loader message={loadingMessage} />}
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg my-4 max-w-2xl mx-auto">{error}</div>}
        
        {showInitialPrompt ? (
          <InitialPrompt onGenerate={handleInitialGeneration} disabled={isLoading} />
        ) : (
          <Editor 
            paragraphs={documentContent}
            onAiAction={handleAiAction}
            onUpdateParagraph={updateParagraphText}
            suggestions={proactiveSuggestions}
            onAcceptSuggestion={(paragraphId, originalText, suggestionText) => {
              setDocumentContent(prev => prev.map(p => {
                  if (p.id === paragraphId) {
                      return { ...p, text: p.text.replace(originalText, suggestionText) };
                  }
                  return p;
              }));
              setProactiveSuggestions(prev => {
                  const newMap = new Map(prev);
                  // FIX: Refactored to avoid optional chaining on a method call, which can confuse the type checker.
                  const paraSuggestions = newMap.get(paragraphId);
                  if (paraSuggestions) {
                    const updatedSuggestions = paraSuggestions.filter(s => s.originalText !== originalText);
                    if (updatedSuggestions.length > 0) {
                        newMap.set(paragraphId, updatedSuggestions);
                    } else {
                        newMap.delete(paragraphId);
                    }
                  }
                  return newMap;
              });
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;