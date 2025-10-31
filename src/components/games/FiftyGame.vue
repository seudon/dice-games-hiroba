<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { Dice, GameRecord } from '../../types/game';
import { rollMultipleDice } from '../../lib/utils/dice';
import { LocalStorageAdapter } from '../../lib/storage/LocalStorage';
import DiceTray from '../common/DiceTray.vue';

// Props
interface Props {
  gameSlug: string;
}

const props = defineProps<Props>();

// State
const storage = new LocalStorageAdapter();
const dice = ref<Dice[]>([]);
const currentScore = ref(0);
const turns = ref(0);
const isRolling = ref(false);
const isGameFinished = ref(false);
const isBusted = ref(false);
const resultMessage = ref('');

// Stats
const stats = ref({
  totalGames: 0,
  bestScore: null as number | null,
  averageScore: null as number | null,
  recentRecords: [] as GameRecord[],
});

// Computed
const canRoll = computed(() => !isRolling.value && !isGameFinished.value);
const canStop = computed(() => currentScore.value > 0 && !isRolling.value && !isGameFinished.value);

// 危険度の判定
const riskLevel = computed(() => {
  const score = currentScore.value;
  if (score < 35) return 'safe';
  if (score < 41) return 'caution';
  if (score < 46) return 'warning';
  return 'danger';
});

// サイコロ初期化（常に2個）
function initDice() {
  dice.value = Array.from({ length: 2 }, (_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 6 + 1) as any,
    isRolling: false,
  }));
}

// サイコロを振る
async function roll() {
  if (!canRoll.value) return;

  isRolling.value = true;
  turns.value++;

  // アニメーション開始
  dice.value.forEach(d => d.isRolling = true);

  // アニメーション中にランダムな値を表示
  const animationInterval = setInterval(() => {
    dice.value.forEach(d => {
      d.value = Math.floor(Math.random() * 6 + 1) as any;
    });
  }, 50);

  // 500ms後に最終結果を表示
  await new Promise(resolve => setTimeout(resolve, 500));
  clearInterval(animationInterval);

  // 最終結果
  const result = rollMultipleDice(2);
  dice.value.forEach((d, i) => {
    d.value = result[i];
    d.isRolling = false;
  });

  const diceSum = result.reduce((a, b) => a + b, 0);
  currentScore.value += diceSum;

  isRolling.value = false;

  // 結果判定
  if (currentScore.value === 50) {
    // 50ぴったり！
    isGameFinished.value = true;
    resultMessage.value = `🎉 おめでとうございます! ${turns.value}ターンで50達成!`;
    await saveRecord();
  } else if (currentScore.value > 50) {
    // バースト
    isBusted.value = true;
    isGameFinished.value = true;
    resultMessage.value = `💥 バースト! ${currentScore.value}点になってしまいました...`;
  } else {
    // 継続中
    const remaining = 50 - currentScore.value;
    resultMessage.value = `現在${currentScore.value}点！あと${remaining}点です`;
  }
}

// ゲームを止める
function stopGame() {
  if (!canStop.value) return;

  isGameFinished.value = true;
  resultMessage.value = `ゲーム終了。${currentScore.value}点で止めました。(${turns.value}ターン)`;
}

// 記録を保存（50到達時のみ）
async function saveRecord() {
  const record: GameRecord = {
    id: `${Date.now()}-${Math.random()}`,
    gameSlug: props.gameSlug,
    diceCount: 2,
    attempts: turns.value, // ターン数を記録
    timestamp: Date.now(),
    dateString: new Date().toLocaleString('ja-JP'),
  };

  await storage.saveRecord(record);
  await loadStats();
}

// 統計を読み込む
async function loadStats() {
  stats.value = await storage.getStats(props.gameSlug, 2);
}

// ゲームリセット
function resetGame() {
  currentScore.value = 0;
  turns.value = 0;
  isGameFinished.value = false;
  isBusted.value = false;
  resultMessage.value = '';
  initDice();
}

// 初期化
onMounted(() => {
  initDice();
  loadStats();
});
</script>

<template>
  <div>
    <!-- ゲーム説明 -->
    <div class="card mb-4">
      <div class="card-body">
        <h3 class="h5 fw-bold mb-3">🎯 目標</h3>
        <p class="text-dark mb-2">サイコロを振って合計を<strong>50ぴったり</strong>にしよう！</p>
        <p class="text-dark mb-0">⚠️ 50を超えたらバースト（失敗）です</p>
      </div>
    </div>

    <!-- スコア表示 -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row row-cols-3 g-3 text-center">
          <div class="col">
            <div class="small text-dark">現在のスコア</div>
            <div class="display-4 fw-bold" :class="{
              'text-success': riskLevel === 'safe',
              'text-primary': riskLevel === 'caution',
              'text-warning': riskLevel === 'warning',
              'text-danger': riskLevel === 'danger'
            }">
              {{ currentScore }}
            </div>
          </div>
          <div class="col">
            <div class="small text-dark">あと</div>
            <div class="display-4 fw-bold text-dark">{{ 50 - currentScore }}</div>
          </div>
          <div class="col">
            <div class="small text-dark">ターン数</div>
            <div class="display-4 fw-bold text-dark">{{ turns }}</div>
          </div>
        </div>

        <!-- 危険度インジケーター -->
        <div v-if="currentScore > 0 && !isGameFinished" class="mt-3">
          <div class="alert mb-0" :class="{
            'alert-success': riskLevel === 'safe',
            'alert-info': riskLevel === 'caution',
            'alert-warning': riskLevel === 'warning',
            'alert-danger': riskLevel === 'danger'
          }">
            <strong v-if="riskLevel === 'safe'">✅ 安全ゾーン</strong>
            <strong v-else-if="riskLevel === 'caution'">⚠️ 注意ゾーン</strong>
            <strong v-else-if="riskLevel === 'warning'">⚡ 警告ゾーン</strong>
            <strong v-else>🔥 危険ゾーン！</strong>

            <span v-if="riskLevel === 'safe'"> - 積極的に振りましょう</span>
            <span v-else-if="riskLevel === 'caution'"> - 慎重に判断を</span>
            <span v-else-if="riskLevel === 'warning'"> - バーストのリスクあり</span>
            <span v-else> - 止めることも検討しましょう</span>
          </div>
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
        isGameFinished && !isBusted ? 'alert-success' :
        isBusted ? 'alert-danger' : 'alert-info'
      ]"
      role="status"
      aria-live="polite"
    >
      {{ resultMessage }}
    </div>

    <!-- コントロール -->
    <div class="card mb-4">
      <div class="card-body">
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
            @click="stopGame"
            :disabled="!canStop"
            class="btn btn-warning btn-lg"
            type="button"
          >
            ここで止める
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
        <h3 class="h5 fw-bold text-center mb-4">📊 記録表</h3>

        <!-- 統計グリッド -->
        <div class="row row-cols-2 row-cols-md-4 g-3 mb-4">
          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">今回のターン数</div>
                <div class="fs-4 fw-bold text-primary">{{ turns }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">最少ターン記録</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.bestScore ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">平均ターン数</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.averageScore ?? '-' }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">成功回数</div>
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
              <span class="badge bg-primary">{{ record.attempts }}ターンで達成</span>
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
