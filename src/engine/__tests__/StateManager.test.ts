import { describe, it, expect } from 'vitest';
import { StateManager } from '../StateManager';
import type { DeliveredMessage, StateEffect } from '../types';

function makeMessage(overrides: Partial<DeliveredMessage> = {}): DeliveredMessage {
  return {
    id: 'msg-1',
    eventId: 'evt-1',
    channel: 'general',
    from: 'the-vp',
    content: 'Hello',
    timestamp: 1000,
    mentionsPlayer: false,
    contextValue: null,
    isPlayerMessage: false,
    ...overrides,
  };
}

describe('StateManager', () => {
  it('initializes with default variables', () => {
    const sm = new StateManager();
    expect(sm.getVariable('execTrust')).toBe(50);
    expect(sm.getVariable('teamMorale')).toBe(60);
    expect(sm.getVariable('responsivenessDebt')).toBe(0);
  });

  it('accepts initial overrides', () => {
    const sm = new StateManager({ execTrust: 80 });
    expect(sm.getVariable('execTrust')).toBe(80);
    expect(sm.getVariable('teamMorale')).toBe(60);
  });

  it('clamps variable to 0-100', () => {
    const sm = new StateManager({ execTrust: 95 });
    sm.applyEffect({ variable: 'execTrust', delta: 20, tag: 'test' });
    expect(sm.getVariable('execTrust')).toBe(100);

    sm.applyEffect({ variable: 'execTrust', delta: -200, tag: 'test' });
    expect(sm.getVariable('execTrust')).toBe(0);
  });

  it('applies multiple effects', () => {
    const sm = new StateManager();
    const effects: StateEffect[] = [
      { variable: 'execTrust', delta: 10, tag: 'test' },
      { variable: 'teamMorale', delta: -15, tag: 'test' },
    ];
    sm.applyEffects(effects);
    expect(sm.getVariable('execTrust')).toBe(60);
    expect(sm.getVariable('teamMorale')).toBe(45);
  });

  it('tracks unread counts for non-active channels', () => {
    const sm = new StateManager();
    sm.setActiveChannel('general');
    sm.addMessage(makeMessage({ channel: 'eng-updates' }));
    sm.addMessage(makeMessage({ channel: 'eng-updates', id: 'msg-2' }));
    expect(sm.getState().unreadCounts['eng-updates']).toBe(2);
  });

  it('does not increment unread for active channel', () => {
    const sm = new StateManager();
    sm.setActiveChannel('general');
    sm.addMessage(makeMessage({ channel: 'general' }));
    expect(sm.getState().unreadCounts['general']).toBe(0);
  });

  it('tracks mention counts separately', () => {
    const sm = new StateManager();
    sm.setActiveChannel('general');
    sm.addMessage(
      makeMessage({ channel: 'eng-updates', mentionsPlayer: true })
    );
    sm.addMessage(
      makeMessage({
        channel: 'eng-updates',
        id: 'msg-2',
        mentionsPlayer: false,
      })
    );
    expect(sm.getState().mentionCounts['eng-updates']).toBe(1);
    expect(sm.getState().unreadCounts['eng-updates']).toBe(2);
  });

  it('clears unread/mention counts on channel switch', () => {
    const sm = new StateManager();
    sm.setActiveChannel('general');
    sm.addMessage(
      makeMessage({ channel: 'eng-updates', mentionsPlayer: true })
    );
    sm.setActiveChannel('eng-updates');
    expect(sm.getState().unreadCounts['eng-updates']).toBe(0);
    expect(sm.getState().mentionCounts['eng-updates']).toBe(0);
  });

  it('checks conditions correctly', () => {
    const sm = new StateManager({ execTrust: 50 });
    expect(sm.checkCondition('execTrust', 'gt', 40)).toBe(true);
    expect(sm.checkCondition('execTrust', 'gt', 50)).toBe(false);
    expect(sm.checkCondition('execTrust', 'gte', 50)).toBe(true);
    expect(sm.checkCondition('execTrust', 'lt', 60)).toBe(true);
    expect(sm.checkCondition('execTrust', 'eq', 50)).toBe(true);
  });

  it('produces deep-copy snapshots', () => {
    const sm = new StateManager();
    const snapshot = sm.snapshot();
    snapshot.variables.execTrust = 999;
    expect(sm.getVariable('execTrust')).toBe(50);
  });
});
