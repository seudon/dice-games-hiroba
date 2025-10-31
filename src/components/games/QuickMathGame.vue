<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
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
const diceCount = ref(2);
const dice = ref<Dice[]>([]);
const userAnswer = ref('');
const correctAnswer = ref(0);
const isAnswering = ref(false);
const gameStarted = ref(false);
const startTime = ref(0);
const currentTime = ref(0);
const timerInterval = ref<number | null>(null);
const answerInput = ref<HTMLInputElement | null>(null);

// 統計
const totalQuestions = ref(0);
const correctCount = ref(0);
const incorrectCount = ref(0);
const totalTime = ref(0);
const fastestTime = ref<number | null>(null);
const currentStreak = ref(0);
const longestStreak = ref(0);

// 結果メッセージ
const resultMessage = ref('');
const isCorrect = ref(false);
const lastAnswerTime = ref(0);

// Stats
const stats = ref({
  totalGames: 0,
  bestScore: null as number | null,
  averageScore: null as number | null,
  recentRecords: [] as GameRecord[],
});

// Computed
const elapsedTime = computed(() => {
  if (!isAnswering.value) return 0;
  return currentTime.value - startTime.value;
});

const elapsedSeconds = computed(() => {
  return (elapsedTime.value / 1000).toFixed(2);
});

const correctRate = computed(() => {
  if (totalQuestions.value === 0) return 0;
  return Math.round((correctCount.value / totalQuestions.value) * 100);
});

const averageTime = computed(() => {
  if (correctCount.value === 0) return 0;
  return (totalTime.value / correctCount.value / 1000).toFixed(2);
});

// サイコロ初期化
function initDice() {
  const values = rollMultipleDice(diceCount.value);
  dice.value = values.map((value, i) => ({
    id: i,
    value: value,
    isRolling: false,
  }));
  correctAnswer.value = values.reduce((a, b) => a + b, 0);
}

// ゲームを開始
function startGame() {
  gameStarted.value = true;
  loadStats(); // サイコロ個数に応じた統計をロード
  startNewQuestion();
}

// 新しい問題を開始
async function startNewQuestion() {
  // サイコロをロール
  dice.value.forEach(d => d.isRolling = true);

  // 結果メッセージをクリア
  resultMessage.value = '';
  userAnswer.value = '';

  await new Promise(resolve => setTimeout(resolve, 500));

  initDice();
  dice.value.forEach(d => d.isRolling = false);

  // タイマー開始
  isAnswering.value = true;
  startTime.value = Date.now();
  currentTime.value = Date.now();

  // タイマー更新
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value);
  }
  timerInterval.value = window.setInterval(() => {
    currentTime.value = Date.now();
  }, 10);

  // DOMが更新された後に入力フィールドにフォーカス
  await nextTick();
  answerInput.value?.focus();
}

// 回答を送信
function submitAnswer() {
  if (!isAnswering.value || userAnswer.value === '') return;

  // タイマー停止
  isAnswering.value = false;
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }

  const answerTime = Date.now() - startTime.value;
  lastAnswerTime.value = answerTime;
  totalQuestions.value++;

  const answer = parseInt(userAnswer.value, 10);

  if (answer === correctAnswer.value) {
    // 正解
    correctCount.value++;
    currentStreak.value++;
    totalTime.value += answerTime;
    isCorrect.value = true;

    if (longestStreak.value < currentStreak.value) {
      longestStreak.value = currentStreak.value;
    }

    if (fastestTime.value === null || answerTime < fastestTime.value) {
      fastestTime.value = answerTime;
    }

    resultMessage.value = `🎉 正解！ (${(answerTime / 1000).toFixed(2)}秒)`;

    // 記録を保存（正解時のみ）
    saveRecord(answerTime);
  } else {
    // 不正解
    incorrectCount.value++;
    currentStreak.value = 0;
    isCorrect.value = false;
    resultMessage.value = `❌ 不正解… 正解は ${correctAnswer.value} でした`;
  }
}

// Enterキーで送信（グローバルハンドラー）
function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    // 入力フィールドにフォーカスがある場合は何もしない（デフォルトの動作に任せる）
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT') {
      return;
    }

    // 結果メッセージが表示されている場合は次の問題へ
    if (resultMessage.value && !isAnswering.value) {
      event.preventDefault();
      startNewQuestion();
    }
  }
}

// 記録を保存
async function saveRecord(answerTime: number) {
  const record: GameRecord = {
    id: `${Date.now()}-${Math.random()}`,
    gameSlug: props.gameSlug,
    diceCount: diceCount.value,
    attempts: answerTime, // ミリ秒単位の回答時間
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
  totalQuestions.value = 0;
  correctCount.value = 0;
  incorrectCount.value = 0;
  totalTime.value = 0;
  fastestTime.value = null;
  currentStreak.value = 0;
  longestStreak.value = 0;
  resultMessage.value = '';
  userAnswer.value = '';
  isAnswering.value = false;
  gameStarted.value = false;
  diceCount.value = 2; // デフォルトに戻す

  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }

  initDice();
}

// 初期化
onMounted(() => {
  initDice();

  // グローバルなEnterキーのイベントリスナーを追加
  window.addEventListener('keydown', handleKeyPress);
});

// クリーンアップ
onUnmounted(() => {
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value);
  }

  // イベントリスナーを削除
  window.removeEventListener('keydown', handleKeyPress);
});
</script>

<template>
  <div>
    <!-- ゲーム説明 -->
    <div class="card mb-4">
      <div class="card-body">
        <h3 class="h5 fw-bold mb-3">📝 ルール</h3>
        <p class="text-dark mb-2">サイコロの合計を素早く計算して答えましょう！</p>
        <p class="text-dark mb-0">正確さとスピードの両方を意識して挑戦してください</p>
      </div>
    </div>

    <!-- サイコロ表示 -->
    <div class="mb-4">
      <DiceTray :dice="dice" />
    </div>

    <!-- ゲーム開始前 -->
    <div v-if="!gameStarted" class="card mb-4">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">ゲーム設定</h3>

        <!-- サイコロ個数選択 -->
        <div class="mb-4">
          <label for="dice-count-select" class="form-label fw-bold">サイコロの個数を選択:</label>
          <select
            id="dice-count-select"
            v-model.number="diceCount"
            class="form-select"
            @change="initDice"
          >
            <option v-for="n in 14" :key="n + 1" :value="n + 1">
              {{ n + 1 }}個{{ n + 1 === 2 ? ' (おすすめ)' : '' }}
            </option>
          </select>
          <div class="mt-2 text-dark">
            <small>
              {{ diceCount }}個のサイコロの合計: 最小{{ diceCount }} 〜 最大{{ diceCount * 6 }}
            </small>
          </div>
        </div>

        <div class="text-center">
          <p class="text-dark mb-3">準備ができたらゲームを開始しましょう！</p>
          <button
            @click="startGame"
            class="btn btn-primary btn-lg"
            type="button"
          >
            ゲーム開始
          </button>
        </div>
      </div>
    </div>

    <!-- タイマーと入力エリア -->
    <div v-else class="card mb-4">
      <div class="card-body">
        <!-- タイマー表示 -->
        <div v-if="isAnswering" class="text-center mb-3">
          <div class="small text-dark">経過時間</div>
          <div class="display-4 fw-bold text-primary">{{ elapsedSeconds }}秒</div>
        </div>

        <!-- 結果メッセージ -->
        <div
          v-if="resultMessage"
          :class="[
            'alert text-center fw-bold mb-3',
            isCorrect ? 'alert-success' : 'alert-danger'
          ]"
          role="status"
          aria-live="polite"
        >
          {{ resultMessage }}
          <div v-if="isCorrect" class="mt-2">
            <span class="badge bg-success">連続正解: {{ currentStreak }}回</span>
          </div>
        </div>

        <!-- 入力フォーム -->
        <div v-if="!resultMessage" class="text-center">
          <label for="answer-input" class="form-label fw-bold">答えを入力してください:</label>
          <div class="d-flex gap-2 justify-content-center align-items-center flex-wrap">
            <input
              id="answer-input"
              ref="answerInput"
              v-model="userAnswer"
              type="number"
              class="form-control"
              style="max-width: 200px;"
              placeholder="合計は?"
              :disabled="!isAnswering"
              @keydown.enter="submitAnswer"
              aria-label="サイコロの合計を入力"
            >
            <button
              @click="submitAnswer"
              :disabled="!isAnswering || userAnswer === ''"
              class="btn btn-primary btn-lg"
              type="button"
            >
              回答する
            </button>
          </div>
          <div class="text-dark mt-2">
            <small>Enterキーでも送信できます</small>
          </div>
        </div>

        <!-- 次の問題ボタン -->
        <div v-else class="text-center">
          <button
            @click="startNewQuestion"
            class="btn btn-primary btn-lg"
            type="button"
          >
            次の問題へ
          </button>
          <div class="text-dark mt-2">
            <small>Enterキーでも進めます</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 現在のセッション統計 -->
    <div v-if="gameStarted" class="card mb-4">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">📊 今回のセッション (サイコロ{{ diceCount }}個)</h3>

        <div class="row row-cols-2 row-cols-md-3 g-3">
          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">問題数</div>
                <div class="fs-4 fw-bold text-dark">{{ totalQuestions }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">正解</div>
                <div class="fs-4 fw-bold text-success">{{ correctCount }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">不正解</div>
                <div class="fs-4 fw-bold text-danger">{{ incorrectCount }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">正解率</div>
                <div class="fs-4 fw-bold text-primary">{{ correctRate }}%</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">平均時間</div>
                <div class="fs-4 fw-bold text-dark">{{ averageTime }}秒</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">最速記録</div>
                <div class="fs-4 fw-bold text-dark">
                  {{ fastestTime ? (fastestTime / 1000).toFixed(2) : '-' }}秒
                </div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">連続正解</div>
                <div class="fs-4 fw-bold text-dark">{{ currentStreak }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">最長連続</div>
                <div class="fs-4 fw-bold text-dark">{{ longestStreak }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center mt-3">
          <button
            @click="resetGame"
            class="btn btn-secondary"
            type="button"
          >
            セッションをリセット
          </button>
        </div>
      </div>
    </div>

    <!-- 全体の記録 -->
    <div class="card">
      <div class="card-body">
        <h3 class="h5 fw-bold text-center mb-4">🏆 全体の記録 (サイコロ{{ diceCount }}個)</h3>

        <div class="row row-cols-2 row-cols-md-4 g-3 mb-4">
          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">総正解数</div>
                <div class="fs-4 fw-bold text-dark">{{ stats.totalGames }}</div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">最速記録</div>
                <div class="fs-4 fw-bold text-dark">
                  {{ stats.bestScore ? (stats.bestScore / 1000).toFixed(2) : '-' }}秒
                </div>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="card bg-light">
              <div class="card-body text-center">
                <div class="small text-dark">全体平均時間</div>
                <div class="fs-4 fw-bold text-dark">
                  {{ stats.averageScore ? (stats.averageScore / 1000).toFixed(2) : '-' }}秒
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近の記録 -->
        <div v-if="stats.recentRecords.length > 0">
          <h4 class="h6 fw-bold mb-3">最近の正解記録</h4>
          <div class="list-group">
            <div
              v-for="record in stats.recentRecords.slice(0, 5)"
              :key="record.id"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <span class="text-dark small">{{ record.dateString }}</span>
              <span class="badge bg-primary">{{ (record.attempts / 1000).toFixed(2) }}秒</span>
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
