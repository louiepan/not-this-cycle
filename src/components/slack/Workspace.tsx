'use client';

import type { ChannelDef, DeliveredMessage, Stakeholder } from '@/engine/types';
import { Sidebar } from './Sidebar';
import { ChannelView } from './ChannelView';
import { ProfilePanel } from './ProfilePanel';

interface WorkspaceProps {
  channels: ChannelDef[];
  activeChannelId: string;
  messages: DeliveredMessage[];
  stakeholders: Stakeholder[];
  stakeholderNames: Record<string, string>;
  playerName: string;
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
  hasDecision: boolean;
  nudge: string | null;
  typingNames: string[];
  gameClock: string;
  selectedProfileId: string | null;
  onChannelSelect: (channelId: string) => void;
  onMessageSubmit: (text: string) => void;
  onProfileOpen: (stakeholderId: string) => void;
  onProfileClose: () => void;
  formatTime: (ms: number) => string;
}

export function Workspace({
  channels,
  activeChannelId,
  messages,
  stakeholders,
  stakeholderNames,
  playerName,
  unreadCounts,
  mentionCounts,
  hasDecision,
  nudge,
  typingNames,
  gameClock,
  selectedProfileId,
  onChannelSelect,
  onMessageSubmit,
  onProfileOpen,
  onProfileClose,
  formatTime,
}: WorkspaceProps) {
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelMessages = messages.filter(
    (m) => m.channel === activeChannelId
  );
  const selectedStakeholder = stakeholders.find((stakeholder) => stakeholder.id === selectedProfileId) ?? null;

  if (!activeChannel) return null;

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[radial-gradient(120%_120%_at_50%_0%,#2a2f36_0%,#17181b_58%)] px-2 py-2 md:px-4 md:py-4 lg:px-8 lg:py-8 xl:px-10 xl:py-10">
      <div className="mx-auto flex h-full w-full min-w-0 items-stretch md:h-[min(920px,calc(100vh-32px))] md:max-w-[calc(100vw-32px)] lg:h-[860px] lg:w-[1520px] lg:max-h-[calc(100vh-80px)] lg:max-w-[calc(100vw-80px)]">
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden border border-white/15 border-x-white/25 bg-slack-window-shell shadow-[0_22px_70px_rgba(0,0,0,0.42)] md:rounded-[24px] md:ring-1 md:ring-slack-window-frame md:shadow-[0_34px_120px_rgba(0,0,0,0.52)]">
          <div className="hidden h-11 shrink-0 items-center justify-between border-b border-white/6 bg-[#241f29] px-4 md:flex">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-white/18" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/12" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <div className="rounded-md border border-white/6 bg-white/4 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slack-text-secondary">
              TechCorp Slack
            </div>
            <div className="text-xs font-mono tabular-nums text-slack-text-secondary">{gameClock}</div>
          </div>

          <div className="relative flex min-h-0 flex-1 overflow-hidden border-t border-slack-window-inset bg-slack-bg">
            <Sidebar
              channels={channels}
              messages={messages}
              activeChannelId={activeChannelId}
              unreadCounts={unreadCounts}
              mentionCounts={mentionCounts}
              onChannelSelect={onChannelSelect}
              workspaceName="TechCorp HQ"
              gameClock={gameClock}
            />
            <ChannelView
              channel={activeChannel}
              messages={channelMessages}
              stakeholders={stakeholders}
              stakeholderNames={stakeholderNames}
              playerName={playerName}
              hasDecision={hasDecision}
              nudge={nudge}
              typingNames={typingNames}
              onMessageSubmit={onMessageSubmit}
              onProfileOpen={onProfileOpen}
              formatTime={formatTime}
            />
            <ProfilePanel stakeholder={selectedStakeholder} onClose={onProfileClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
