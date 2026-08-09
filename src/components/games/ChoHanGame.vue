<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DiceDisplay from '../common/DiceDisplay.vue';
import DiceTray from '../common/DiceTray.vue';
import type { Dice } from '../../types/game';
import { LocalStorageAdapter } from '../../lib/storage/LocalStorage';

// Props
interface Props {
  gameSlug: string;
}

const props = defineProps<Props>();

// ゲーム状態
type GamePhase = 'betting' | 'result' | 'gameOver';
type BetChoice = 'cho' | 'han' | null;

const INITIAL_MONEY = 1000;
const MAX_ROUNDS = 10;
const BET_UNIT = 100;

const gamePhase = ref<GamePhase>('betting');
const money = ref<number>(INITIAL_MONEY);
const currentRound = ref<number>(0);
const betAmount = ref<number>(100);
const customBetInput = ref<string>('100');
const betChoice = ref<BetChoice>(null);
const dice = ref<Dice[]>([
  { id: 1, value: 1, isRolling: false },
  { id: 2, value: 1, isRolling: false }
]);
const lastResult = ref<'win' | 'lose' | null>(null);
const resultMessage = ref<string>('');

// 統計
interface GameStats {
  totalGames: number;
  maxMoney: number;
  maxRounds: number;
  bankruptcies: number;
}

const stats = ref<GameStats>({
  totalGames: 0,
  maxMoney: INITIAL_MONEY,
  maxRounds: 0,
  bankruptcies: 0,
});

const storage = new LocalStorageAdapter();

// 計算プロパティ
const diceSum = computed(() => dice.value[0].value + dice.value[1].value);
const isEven = computed(() => diceSum.value % 2 === 0);
const canBet = computed(() => money.value >= BET_UNIT);
const maxBetAmount = computed(() => Math.floor(money.value / BET_UNIT) * BET_UNIT);

// サイコロ初期化（アニメーションなし）
function initDice(): void {
  dice.value = [
    { id: 1, value: 1, isRolling: false },
    { id: 2, value: 1, isRolling: false }
  ];
}

// サイコロを振る（アニメーション付き）
async function rollDice(): Promise<void> {
  // アニメーション開始
  dice.value.forEach(d => d.isRolling = true);

  // アニメーション中にランダムな値を表示（演出）
  const animationInterval = setInterval(() => {
    dice.value.forEach(d => {
      d.value = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    });
  }, 50);

  // 500ms後に最終結果を表示
  await new Promise(resolve => setTimeout(resolve, 500));
  clearInterval(animationInterval);

  // 最終結果
  const value1 = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  const value2 = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;

  dice.value = [
    { id: 1, value: value1, isRolling: false },
    { id: 2, value: value2, isRolling: false }
  ];
}

// ベット額設定
function setBet(amount: number): void {
  if (amount > money.value) {
    betAmount.value = maxBetAmount.value;
    customBetInput.value = String(maxBetAmount.value);
  } else {
    betAmount.value = amount;
    customBetInput.value = String(amount);
  }
}

// カスタムベット入力処理
function updateCustomBet(): void {
  const value = parseInt(customBetInput.value) || 0;
  // 100円単位に丸める
  const rounded = Math.floor(value / BET_UNIT) * BET_UNIT;

  if (rounded < BET_UNIT) {
    setBet(BET_UNIT);
  } else if (rounded > money.value) {
    setBet(maxBetAmount.value);
  } else {
    setBet(rounded);
  }
}

// 丁半を選択してゲーム実行
async function placeBet(choice: 'cho' | 'han'): Promise<void> {
  if (!canBet.value || betAmount.value < BET_UNIT || betAmount.value > money.value) {
    return;
  }

  betChoice.value = choice;
  currentRound.value++;

  // サイコロを振る（アニメーション完了を待つ）
  await rollDice();

  // 判定
  const playerChoice = choice === 'cho'; // cho = 偶数 = true
  const result = isEven.value;
  const won = playerChoice === result;

  lastResult.value = won ? 'win' : 'lose';

  if (won) {
    // 勝利: 掛け金の2倍を獲得（掛け金 + 配当）
    money.value += betAmount.value;
    resultMessage.value = `${betAmount.value}円獲得！`;
  } else {
    // 敗北: 掛け金没収
    money.value -= betAmount.value;
    resultMessage.value = `${betAmount.value}円失う...`;
  }

  // 統計更新
  if (money.value > stats.value.maxMoney) {
    stats.value.maxMoney = money.value;
  }

  // ゲーム終了判定
  if (money.value <= 0) {
    // 破産
    gamePhase.value = 'gameOver';
    stats.value.bankruptcies++;
    finishGame();
  } else if (currentRound.value >= MAX_ROUNDS) {
    // 最大ラウンド到達
    gamePhase.value = 'gameOver';
    finishGame();
  } else {
    gamePhase.value = 'result';
  }
}

// 次のラウンドへ
function nextRound(): void {
  gamePhase.value = 'betting';
  lastResult.value = null;
  betChoice.value = null;
  resultMessage.value = '';

  // ベット額を調整（所持金が足りない場合）
  if (betAmount.value > money.value) {
    setBet(maxBetAmount.value);
  }
}

// やめる
function quitGame(): void {
  gamePhase.value = 'gameOver';
  finishGame();
}

// ゲーム終了処理
function finishGame(): void {
  stats.value.totalGames++;
  if (currentRound.value > stats.value.maxRounds) {
    stats.value.maxRounds = currentRound.value;
  }
  saveStats();
}

// 新しいゲーム開始
function startNewGame(): void {
  money.value = INITIAL_MONEY;
  currentRound.value = 0;
  betAmount.value = 100;
  customBetInput.value = '100';
  betChoice.value = null;
  lastResult.value = null;
  resultMessage.value = '';
  gamePhase.value = 'betting';
  initDice(); // アニメーションなしで初期化
}

// 統計クリア
function clearStats(): void {
  if (confirm('統計をクリアしますか？この操作は取り消せません。')) {
    stats.value = {
      totalGames: 0,
      maxMoney: INITIAL_MONEY,
      maxRounds: 0,
      bankruptcies: 0,
    };
    saveStats();
  }
}

// 統計の永続化（LocalStorageAdapter経由）
async function loadStats(): Promise<void> {
  const data = await storage.getData<{ stats: GameStats }>(props.gameSlug);
  if (data?.stats) {
    stats.value = data.stats;
  }
}

async function saveStats(): Promise<void> {
  try {
    await storage.saveData(props.gameSlug, { stats: stats.value });
  } catch (error) {
    // 統計の保存に失敗してもゲーム進行は妨げない
    console.error('Failed to save stats:', error);
  }
}

// 初期化
onMounted(() => {
  loadStats();
  initDice();
});
</script>

<template>
  <div class="cho-han-game">
    <!-- ゲーム状況（1行表示） -->
    <div class="card bg-light mb-4">
      <div class="card-body py-2">
        <div class="d-flex justify-content-around align-items-center flex-wrap gap-3">
          <div class="text-center">
            <small class="text-muted d-block">所持金</small>
            <span class="fw-bold" :class="{
              'text-success': money >= INITIAL_MONEY,
              'text-warning': money < INITIAL_MONEY && money > 0,
              'text-danger': money <= 0
            }">{{ money }}円</span>
          </div>
          <div class="text-center">
            <small class="text-muted d-block">ラウンド</small>
            <span class="text-dark">{{ currentRound }} / {{ MAX_ROUNDS }}</span>
          </div>
          <div class="text-center">
            <small class="text-muted d-block">現在のベット</small>
            <span class="text-dark fw-bold">{{ betAmount }}円</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ベット額選択（betting と result と破産時に表示） -->
    <div v-if="gamePhase === 'betting' || gamePhase === 'result' || (gamePhase === 'gameOver' && money <= 0)" class="betting-section">
      <!-- ベット額選択 -->
      <div class="card bg-light mb-4">
        <div class="card-body">
          <h3 class="h5 card-title text-dark mb-3">💵 ベット額を選択</h3>

          <!-- クイックベット -->
          <div class="d-flex flex-wrap gap-2 mb-3">
            <button
              @click="setBet(100)"
              class="btn btn-outline-primary flex-fill"
              :disabled="gamePhase !== 'betting' || money < 100"
            >
              100円
            </button>
            <button
              @click="setBet(500)"
              class="btn btn-outline-primary flex-fill"
              :disabled="gamePhase !== 'betting' || money < 500"
            >
              500円
            </button>
            <button
              @click="setBet(1000)"
              class="btn btn-outline-primary flex-fill"
              :disabled="gamePhase !== 'betting' || money < 1000"
            >
              1000円
            </button>
            <button
              @click="setBet(maxBetAmount)"
              class="btn btn-outline-danger flex-fill"
              :disabled="gamePhase !== 'betting' || !canBet"
            >
              全額 ({{ maxBetAmount }}円)
            </button>
          </div>

          <!-- カスタムベット -->
          <div class="input-group">
            <input
              type="number"
              v-model="customBetInput"
              @blur="updateCustomBet"
              @keyup.enter="updateCustomBet"
              class="form-control"
              :min="BET_UNIT"
              :max="maxBetAmount"
              :step="BET_UNIT"
              placeholder="カスタム額（100円単位）"
              :disabled="gamePhase !== 'betting'"
            />
            <span class="input-group-text">円</span>
            <button
              @click="updateCustomBet"
              class="btn btn-outline-secondary"
              :disabled="gamePhase !== 'betting'"
            >
              設定
            </button>
          </div>
          <small class="text-muted d-block mt-2">
            ※100円単位で入力してください（最大: {{ maxBetAmount }}円）
          </small>
        </div>
      </div>

      <!-- サイコロ表示 -->
      <div class="mb-4">
        <h3 class="h5 text-dark text-center mb-3">🎲 サイコロ</h3>
        <DiceTray :dice="dice" size="lg" />
        <div class="text-center mt-3">
          <p class="text-dark mb-1">
            合計: <span class="fs-4 fw-bold">{{ diceSum }}</span>
          </p>
        </div>
      </div>

      <!-- 丁半選択 -->
      <div v-if="gamePhase === 'betting'" class="card bg-light mb-4">
        <div class="card-body">
          <h3 class="h5 card-title text-dark mb-3">🎯 丁か半を選択</h3>
          <div class="d-flex gap-3">
            <button
              @click="placeBet('cho')"
              class="btn btn-primary btn-lg flex-fill"
              :disabled="!canBet || betAmount < BET_UNIT || betAmount > money"
            >
              丁（偶数）
            </button>
            <button
              @click="placeBet('han')"
              class="btn btn-warning btn-lg flex-fill"
              :disabled="!canBet || betAmount < BET_UNIT || betAmount > money"
            >
              半（奇数）
            </button>
          </div>
          <p class="text-center text-muted mt-3 mb-0">
            {{ betAmount }}円をベットして勝負！
          </p>
        </div>
      </div>

      <!-- 結果表示（resultフェーズと破産時） -->
      <div v-else-if="gamePhase === 'result' || (gamePhase === 'gameOver' && money <= 0)" class="result-display mb-4">
        <div class="card mb-4" :class="{
          'bg-success': lastResult === 'win',
          'bg-danger': lastResult === 'lose'
        }">
          <div class="card-body text-center">
            <h3 class="h4 text-white mb-3">
              {{ lastResult === 'win' ? '🎉 勝利！' : '😢 敗北...' }}
            </h3>
            <p class="text-white mb-2">
              あなたの選択:
              <span class="badge bg-light text-dark">
                {{ betChoice === 'cho' ? '丁（偶数）' : '半（奇数）' }}
              </span>
              /
              結果:
              <span class="badge bg-light text-dark">
                {{ isEven ? '丁（偶数）' : '半（奇数）' }}
              </span>
            </p>
            <p class="text-white fs-5 fw-bold mb-0">
              {{ resultMessage }}
            </p>
          </div>
        </div>

        <!-- 次のラウンドへボタン（通常時） -->
        <div v-if="gamePhase === 'result'" class="text-center mb-4">
          <button
            @click="nextRound"
            class="btn btn-primary btn-lg"
          >
            次のラウンドへ
          </button>
        </div>

        <!-- 破産時のメッセージとボタン -->
        <div v-else-if="gamePhase === 'gameOver' && money <= 0" class="text-center mb-4">
          <div class="card bg-danger mb-3">
            <div class="card-body">
              <h4 class="text-white mb-2">💸 破産しました...</h4>
              <p class="text-white mb-0">
                {{ currentRound }}ラウンド目で所持金が尽きました
              </p>
            </div>
          </div>
          <button
            @click="startNewGame"
            class="btn btn-primary btn-lg"
          >
            もう一度プレイ
          </button>
        </div>
      </div>
    </div>

    <!-- ゲームオーバー（最大ラウンド到達時のみ） -->
    <div v-else-if="gamePhase === 'gameOver' && money > 0" class="game-over-phase">
      <div class="card bg-light mb-4">
        <div class="card-body text-center">
          <h3 class="h3 text-dark mb-4">
            {{ money <= 0 ? '💸 破産...' : '🎊 ゲーム終了' }}
          </h3>

          <div class="mb-4">
            <p class="text-dark mb-2">最終所持金:</p>
            <p class="fs-2 fw-bold mb-0" :class="{
              'text-success': money > INITIAL_MONEY,
              'text-warning': money === INITIAL_MONEY,
              'text-danger': money < INITIAL_MONEY
            }">
              {{ money }}円
            </p>
            <p class="text-muted mt-2">
              {{ money > INITIAL_MONEY ? `+${money - INITIAL_MONEY}円` : money < INITIAL_MONEY ? `${money - INITIAL_MONEY}円` : '±0円' }}
            </p>
          </div>

          <div class="mb-4">
            <p class="text-dark mb-2">プレイしたラウンド:</p>
            <p class="fs-4 fw-bold text-dark mb-0">{{ currentRound }} / {{ MAX_ROUNDS }}</p>
          </div>

          <button
            @click="startNewGame"
            class="btn btn-primary btn-lg w-100"
          >
            もう一度プレイ
          </button>
        </div>
      </div>
    </div>

    <!-- 統計エリア（全フェーズ共通・最下部） -->
    <div class="card bg-light mt-4">
      <div class="card-body">
        <h3 class="h5 card-title text-dark mb-3">📊 統計</h3>
        <div class="row g-3">
          <div class="col-6 col-md-3">
            <div class="text-center">
              <small class="text-muted d-block">総ゲーム数</small>
              <span class="text-dark fw-bold">{{ stats.totalGames }}回</span>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-center">
              <small class="text-muted d-block">最高所持金</small>
              <span class="text-dark fw-bold">{{ stats.maxMoney }}円</span>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-center">
              <small class="text-muted d-block">最大ラウンド数</small>
              <span class="text-dark fw-bold">{{ stats.maxRounds }}回</span>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-center">
              <small class="text-muted d-block">破産回数</small>
              <span class="text-dark fw-bold">{{ stats.bankruptcies }}回</span>
            </div>
          </div>
        </div>
        <button
          @click="clearStats"
          class="btn btn-sm btn-outline-secondary mt-3 w-100"
        >
          統計をクリア
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cho-han-game {
  max-width: 900px;
  margin: 0 auto;
}

/* レスポンシブ調整 */
@media (max-width: 768px) {
  .cho-han-game {
    padding: 0;
  }
}
</style>
