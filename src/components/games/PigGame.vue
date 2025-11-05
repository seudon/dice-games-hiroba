<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Dice } from '../../types/game';
import { LocalStorageAdapter } from '../../lib/storage/LocalStorage';
import DiceDisplay from '../common/DiceDisplay.vue';

// Props
interface Props {
  gameSlug: string;
  targetScore?: number;
}

const props = withDefaults(defineProps<Props>(), {
  targetScore: 100,
});

// 統計型
interface Stats {
  totalGames: number;
  bestTurnCount: number | null; // 最少ターン数
  averageTurnCount: number | null; // 平均ターン数
  highestTurnScore: number; // 最高ターン得点
}

// State
const storage = new LocalStorageAdapter();
const dice = ref<Dice>({ id: 0, value: 1, isRolling: false });
const totalScore = ref(0); // 累積得点
const turnScore = ref(0); // 現在のターン得点
const turnCount = ref(1); // 現在のターン数
const isRolling = ref(false);
const isGameFinished = ref(false);
const isBurst = ref(false); // バースト状態
const message = ref('「サイコロを振る」を押してゲームを開始！');
const messageType = ref<'info' | 'success' | 'danger' | 'warning'>('info');

// 統計
const stats = ref<Stats>({
  totalGames: 0,
  bestTurnCount: null,
  averageTurnCount: null,
  highestTurnScore: 0,
});

// サイコロを振る
async function rollDice() {
  if (isRolling.value || isGameFinished.value) return;

  isRolling.value = true;
  isBurst.value = false;
  dice.value.isRolling = true;

  // アニメーション中にランダムな値を表示
  const animationInterval = setInterval(() => {
    dice.value.value = Math.floor(Math.random() * 6 + 1) as any;
  }, 50);

  // 500ms後に最終結果を表示
  await new Promise(resolve => setTimeout(resolve, 500));
  clearInterval(animationInterval);

  // 最終結果
  const result = Math.floor(Math.random() * 6 + 1);
  dice.value.value = result as any;
  dice.value.isRolling = false;
  isRolling.value = false;

  // 結果処理
  if (result === 1) {
    // バースト！
    await handleBurst();
  } else {
    // 得点加算
    turnScore.value += result;
    message.value = `${result}が出ました！ターン得点: ${turnScore.value}点`;
    messageType.value = 'success';

    // 危険度をチェック
    checkDangerLevel();
  }
}

// バースト処理
async function handleBurst() {
  isBurst.value = true;
  message.value = '💥 バースト！ 1が出たのでターン得点は0になりました';
  messageType.value = 'danger';

  // バーストアニメーション
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 次のターンへ
  turnScore.value = 0;
  turnCount.value++;
  isBurst.value = false;
  message.value = '次のターンです。サイコロを振りましょう！';
  messageType.value = 'info';
}

// やめる（得点確定）
function holdScore() {
  if (turnScore.value === 0 || isRolling.value || isGameFinished.value) return;

  // ターン得点を累積得点に加算
  totalScore.value += turnScore.value;

  // 最高ターン得点の更新
  if (turnScore.value > stats.value.highestTurnScore) {
    stats.value.highestTurnScore = turnScore.value;
  }

  message.value = `✅ ${turnScore.value}点を獲得！累積得点: ${totalScore.value}点`;
  messageType.value = 'success';

  // 勝利判定
  if (totalScore.value >= props.targetScore) {
    finishGame();
    return;
  }

  // 次のターンへ
  turnScore.value = 0;
  turnCount.value++;

  setTimeout(() => {
    message.value = '次のターンです。サイコロを振りましょう！';
    messageType.value = 'info';
  }, 1500);
}

// ゲーム終了
async function finishGame() {
  isGameFinished.value = true;
  message.value = `🎉 おめでとうございます！${turnCount.value}ターンでクリア！`;
  messageType.value = 'success';

  // 統計更新
  await updateStats();
}

// 統計更新
async function updateStats() {
  const currentStats = await loadStatsFromStorage();

  // 最少ターン数の更新
  const newBestTurnCount = currentStats.bestTurnCount === null
    ? turnCount.value
    : Math.min(currentStats.bestTurnCount, turnCount.value);

  // 平均ターン数の計算
  const newTotalGames = currentStats.totalGames + 1;
  const newAverageTurnCount =
    ((currentStats.averageTurnCount || 0) * currentStats.totalGames + turnCount.value) / newTotalGames;

  // 最高ターン得点の更新
  const newHighestTurnScore = Math.max(currentStats.highestTurnScore, stats.value.highestTurnScore);

  const newStats: Stats = {
    totalGames: newTotalGames,
    bestTurnCount: newBestTurnCount,
    averageTurnCount: Math.round(newAverageTurnCount * 10) / 10,
    highestTurnScore: newHighestTurnScore,
  };

  await storage.saveData(`${props.gameSlug}-stats`, newStats);
  stats.value = newStats;
}

// 統計読み込み
async function loadStatsFromStorage(): Promise<Stats> {
  const data = await storage.getData(`${props.gameSlug}-stats`);
  return data || {
    totalGames: 0,
    bestTurnCount: null,
    averageTurnCount: null,
    highestTurnScore: 0,
  };
}

// 危険度チェック
function checkDangerLevel() {
  if (turnScore.value >= 30) {
    message.value = `🔥 超危険！ ${turnScore.value}点 - かなりのハイリスクです！`;
    messageType.value = 'danger';
  } else if (turnScore.value >= 20) {
    message.value = `⚠️ 危険ゾーン！ ${turnScore.value}点 - そろそろやめ時かも？`;
    messageType.value = 'warning';
  }
}

// ゲームリセット
function resetGame() {
  totalScore.value = 0;
  turnScore.value = 0;
  turnCount.value = 1;
  isGameFinished.value = false;
  isBurst.value = false;
  dice.value.value = 1;
  message.value = '「サイコロを振る」を押してゲームを開始！';
  messageType.value = 'info';
}

// 計算プロパティ
const canRoll = computed(() => !isRolling.value && !isGameFinished.value && !isBurst.value);
const canHold = computed(() => !isRolling.value && !isGameFinished.value && turnScore.value > 0 && !isBurst.value);

// 危険度レベル
const dangerLevel = computed(() => {
  if (turnScore.value >= 30) return 'danger';
  if (turnScore.value >= 20) return 'warning';
  return 'safe';
});

// 初期化
onMounted(async () => {
  stats.value = await loadStatsFromStorage();
});
</script>

<template>
  <div>
    <!-- ゲーム状態表示 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="text-center">
              <div class="small text-dark">目標</div>
              <div class="fs-4 fw-bold text-primary">{{ targetScore }}点</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="text-center">
              <div class="small text-dark">累積得点</div>
              <div class="fs-4 fw-bold text-dark">{{ totalScore }}点</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="text-center">
              <div class="small text-dark">ターン数</div>
              <div class="fs-4 fw-bold text-dark">{{ turnCount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 現在のターン -->
    <div class="card mb-4">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">今回のターン</h3>

        <!-- ターン得点表示 -->
        <div class="text-center mb-4">
          <div class="small text-dark mb-2">ターン得点</div>
          <div
            :class="[
              'display-4 fw-bold',
              dangerLevel === 'danger' ? 'text-danger' :
              dangerLevel === 'warning' ? 'text-warning' :
              'text-success'
            ]"
          >
            {{ turnScore }}点
          </div>

          <!-- 危険度バッジ -->
          <div v-if="dangerLevel !== 'safe' && !isGameFinished" class="mt-2">
            <span
              :class="[
                'badge fs-6',
                dangerLevel === 'danger' ? 'bg-danger' : 'bg-warning'
              ]"
            >
              {{ dangerLevel === 'danger' ? '🔥 超危険！' : '⚠️ 危険ゾーン' }}
            </span>
          </div>
        </div>

        <!-- サイコロ表示 -->
        <div class="d-flex justify-content-center mb-4">
          <DiceDisplay :dice="dice" size="lg" />
        </div>

        <!-- メッセージ -->
        <div
          :class="[
            'alert text-center mb-4',
            `alert-${messageType}`
          ]"
          role="status"
          aria-live="polite"
        >
          {{ message }}
        </div>

        <!-- コントロールボタン -->
        <div v-if="!isGameFinished" class="d-flex gap-3 justify-content-center flex-wrap">
          <button
            @click="rollDice"
            :disabled="!canRoll"
            class="btn btn-primary btn-lg"
            type="button"
          >
            {{ isRolling ? 'サイコロを振っています...' : 'サイコロを振る' }}
          </button>

          <button
            @click="holdScore"
            :disabled="!canHold"
            class="btn btn-success btn-lg"
            type="button"
          >
            やめる（得点確定）
          </button>
        </div>

        <!-- ゲーム終了後のボタン -->
        <div v-else class="text-center">
          <button
            @click="resetGame"
            class="btn btn-primary btn-lg"
            type="button"
          >
            新しいゲームを開始
          </button>
        </div>
      </div>
    </div>

    <!-- 統計表示 -->
    <div class="card">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">📊 統計</h3>

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
                <div class="small text-dark">最少ターン数</div>
                <div class="fs-4 fw-bold text-primary">{{ stats.bestTurnCount ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">平均ターン数</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.averageTurnCount ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">最高ターン得点</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.highestTurnScore }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 目標表示 -->
        <div v-if="stats.bestTurnCount !== null" class="mt-4 text-center">
          <div class="alert alert-info mb-0">
            <strong>目標:</strong> 最少ターン数7回以下を目指そう！
            <span v-if="stats.bestTurnCount <= 7" class="ms-2">🎉 達成済み！</span>
          </div>
        </div>
      </div>
    </div>

    <!-- リセットボタン -->
    <div v-if="!isGameFinished" class="text-center mt-4">
      <button @click="resetGame" class="btn btn-secondary" type="button">
        ゲームをリセット
      </button>
    </div>
  </div>
</template>

<style scoped>
/* バースト時のアニメーション */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.alert-danger {
  animation: shake 0.3s ease-in-out;
}
</style>
