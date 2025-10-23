
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface InitialPromptProps {
  onGenerate: (prompt: string, files: File[]) => void;
  disabled: boolean;
}

export const InitialPrompt: React.FC<InitialPromptProps> = ({ onGenerate, disabled }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, files);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        setFiles(Array.from(event.dataTransfer.files));
        event.dataTransfer.clearData();
    }
  }, []);

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-slate-800/50 rounded-xl border border-slate-700 shadow-2xl shadow-slate-950/50 transition-all">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="prompt" className="block text-lg font-medium text-slate-300 mb-2">
            What do you want to write about?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A blog post about the future of renewable energy..."
            className="w-full h-32 p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
            required
            disabled={disabled}
          />
        </div>

        <div className="mb-6">
          <label 
            htmlFor="file-upload" 
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700/50 transition-colors"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
              <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-slate-500">Attach any relevant files (images, text, etc.)</p>
            </div>
            <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileChange} disabled={disabled} />
          </label>
           {files.length > 0 && (
            <div className="mt-4 text-sm text-slate-400">
              <p className="font-semibold">Selected files:</p>
              <ul className="list-disc list-inside">
                {files.map((file, index) => <li key={index}>{file.name}</li>)}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || !prompt.trim()}
          className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          Start Writing
        </button>
      </form>
    </div>
  );
};
