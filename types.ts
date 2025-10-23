
export interface DocumentParagraph {
  id: string;
  text: string;
}

export interface SelectionInfo {
  text: string;
  paragraphId: string;
  rect: DOMRect;
}

export type AiAction = 'rewrite' | 'improve' | 'shorten' | 'expand';

export interface Suggestion {
    originalText: string;
    suggestion: string;
    explanation: string;
}
