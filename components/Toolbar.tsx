
import React, { useState, useRef, useEffect } from 'react';
import type { SelectionInfo, AiAction } from '../types';
import { SparklesIcon, WriteIcon, ShortenIcon, ExpandIcon } from './Icons';

interface ToolbarProps {
  selection: SelectionInfo;
  onAiAction: (action: AiAction, text: string, instruction: string, paragraphId: string) => void;
  onClear: () => void;
}

const ACTION_MAP: { [key in AiAction]: { label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; defaultInstruction: string } } = {
  rewrite: { label: 'Rewrite', icon: WriteIcon, defaultInstruction: 'Rewrite this text' },
  improve: { label: 'Improve', icon: SparklesIcon, defaultInstruction: 'Improve this text for clarity and impact' },
  shorten: { label: 'Shorten', icon: ShortenIcon, defaultInstruction: 'Make this text more concise' },
  expand: { label: 'Expand', icon: ExpandIcon, defaultInstruction: 'Expand on this idea' },
};

export const Toolbar: React.FC<ToolbarProps> = ({ selection, onAiAction, onClear }) => {
  const [activeAction, setActiveAction] = useState<AiAction | null>(null);
  const [instruction, setInstruction] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (activeAction) {
        setInstruction(ACTION_MAP[activeAction].defaultInstruction);
    }
  }, [activeAction]);

  const handleActionClick = (action: AiAction) => {
    setActiveAction(action);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAction && instruction) {
        onAiAction(activeAction, selection.text, instruction, selection.paragraphId);
        onClear();
    }
  };

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${window.scrollY + selection.rect.top - 10}px`,
    left: `${window.scrollX + selection.rect.left + selection.rect.width / 2}px`,
    transform: 'translate(-50%, -100%)',
  };

  return (
    <div ref={toolbarRef} style={toolbarStyle} className="z-20 p-1 bg-slate-900 border border-slate-700 rounded-lg shadow-lg flex items-center gap-1">
      {!activeAction ? (
        Object.entries(ACTION_MAP).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => handleActionClick(key as AiAction)}
              className="p-2 rounded hover:bg-slate-700 transition-colors"
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
        ))
      ) : (
        <form onSubmit={handleSubmit} className="flex p-1">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="bg-slate-800 text-sm px-2 py-1 rounded-l-md focus:outline-none focus:ring-1 focus:ring-purple-500 w-64"
            autoFocus
            onKeyDown={(e) => { if(e.key === 'Escape') { setActiveAction(null); onClear(); } }}
          />
          <button type="submit" className="px-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-r-md">
            Go
          </button>
        </form>
      )}
    </div>
  );
};
