// src/types/game.ts

/** サイコロの出目(1-6) */
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

/** サイコロの状態 */
export interface Dice {
  id: number;
  value: DiceValue;
  isRolling: boolean;
}

/** ゲーム記録 */
export interface GameRecord {
  id: string;
  gameSlug: string;
  diceCount: number;
  attempts: number;
  timestamp: number;
  dateString: string;
}

/** ゲーム統計 */
export interface GameStats {
  totalGames: number;
  bestScore: number | null;
  averageScore: number | null;
  recentRecords: GameRecord[];
}

/** ストレージインターフェース */
export interface IStorage {
  saveRecord(record: GameRecord): Promise<void>;
  getRecords(gameSlug: string, diceCount?: number): Promise<GameRecord[]>;
  getStats(gameSlug: string, diceCount?: number): Promise<GameStats>;
  clearRecords(gameSlug: string): Promise<void>;
}
