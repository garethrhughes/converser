'use client';

import { useRef, useEffect, useState } from 'react';
import { EditorView, placeholder as editorPlaceholder, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [height, setHeight] = useState(400);

  onChangeRef.current = onChange;

  // Calculate available height
  useEffect(() => {
    function calcHeight() {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 80;
      setHeight(Math.max(200, available));
    }

    calcHeight();
    window.addEventListener('resize', calcHeight);
    return () => window.removeEventListener('resize', calcHeight);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      markdown(),
      lineNumbers(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': { height: `${height}px`, width: '100%' },
        '&.cm-editor': { backgroundColor: '#f8fafc' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '13px',
        },
        '.cm-gutters': {
          backgroundColor: '#f1f5f9',
          borderRight: '1px solid #e2e8f0',
          color: '#94a3b8',
        },
        '.cm-activeLineGutter': {
          backgroundColor: '#e2e8f0',
        },
        '.cm-activeLine': {
          backgroundColor: '#f1f5f9',
        },
      }),
    ];

    if (placeholder) {
      extensions.push(editorPlaceholder(placeholder));
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden">
      <div
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="w-full max-w-full border border-border overflow-hidden"
      />
    </div>
  );
}
