// src/lib/storage/LocalStorage.ts
import type { IStorage, GameRecord, GameStats } from '../../types/game';

const STORAGE_KEY_PREFIX = 'dice-games:';

export class LocalStorageAdapter implements IStorage {
  private getStorageKey(gameSlug: string): string {
    return `${STORAGE_KEY_PREFIX}${gameSlug}`;
  }

  async saveRecord(record: GameRecord): Promise<void> {
    try {
      const key = this.getStorageKey(record.gameSlug);
      const existing = await this.getRecords(record.gameSlug);
      const updated = [...existing, record];

      // 最新100件のみ保持
      const trimmed = updated.slice(-100);

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save record:', error);
      throw new Error('記録の保存に失敗しました');
    }
  }

  async getRecords(gameSlug: string, diceCount?: number): Promise<GameRecord[]> {
    try {
      const key = this.getStorageKey(gameSlug);
      const data = localStorage.getItem(key);

      if (!data) return [];

      const records: GameRecord[] = JSON.parse(data);

      if (diceCount !== undefined) {
        return records.filter(r => r.diceCount === diceCount);
      }

      return records;
    } catch (error) {
      console.error('Failed to get records:', error);
      return [];
    }
  }

  async getStats(gameSlug: string, diceCount?: number): Promise<GameStats> {
    const records = await this.getRecords(gameSlug, diceCount);

    if (records.length === 0) {
      return {
        totalGames: 0,
        bestScore: null,
        averageScore: null,
        recentRecords: [],
      };
    }

    const attempts = records.map(r => r.attempts);
    const bestScore = Math.min(...attempts);
    const averageScore = attempts.reduce((a, b) => a + b, 0) / attempts.length;

    return {
      totalGames: records.length,
      bestScore,
      averageScore: Math.round(averageScore * 10) / 10,
      recentRecords: records.slice(-10).reverse(),
    };
  }

  async clearRecords(gameSlug: string): Promise<void> {
    try {
      const key = this.getStorageKey(gameSlug);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear records:', error);
      throw new Error('記録の削除に失敗しました');
    }
  }
}
