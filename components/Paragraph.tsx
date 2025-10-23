

import React, { useRef, useMemo } from 'react';
import type { DocumentParagraph, Suggestion } from '../types';

interface ParagraphProps {
    paragraph: DocumentParagraph;
    suggestions: Suggestion[];
    onUpdate: (newText: string) => void;
    onAcceptSuggestion: (originalText: string, suggestionText: string) => void;
}

const SuggestionTooltip: React.FC<{ suggestion: Suggestion; onAccept: () => void }> = ({ suggestion, onAccept }) => (
    <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-sm transition-opacity opacity-100">
        <p className="text-slate-400 mb-2 italic">"{suggestion.explanation}"</p>
        <p className="font-mono bg-slate-800 p-2 rounded text-cyan-300 break-words">{suggestion.suggestion}</p>
        <button
            onClick={onAccept}
            className="mt-3 w-full text-center px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold"
        >
            Accept Suggestion
        </button>
    </div>
);

export const Paragraph: React.FC<ParagraphProps> = ({ paragraph, suggestions, onUpdate, onAcceptSuggestion }) => {
    const paraRef = useRef<HTMLDivElement>(null);

    const handleBlur = () => {
        if (paraRef.current) {
            onUpdate(paraRef.current.innerText);
        }
    };

    const renderedContent = useMemo(() => {
        if (suggestions.length === 0) {
            return paragraph.text;
        }

        // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
        let content: (string | React.ReactElement)[] = [paragraph.text];

        suggestions.forEach((suggestion, i) => {
            let newContent: (string | React.ReactElement)[] = [];
            content.forEach(part => {
                if (typeof part === 'string') {
                    const splitText = part.split(suggestion.originalText);
                    if (splitText.length > 1) {
                        for (let j = 0; j < splitText.length - 1; j++) {
                            newContent.push(splitText[j]);
                            newContent.push(
                                <span className="relative group" key={`${suggestion.originalText}-${i}-${j}`}>
                                    <span className="bg-blue-900/50 border-b-2 border-blue-500 border-dotted cursor-pointer">
                                        {suggestion.originalText}
                                    </span>
                                    <div className="absolute hidden group-hover:block">
                                        <SuggestionTooltip 
                                            suggestion={suggestion} 
                                            onAccept={() => onAcceptSuggestion(suggestion.originalText, suggestion.suggestion)}
                                        />
                                    </div>
                                </span>
                            );
                        }
                        newContent.push(splitText[splitText.length - 1]);
                    } else {
                        newContent.push(part);
                    }
                } else {
                    newContent.push(part);
                }
            });
            content = newContent;
        });

        return content;
    }, [paragraph.text, suggestions, onAcceptSuggestion]);

    return (
        <div
            ref={paraRef}
            data-paragraph-id={paragraph.id}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            className="paragraph-editable outline-none"
        >
            {renderedContent}
        </div>
    );
};