<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { Dice, GameRecord } from '../../types/game';
import {
  rollMultipleDice,
  isZorome,
  calculateZoromeProbability,
  formatProbability,
  formatProbabilityAsFraction
} from '../../lib/utils/dice';
import { LocalStorageAdapter } from '../../lib/storage/LocalStorage';
import DiceTray from '../common/DiceTray.vue';

// Props
interface Props {
  gameSlug: string;
  minDice?: number;
  maxDice?: number;
  defaultDice?: number;
}

const props = withDefaults(defineProps<Props>(), {
  minDice: 2,
  maxDice: 5,
  defaultDice: 2,
});

// State
const storage = new LocalStorageAdapter();
const diceCount = ref(props.defaultDice);
const dice = ref<Dice[]>([]);
const attempts = ref(0);
const isRolling = ref(false);
const isGameFinished = ref(false);
const resultMessage = ref('');

// Stats
const stats = ref({
  totalGames: 0,
  bestScore: null as number | null,
  averageScore: null as number | null,
  recentRecords: [] as GameRecord[],
});

// Computed
const probability = computed(() => {
  const prob = calculateZoromeProbability(diceCount.value);
  return {
    decimal: prob,
    percentage: formatProbability(prob),
    fraction: formatProbabilityAsFraction(diceCount.value),
  };
});

const canRoll = computed(() => !isRolling.value && !isGameFinished.value);

// サイコロ初期化
function initDice() {
  dice.value = Array.from({ length: diceCount.value }, (_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 6 + 1) as any,
    isRolling: false,
  }));
}

// サイコロを振る
async function roll() {
  if (!canRoll.value) return;

  isRolling.value = true;
  attempts.value++;

  // アニメーション開始
  dice.value.forEach(d => d.isRolling = true);

  // アニメーション中にランダムな値を表示(演出)
  const animationInterval = setInterval(() => {
    dice.value.forEach(d => {
      d.value = Math.floor(Math.random() * 6 + 1) as any;
    });
  }, 50);

  // 500ms後に最終結果を表示
  await new Promise(resolve => setTimeout(resolve, 500));
  clearInterval(animationInterval);

  // 最終結果
  const result = rollMultipleDice(diceCount.value);
  dice.value.forEach((d, i) => {
    d.value = result[i];
    d.isRolling = false;
  });

  isRolling.value = false;

  // ぞろ目チェック
  if (isZorome(result)) {
    isGameFinished.value = true;
    resultMessage.value = `🎉 おめでとうございます! ${attempts.value}回でぞろ目達成!`;
    await saveRecord();
  } else {
    resultMessage.value = '残念... もう一度チャレンジ!';
  }
}

// 記録を保存
async function saveRecord() {
  const record: GameRecord = {
    id: `${Date.now()}-${Math.random()}`,
    gameSlug: props.gameSlug,
    diceCount: diceCount.value,
    attempts: attempts.value,
    timestamp: Date.now(),
    dateString: new Date().toLocaleString('ja-JP'),
  };

  await storage.saveRecord(record);
  await loadStats();
}

// 統計を読み込む
async function loadStats() {
  stats.value = await storage.getStats(props.gameSlug, diceCount.value);
}

// ゲームリセット
function resetGame() {
  attempts.value = 0;
  isGameFinished.value = false;
  resultMessage.value = '';
  initDice();
}

// 難易度変更時のリセット
watch(diceCount, () => {
  resetGame();
  loadStats();
});

// 初期化（ブラウザ環境でのみ実行）
onMounted(() => {
  initDice();
  loadStats();
});
</script>

<template>
  <div>
    <!-- 難易度選択 -->
    <div class="card mb-4">
      <div class="card-body">
        <label for="dice-count" class="form-label fw-bold">難易度を選択:</label>
        <select
          id="dice-count"
          v-model.number="diceCount"
          class="form-select"
          :disabled="isRolling || (attempts > 0 && !isGameFinished)"
        >
          <option
            v-for="n in maxDice - minDice + 1"
            :key="n"
            :value="minDice + n - 1"
          >
            {{ minDice + n - 1 }}個 - {{ ['初級', '中級', '上級', '超級'][n - 1] || '超級' }}
          </option>
        </select>

        <div class="alert alert-warning mt-3 mb-0">
          <span class="fw-bold">確率:</span>
          <span class="ms-2">
            {{ probability.fraction }} ({{ probability.percentage }})
          </span>
        </div>
      </div>
    </div>

    <!-- サイコロ表示 -->
    <div class="mb-4">
      <DiceTray :dice="dice" />
    </div>

    <!-- 結果メッセージ -->
    <div
      v-if="resultMessage"
      :class="[
        'alert text-center fw-bold mb-4',
        isGameFinished ? 'alert-success' : 'alert-info'
      ]"
      role="status"
      aria-live="polite"
    >
      {{ resultMessage }}
    </div>

    <!-- コントロール -->
    <div class="card mb-4">
      <div class="card-body text-center">
        <div class="mb-3">
          <span class="text-dark me-2">試行回数:</span>
          <span class="fs-3 fw-bold text-dark">{{ attempts }}回</span>
        </div>

        <div class="d-flex gap-3 justify-content-center flex-wrap">
          <button
            @click="roll"
            :disabled="!canRoll"
            class="btn btn-primary btn-lg"
            type="button"
          >
            {{ isRolling ? 'サイコロを振っています...' : 'サイコロを振る' }}
          </button>

          <button
            @click="resetGame"
            class="btn btn-secondary btn-lg"
            type="button"
          >
            リセット
          </button>
        </div>
      </div>
    </div>

    <!-- 統計表示 -->
    <div class="card">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">📊 記録表 (サイコロ{{ diceCount }}個)</h3>

        <!-- 統計グリッド -->
        <div class="row row-cols-2 row-cols-md-4 g-3 mb-4">
          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">今回の試行回数</div>
                <div class="fs-4 fw-bold text-primary">{{ attempts }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">最高記録</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.bestScore ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">平均回数</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.averageScore ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">挑戦回数</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.totalGames }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 履歴 -->
        <div v-if="stats.recentRecords.length > 0">
          <h4 class="h6 fw-bold mb-3">最近の記録</h4>
          <div class="list-group">
            <div
              v-for="record in stats.recentRecords.slice(0, 5)"
              :key="record.id"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <span class="text-dark small">{{ record.dateString }}</span>
              <span class="badge bg-primary">{{ record.attempts }}回で達成</span>
            </div>
          </div>
        </div>

        <div v-else class="text-center text-dark py-4">
          まだ記録がありません
        </div>
      </div>
    </div>
  </div>
</template>
