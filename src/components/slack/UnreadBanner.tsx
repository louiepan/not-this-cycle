'use client';

interface UnreadBannerProps {
  count: number;
  onClick: () => void;
}

export function UnreadBanner({ count, onClick }: UnreadBannerProps) {
  if (count <= 0) return null;

  return (
    <button
      onClick={onClick}
      className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-full border border-white/10
        bg-slack-sidebar-active px-4 py-2 text-xs font-semibold text-white
        cursor-pointer transition-colors hover:bg-slack-sidebar-active/90
        shadow-[0_14px_30px_rgba(0,0,0,0.28)]"
    >
      Jump to latest • {count} new message{count > 1 ? 's' : ''}
    </button>
  );
}
