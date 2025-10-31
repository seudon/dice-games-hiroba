// src/lib/utils/dice.ts
import type { DiceValue } from '../../types/game';

/** ランダムなサイコロの目を生成 */
export function rollDice(): DiceValue {
  return (Math.floor(Math.random() * 6) + 1) as DiceValue;
}

/** 複数のサイコロを振る */
export function rollMultipleDice(count: number): DiceValue[] {
  return Array.from({ length: count }, () => rollDice());
}

/** ぞろ目かどうかをチェック */
export function isZorome(values: DiceValue[]): boolean {
  if (values.length === 0) return false;
  return values.every(v => v === values[0]);
}

/** ぞろ目の確率を計算 */
export function calculateZoromeProbability(diceCount: number): number {
  if (diceCount <= 0) return 0;
  // 確率 = 1 / (6^(n-1))
  return 1 / Math.pow(6, diceCount - 1);
}

/** 確率をパーセント表示用にフォーマット */
export function formatProbability(probability: number): string {
  if (probability >= 0.01) {
    return `${(probability * 100).toFixed(2)}%`;
  }
  return `${(probability * 100).toFixed(4)}%`;
}

/** 分数形式で確率を表示 */
export function formatProbabilityAsFraction(diceCount: number): string {
  const denominator = Math.pow(6, diceCount - 1);
  return `1/${denominator}`;
}
