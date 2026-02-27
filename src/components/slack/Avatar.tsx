'use client';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
}

const COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9a6324', '#800000', '#aaffc3',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZE_MAP = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

export function Avatar({ name, size = 'md', isOnline }: AvatarProps) {
  return (
    <div className="relative shrink-0">
      <div
        className={`${SIZE_MAP[size]} rounded-lg font-bold flex items-center justify-center select-none`}
        style={{ backgroundColor: getColor(name), color: '#fff' }}
      >
        {getInitials(name)}
      </div>
      {isOnline !== undefined && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slack-sidebar ${
            isOnline ? 'bg-slack-presence-green' : 'border-slack-text-secondary bg-transparent'
          }`}
        />
      )}
    </div>
  );
}
