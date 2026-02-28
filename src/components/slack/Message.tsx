'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';

interface MessageProps {
  senderName: string;
  content: string;
  timestamp: string;
  isPlayer?: boolean;
  mentionsPlayer?: boolean;
  showAvatar?: boolean;
  showHeader?: boolean;
  animate?: boolean;
}

function renderContent(content: string): React.ReactNode {
  const parts = content.split(/(@channel|@here|@you)/g);
  if (parts.length === 1) return content;

  return parts.map((part, i) => {
    if (part === '@channel' || part === '@here' || part === '@you') {
      return (
        <span
          key={i}
          className="bg-slack-mention-bg/60 text-slack-mention-text rounded px-0.5"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function Message({
  senderName,
  content,
  timestamp,
  isPlayer = false,
  mentionsPlayer = false,
  showAvatar = true,
  showHeader = true,
  animate = true,
}: MessageProps) {
  const [visible, setVisible] = useState(!animate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [animate]);

  const displayName = isPlayer ? senderName : senderName;
  const timestampLabel = isPlayer ? `${timestamp} (PM)` : timestamp;

  return (
    <div
      ref={ref}
      className={`group flex gap-2 px-5 py-0.5 transition-all duration-300
        ${showHeader ? 'mt-2' : ''}
        ${mentionsPlayer ? 'bg-slack-mention-bg/30 border-l-2 border-slack-mention-text' : 'hover:bg-slack-message-hover'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
    >
      {showAvatar ? (
        <Avatar name={displayName} size="md" />
      ) : (
        <div className="w-9 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[15px] text-slack-white hover:underline cursor-pointer">
              {displayName}
            </span>
            <span className="text-xs text-slack-text-secondary">{timestampLabel}</span>
          </div>
        )}
        <div className="text-slack-text text-[15px] whitespace-pre-wrap break-words">
          {renderContent(content)}
        </div>
      </div>
    </div>
  );
}
