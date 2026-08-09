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

  /**
   * ゲーム固有のデータを任意の形で保存する
   *
   * GameRecord / GameStats の形（試行回数が少ないほど良い）に合わないゲーム用。
   * 得点を競うゲームや、独自の履歴構造を持つゲームはこちらを使う。
   * keyはゲーム側で決める識別子（例: `${gameSlug}-stats`）。
   */
  saveData<T>(key: string, value: T): Promise<void>;

  /** saveDataで保存したデータを取得する。未保存・破損時はnull */
  getData<T>(key: string): Promise<T | null>;

  /** saveDataで保存したデータを削除する */
  clearData(key: string): Promise<void>;
}
