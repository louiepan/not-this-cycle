'use client';

import type { ReactNode } from 'react';

interface WindowProps {
  theme: 'dark' | 'light';
  children: ReactNode;
}

// Outer canvas — a thin frame around the application, leaving room for
// optional ad slots later. Contrast is intentionally strong so the inner
// app reads as a clearly separated "window."
const OUTER_BG: Record<WindowProps['theme'], string> = {
  // Lifted ~3 stops above the slack canvas (#0a0b0e) so the frame is visible.
  dark: 'radial-gradient(140% 120% at 50% 0%, #2a2e36 0%, #1a1c20 60%)',
  // Warm beige with enough darkness to read against the paper canvas (#f4f0ea).
  light: 'radial-gradient(140% 120% at 50% 0%, #d8d1c1 0%, #bcb09c 60%)',
};

const INNER_BG_CLASS: Record<WindowProps['theme'], string> = {
  dark: 'bg-slack-bg',
  light: 'bg-paper-canvas',
};

const BORDER_CLASS: Record<WindowProps['theme'], string> = {
  dark: 'border-white/12',
  light: 'border-paper-border-default',
};

// Smaller frame than v1 — enough room to read as a window without choking
// the app. Future ad slots can live in this padding (top banner ~ 72px,
// side rails ~ 48-72px).
const SHELL_PADDING =
  'p-0 md:p-3 lg:p-4 xl:p-6 2xl:p-8';

const SHELL_RADIUS = 'rounded-none md:rounded-[14px]';

const SHELL_SHADOW =
  'md:shadow-[0_2px_4px_rgba(0,0,0,0.18),0_22px_60px_rgba(0,0,0,0.38)]';

export function Window({ theme, children }: WindowProps) {
  return (
    <div
      className={`flex h-screen w-screen items-center justify-center overflow-hidden ${SHELL_PADDING}`}
      style={{ background: OUTER_BG[theme] }}
    >
      <div
        className={`relative flex h-full w-full min-w-0 overflow-hidden ${SHELL_RADIUS} ${INNER_BG_CLASS[theme]} md:border ${BORDER_CLASS[theme]} ${SHELL_SHADOW}`}
      >
        {children}
      </div>
    </div>
  );
}
