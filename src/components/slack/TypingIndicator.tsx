'use client';

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="px-5 py-1 text-xs text-slack-text-secondary flex items-center gap-1.5">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-slack-text-secondary rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-slack-text-secondary rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-slack-text-secondary rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span>{text}</span>
    </div>
  );
}
