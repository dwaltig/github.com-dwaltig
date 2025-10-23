
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { DocumentParagraph, SelectionInfo, Suggestion } from '../types';
import { Toolbar } from './Toolbar';
import { Paragraph } from './Paragraph';

interface EditorProps {
    paragraphs: DocumentParagraph[];
    onAiAction: (action: any, text: string, instruction: string, paragraphId: string) => void;
    onUpdateParagraph: (id: string, text: string) => void;
    suggestions: Map<string, Suggestion[]>;
    onAcceptSuggestion: (paragraphId: string, originalText: string, suggestionText: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ paragraphs, onAiAction, onUpdateParagraph, suggestions, onAcceptSuggestion }) => {
    const [selection, setSelection] = useState<SelectionInfo | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const handleMouseUp = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const text = sel.toString().trim();

            if (text.length > 0) {
                let container = range.commonAncestorContainer;
                // Traverse up to find the paragraph container
                while (container && !(container instanceof HTMLElement && container.dataset.paragraphId)) {
                    container = container.parentElement;
                }

                if (container && container instanceof HTMLElement && container.dataset.paragraphId) {
                    setSelection({
                        text,
                        paragraphId: container.dataset.paragraphId,
                        rect: range.getBoundingClientRect(),
                    });
                    return;
                }
            }
        }
        setSelection(null);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
                setSelection(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div 
            ref={editorRef}
            onMouseUp={handleMouseUp}
            className="max-w-3xl mx-auto bg-slate-800/30 rounded-lg p-8 md:p-12 border border-slate-700 shadow-lg"
        >
            {selection && <Toolbar selection={selection} onAiAction={onAiAction} onClear={() => setSelection(null)} />}
            <div className="prose prose-invert prose-lg max-w-none focus:outline-none">
                {paragraphs.map(p => (
                    <Paragraph
                        key={p.id}
                        paragraph={p}
                        suggestions={suggestions.get(p.id) || []}
                        onUpdate={(newText) => onUpdateParagraph(p.id, newText)}
                        onAcceptSuggestion={(original, suggested) => onAcceptSuggestion(p.id, original, suggested)}
                    />
                ))}
            </div>
        </div>
    );
};
