
import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-slate-500 border-t-purple-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-300 text-lg font-medium">{message}</p>
    </div>
  </div>
);
