// src/lib/utils/game.ts

/** 実際に遊ぶときの人数 */
export interface Players {
  min: number;
  max?: number;
}

/**
 * 人数を表示用の文字列にする
 *
 * max を省略したゲームは人数の上限がないため「◯人〜」と表示する。
 */
export function formatPlayers(players: Players): string {
  if (players.max === undefined) return `${players.min}人〜`;
  if (players.max === players.min) return `${players.min}人`;
  return `${players.min}〜${players.max}人`;
}

/** 難易度に応じたBootstrapのバッジカラー */
export const difficultyColors: Record<string, string> = {
  '初級': 'bg-success',
  '中級': 'bg-info',
  '上級': 'bg-warning',
  '超級': 'bg-danger',
};
