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
      className="absolute top-12 left-0 right-0 z-10 mx-4 mt-2 px-3 py-1.5 
        bg-slack-sidebar-active text-white text-sm rounded-full text-center
        cursor-pointer hover:bg-slack-sidebar-active/90 transition-colors
        shadow-lg"
    >
      {count} new message{count > 1 ? 's' : ''} ↓
    </button>
  );
}
