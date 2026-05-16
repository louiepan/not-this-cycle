'use client';

interface AvatarProps {
  name: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
}

// Muted gradient pairs matching the Amber palette. Hashes pick deterministically
// so each name renders the same colors across reloads.
const GRADIENTS: Array<[string, string]> = [
  ['#4a6fa5', '#2c4a75'], // dusk blue
  ['#a55e4a', '#75382c'], // rust
  ['#4aa572', '#2c7548'], // moss
  ['#8a4aa5', '#5c2c75'], // plum
  ['#a5984a', '#75682c'], // mustard
  ['#5a6f85', '#384757'], // graphite
  ['#a5704a', '#75502c'], // copper
  ['#5a8a72', '#385a48'], // sage
  ['#7a5a8a', '#4a3a5c'], // mauve
  ['#9a8a4a', '#6a5e2c'], // brass
];

// Stable gradient assignment per known stakeholder id so the same person
// always renders the same color across reloads, scenarios, and screens.
const ID_GRADIENTS: Record<string, [string, string]> = {
  'the-manager': ['#4aa572', '#2c7548'], // green — authority
  'the-vp': ['#a55e4a', '#75382c'], // rust — executive
  'the-staff-eng': ['#5a6f85', '#384757'], // graphite — engineering
  'the-design-lead': ['#8a4aa5', '#5c2c75'], // plum — creative
  'the-data-analyst': ['#a5984a', '#75682c'], // mustard — analytical
  'the-tpm': ['#4a6fa5', '#2c4a75'], // blue — coordination
  'the-adjacent-pm': ['#5a8a72', '#385a48'], // sage — peer
  player: ['#6e6359', '#45403a'], // graphite-warm — neutral self
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getGradient(name: string, id?: string): string {
  if (id && ID_GRADIENTS[id]) {
    const [from, to] = ID_GRADIENTS[id];
    return `linear-gradient(135deg, ${from}, ${to})`;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const [from, to] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

const SIZE_MAP = {
  sm: 'w-6 h-6 text-[10px] rounded',
  md: 'w-8 h-8 text-[11px] rounded-md',
  lg: 'w-12 h-12 text-sm rounded-lg',
};

export function Avatar({ name, id, size = 'md', isOnline }: AvatarProps) {
  return (
    <div className="relative shrink-0">
      <div
        className={`${SIZE_MAP[size]} flex items-center justify-center font-semibold tracking-tight select-none`}
        style={{ background: getGradient(name, id), color: '#fff' }}
      >
        {getInitials(name)}
      </div>
      {isOnline !== undefined && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slack-sidebar ${
            isOnline ? 'bg-slack-presence-green' : 'border-slack-text-secondary bg-transparent'
          }`}
        />
      )}
    </div>
  );
}
