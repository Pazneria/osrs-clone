import type { GameSessionPlayerState } from '../contracts/session';

export function stopPlayerAction(player: GameSessionPlayerState): void {
  player.path = [];
  player.targetX = player.x;
  player.targetY = player.y;
  player.action = 'IDLE';
  player.targetObj = null;
  player.targetUid = null;
  player.pendingSkillStart = null;
  player.pendingActionAfterTurn = null;
  player.pendingInteractAfterFletchingWalk = null;
  player.firemakingTarget = null;
  player.firemakingSession = null;
  player.skillSessions = {};
  player.turnLock = false;
  player.actionVisualReady = true;
}
