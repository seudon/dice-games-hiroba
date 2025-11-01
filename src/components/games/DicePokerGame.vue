<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Dice } from '../../types/game';
import { LocalStorageAdapter } from '../../lib/storage/LocalStorage';
import DiceTray from '../common/DiceTray.vue';

// Props
interface Props {
  gameSlug: string;
  maxRounds?: number;
  maxRerolls?: number;
  diceCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxRounds: 13,
  maxRerolls: 3,
  diceCount: 5,
});

// 役の種類
type CategoryKey =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes' // 上段
  | 'threeOfKind' | 'fourOfKind' | 'fullHouse'
  | 'smallStraight' | 'largeStraight' | 'yahtzee' | 'chance'; // 下段

// スコアボード型
interface ScoreBoard {
  ones: number | null;
  twos: number | null;
  threes: number | null;
  fours: number | null;
  fives: number | null;
  sixes: number | null;
  threeOfKind: number | null;
  fourOfKind: number | null;
  fullHouse: number | null;
  smallStraight: number | null;
  largeStraight: number | null;
  yahtzee: number | null;
  chance: number | null;
}

// 統計型
interface Stats {
  totalGames: number;
  bestScore: number | null;
  averageScore: number | null;
  yahtzeeCount: number;
}

// State
const storage = new LocalStorageAdapter();
const dice = ref<Dice[]>([]);
const keptDice = ref<boolean[]>([false, false, false, false, false]);
const rollCount = ref(0); // 現在のラウンドでの振った回数（1-3）
const currentRound = ref(1); // 現在のラウンド（1-13）
const isRolling = ref(false);
const isGameFinished = ref(false);

// スコアボード
const scoreBoard = ref<ScoreBoard>({
  ones: null,
  twos: null,
  threes: null,
  fours: null,
  fives: null,
  sixes: null,
  threeOfKind: null,
  fourOfKind: null,
  fullHouse: null,
  smallStraight: null,
  largeStraight: null,
  yahtzee: null,
  chance: null,
});

// 統計
const stats = ref<Stats>({
  totalGames: 0,
  bestScore: null,
  averageScore: null,
  yahtzeeCount: 0,
});

// サイコロ初期化
function initDice() {
  dice.value = Array.from({ length: props.diceCount }, (_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 6 + 1) as any,
    isRolling: false,
  }));
  keptDice.value = [false, false, false, false, false];
}

// サイコロを振る
async function roll() {
  if (rollCount.value >= props.maxRerolls || isRolling.value || isGameFinished.value) return;

  isRolling.value = true;
  rollCount.value++;

  // キープされていないサイコロだけ振る
  dice.value.forEach((d, i) => {
    if (!keptDice.value[i]) {
      d.isRolling = true;
    }
  });

  // アニメーション中にランダムな値を表示
  const animationInterval = setInterval(() => {
    dice.value.forEach((d, i) => {
      if (!keptDice.value[i]) {
        d.value = Math.floor(Math.random() * 6 + 1) as any;
      }
    });
  }, 50);

  // 500ms後に最終結果を表示
  await new Promise(resolve => setTimeout(resolve, 500));
  clearInterval(animationInterval);

  // 最終結果
  dice.value.forEach((d, i) => {
    if (!keptDice.value[i]) {
      d.value = Math.floor(Math.random() * 6 + 1) as any;
    }
    d.isRolling = false;
  });

  isRolling.value = false;
}

// キープ切り替え
function toggleKeep(index: number) {
  if (rollCount.value === 0) return; // まだ振っていない場合はキープできない
  keptDice.value[index] = !keptDice.value[index];
}

// 役を確定
async function selectCategory(category: CategoryKey) {
  if (scoreBoard.value[category] !== null) return; // 既に使用済み
  if (rollCount.value === 0) return; // まだ振っていない

  const score = calculateScore(category, getDiceValues());
  scoreBoard.value[category] = score;

  // ヤッツィー達成チェック
  if (category === 'yahtzee' && score === 50) {
    stats.value.yahtzeeCount++;
  }

  // 次のラウンドへ
  if (currentRound.value >= props.maxRounds) {
    // ゲーム終了
    await finishGame();
  } else {
    currentRound.value++;
    rollCount.value = 0;
    keptDice.value = [false, false, false, false, false];
    initDice();
  }
}

// ゲーム終了
async function finishGame() {
  isGameFinished.value = true;
  await saveStats();
}

// 統計保存
async function saveStats() {
  const finalScore = totalScore.value;

  // 統計を更新
  const currentStats = await loadStatsFromStorage();
  const newTotalGames = currentStats.totalGames + 1;
  const newBestScore = Math.max(currentStats.bestScore || 0, finalScore);
  const newAverageScore = ((currentStats.averageScore || 0) * currentStats.totalGames + finalScore) / newTotalGames;

  const newStats: Stats = {
    totalGames: newTotalGames,
    bestScore: newBestScore,
    averageScore: Math.round(newAverageScore * 10) / 10,
    yahtzeeCount: stats.value.yahtzeeCount,
  };

  await storage.saveData(`${props.gameSlug}-stats`, newStats);
  stats.value = newStats;
}

// 統計読み込み
async function loadStatsFromStorage(): Promise<Stats> {
  const data = await storage.getData(`${props.gameSlug}-stats`);
  return data || {
    totalGames: 0,
    bestScore: null,
    averageScore: null,
    yahtzeeCount: 0,
  };
}

// ゲームリセット
function resetGame() {
  scoreBoard.value = {
    ones: null,
    twos: null,
    threes: null,
    fours: null,
    fives: null,
    sixes: null,
    threeOfKind: null,
    fourOfKind: null,
    fullHouse: null,
    smallStraight: null,
    largeStraight: null,
    yahtzee: null,
    chance: null,
  };
  currentRound.value = 1;
  rollCount.value = 0;
  isGameFinished.value = false;
  initDice();
}

// サイコロの値を取得
function getDiceValues(): number[] {
  return dice.value.map(d => d.value);
}

// ============================================
// 役判定ロジック
// ============================================

// スコア計算
function calculateScore(category: CategoryKey, values: number[]): number {
  switch (category) {
    case 'ones': return calculateNumberScore(values, 1);
    case 'twos': return calculateNumberScore(values, 2);
    case 'threes': return calculateNumberScore(values, 3);
    case 'fours': return calculateNumberScore(values, 4);
    case 'fives': return calculateNumberScore(values, 5);
    case 'sixes': return calculateNumberScore(values, 6);
    case 'threeOfKind': return checkThreeOfKind(values);
    case 'fourOfKind': return checkFourOfKind(values);
    case 'fullHouse': return checkFullHouse(values);
    case 'smallStraight': return checkSmallStraight(values);
    case 'largeStraight': return checkLargeStraight(values);
    case 'yahtzee': return checkYahtzee(values);
    case 'chance': return values.reduce((a, b) => a + b, 0);
  }
}

// 特定の数字の合計
function calculateNumberScore(values: number[], target: number): number {
  return values.filter(v => v === target).length * target;
}

// 個数をカウント
function getCounts(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const val of values) {
    counts.set(val, (counts.get(val) || 0) + 1);
  }
  return counts;
}

// スリーカード: 同じ目が3個以上
function checkThreeOfKind(values: number[]): number {
  const counts = getCounts(values);
  for (const count of counts.values()) {
    if (count >= 3) {
      return values.reduce((a, b) => a + b, 0);
    }
  }
  return 0;
}

// フォーカード: 同じ目が4個以上
function checkFourOfKind(values: number[]): number {
  const counts = getCounts(values);
  for (const count of counts.values()) {
    if (count >= 4) {
      return values.reduce((a, b) => a + b, 0);
    }
  }
  return 0;
}

// フルハウス: 3個+2個
function checkFullHouse(values: number[]): number {
  const counts = getCounts(values);
  const countsArray = Array.from(counts.values()).sort();
  if (countsArray.length === 2 && countsArray[0] === 2 && countsArray[1] === 3) {
    return 25;
  }
  return 0;
}

// スモールストレート: 4個連続
function checkSmallStraight(values: number[]): number {
  const unique = Array.from(new Set(values)).sort();
  const straights = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
  ];

  for (const straight of straights) {
    if (straight.every(num => unique.includes(num))) {
      return 30;
    }
  }
  return 0;
}

// ラージストレート: 5個連続
function checkLargeStraight(values: number[]): number {
  const sorted = Array.from(new Set(values)).sort().join('');
  if (sorted === '12345' || sorted === '23456') {
    return 40;
  }
  return 0;
}

// ヤッツィー: 全て同じ
function checkYahtzee(values: number[]): number {
  const counts = getCounts(values);
  if (counts.size === 1) {
    return 50;
  }
  return 0;
}

// ============================================
// 計算プロパティ
// ============================================

// 上段合計
const upperSectionTotal = computed(() => {
  const { ones, twos, threes, fours, fives, sixes } = scoreBoard.value;
  const values = [ones, twos, threes, fours, fives, sixes];
  return values.reduce((sum, val) => sum + (val || 0), 0);
});

// ボーナス
const bonus = computed(() => {
  return upperSectionTotal.value >= 63 ? 35 : 0;
});

// 下段合計
const lowerSectionTotal = computed(() => {
  const { threeOfKind, fourOfKind, fullHouse, smallStraight, largeStraight, yahtzee, chance } = scoreBoard.value;
  const values = [threeOfKind, fourOfKind, fullHouse, smallStraight, largeStraight, yahtzee, chance];
  return values.reduce((sum, val) => sum + (val || 0), 0);
});

// 合計スコア
const totalScore = computed(() => {
  return upperSectionTotal.value + bonus.value + lowerSectionTotal.value;
});

// 振り直し可能か
const canRoll = computed(() => {
  return !isRolling.value && !isGameFinished.value && rollCount.value < props.maxRerolls;
});

// ヒント機能: 現在取れる最高得点の役
const bestAvailableCategory = computed(() => {
  if (rollCount.value === 0 || isGameFinished.value) return null;

  const values = getDiceValues();
  let bestCategory: CategoryKey | null = null;
  let bestScore = -1;

  // 全ての未使用の役をチェック
  const categories: CategoryKey[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfKind', 'fourOfKind', 'fullHouse',
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];

  for (const category of categories) {
    if (scoreBoard.value[category] === null) {
      const score = calculateScore(category, values);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
  }

  return bestCategory ? {
    category: bestCategory,
    score: bestScore,
    name: getCategoryName(bestCategory)
  } : null;
});

// 役名を取得
function getCategoryName(category: CategoryKey): string {
  const names: Record<CategoryKey, string> = {
    ones: '1の目',
    twos: '2の目',
    threes: '3の目',
    fours: '4の目',
    fives: '5の目',
    sixes: '6の目',
    threeOfKind: 'スリーカード',
    fourOfKind: 'フォーカード',
    fullHouse: 'フルハウス',
    smallStraight: 'スモールストレート',
    largeStraight: 'ラージストレート',
    yahtzee: 'ヤッツィー',
    chance: 'チャンス',
  };
  return names[category];
}

// 初期化
onMounted(async () => {
  initDice();
  stats.value = await loadStatsFromStorage();
});
</script>

<template>
  <div>
    <!-- ゲーム終了メッセージ -->
    <div v-if="isGameFinished" class="alert alert-success text-center fw-bold mb-4">
      🎉 ゲーム終了！ 最終スコア: {{ totalScore }}点
    </div>

    <!-- 2カラムレイアウト（PC）/ 縦並び（モバイル） -->
    <div class="row mb-4">
      <!-- 右カラム: ゲームプレイエリア（モバイルでは上部） -->
      <div class="col-md-7 order-md-2 order-1 mb-4 mb-md-0">
        <!-- ゲーム情報 -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <span class="fw-bold">ラウンド:</span>
                <span class="ms-2">{{ currentRound }} / {{ maxRounds }}</span>
              </div>
              <div class="col-md-4">
                <span class="fw-bold">振り直し:</span>
                <span class="ms-2">{{ rollCount }} / {{ maxRerolls }}</span>
              </div>
              <div class="col-md-4">
                <span class="fw-bold">現在のスコア:</span>
                <span class="ms-2">{{ totalScore }}点</span>
              </div>
            </div>
          </div>
        </div>

        <!-- サイコロ表示 -->
        <div class="mb-4">
          <DiceTray
            :dice="dice"
            :keptDice="keptDice"
            :clickable="rollCount > 0 && !isGameFinished"
            @dice-click="toggleKeep"
          />

          <!-- 説明テキスト -->
          <div v-if="rollCount > 0 && !isGameFinished" class="text-center mt-3">
            <small class="text-muted">💡 サイコロをクリックしてキープ/解除できます</small>
          </div>
        </div>

        <!-- コントロール -->
        <div v-if="!isGameFinished" class="card mb-4">
          <div class="card-body text-center">
            <button
              @click="roll"
              :disabled="!canRoll"
              class="btn btn-primary btn-lg"
              type="button"
            >
              {{ isRolling ? 'サイコロを振っています...' : 'サイコロを振る' }}
            </button>
          </div>
        </div>

        <!-- ヒント -->
        <div v-if="bestAvailableCategory && !isGameFinished" class="alert alert-info mb-0">
          💡 おすすめ: <strong>{{ bestAvailableCategory.name }}</strong> ({{ bestAvailableCategory.score }}点)
        </div>
      </div>

      <!-- 左カラム: スコアボード（モバイルでは下部） -->
      <div class="col-md-5 order-md-1 order-2">
        <!-- スコアボード -->
    <div class="card mb-4">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">📊 スコアボード</h3>

        <!-- 上段 -->
        <div class="mb-4">
          <h4 class="h6 fw-bold mb-3">上段</h4>
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr
                  v-for="category in ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'] as CategoryKey[]"
                  :key="category"
                  @click="selectCategory(category)"
                  :class="{ 'table-active': scoreBoard[category] === null && rollCount > 0 && !isGameFinished }"
                  style="cursor: pointer;"
                >
                  <td class="fw-bold">{{ getCategoryName(category) }}</td>
                  <td class="text-end">
                    <span v-if="scoreBoard[category] !== null">{{ scoreBoard[category] }}</span>
                    <span v-else-if="rollCount > 0 && !isGameFinished" class="text-muted">
                      ({{ calculateScore(category, getDiceValues()) }})
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
                <tr class="table-warning fw-bold">
                  <td>ボーナス (63点以上で+35点)</td>
                  <td class="text-end">{{ bonus }}</td>
                </tr>
                <tr class="table-light fw-bold">
                  <td>上段合計</td>
                  <td class="text-end">{{ upperSectionTotal + bonus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 下段 -->
        <div>
          <h4 class="h6 fw-bold mb-3">下段</h4>
          <div class="table-responsive">
            <table class="table table-bordered">
              <tbody>
                <tr
                  v-for="category in ['threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'] as CategoryKey[]"
                  :key="category"
                  @click="selectCategory(category)"
                  :class="{ 'table-active': scoreBoard[category] === null && rollCount > 0 && !isGameFinished }"
                  style="cursor: pointer;"
                >
                  <td class="fw-bold">{{ getCategoryName(category) }}</td>
                  <td class="text-end">
                    <span v-if="scoreBoard[category] !== null">{{ scoreBoard[category] }}</span>
                    <span v-else-if="rollCount > 0 && !isGameFinished" class="text-muted">
                      ({{ calculateScore(category, getDiceValues()) }})
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
                <tr class="table-light fw-bold">
                  <td>下段合計</td>
                  <td class="text-end">{{ lowerSectionTotal }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 合計 -->
        <div class="table-responsive">
          <table class="table table-bordered">
            <tbody>
              <tr class="table-primary fw-bold fs-5">
                <td>総合計</td>
                <td class="text-end">{{ totalScore }}点</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
    </div>

    <!-- リセットボタン -->
    <div class="text-center mb-4">
      <button @click="resetGame" class="btn btn-secondary btn-lg" type="button">
        新しいゲームを開始
      </button>
    </div>

    <!-- 統計 -->
    <div class="card">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">📈 統計</h3>

        <div class="row row-cols-2 row-cols-md-4 g-3">
          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">ゲーム数</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.totalGames }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">最高得点</div>
                <div class="fs-4 fw-bold text-primary">{{ stats.bestScore ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">平均得点</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.averageScore ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">ヤッツィー回数</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.yahtzeeCount }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
