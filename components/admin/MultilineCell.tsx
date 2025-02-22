'use client';

import React, { useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface MultilineCellProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
}

export function MultilineCell({
  value,
  onChange,
  onBlur,
  onKeyDown,
  className = ''
}: MultilineCellProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-adjust height
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(100, textareaRef.current.scrollHeight)}px`;
      // Focus and select all text when component mounts
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-adjust height as content changes
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(100, textareaRef.current.scrollHeight)}px`;
    }
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={`w-full resize-none p-2 ${className}`}
      style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minHeight: '100px',
        height: 'auto',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
      rows={4}
    />
  );
}
