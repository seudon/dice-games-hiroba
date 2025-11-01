<template>
  <div class="dice-adventure-game">
    <!-- ゲーム設定（初回のみ表示） -->
    <div v-if="!gameStarted" class="game-setup card">
      <h3 class="setup-title">ゲーム設定</h3>
      <div class="setup-content">
        <label for="event-count" class="setup-label">イベント数を選択してください</label>
        <select
          id="event-count"
          v-model.number="maxEvents"
          class="form-select setup-select"
        >
          <option v-for="n in 6" :key="n + 4" :value="n + 4">
            {{ n + 4 }}回{{ n + 4 === 10 ? ' (標準)' : '' }}
          </option>
        </select>
        <button @click="startGame" class="btn-start">ゲーム開始</button>
      </div>
    </div>

    <div v-if="gameStarted">
      <!-- スタートボタン -->
      <div class="button-group mb-3" ref="newAdventurerButton">
        <button
          @click="startNewAdventurer"
          :disabled="adventurerCount >= maxAdventurers"
          class="btn-primary-custom"
        >
          新しい冒険者を生成 ({{ adventurerCount }}/{{ maxAdventurers }})
        </button>
      </div>

      <!-- 冒険者情報（1カラム） -->
      <div class="mb-3">
        <div class="card adventurer-card">
          <h2 class="card-title">👤 現在の冒険者</h2>
          <div v-if="currentAdventurer" class="adventurer-info">
            <h3 class="adventurer-name">{{ currentAdventurer.name }} ({{ adventurerCount }}人目)</h3>

            <div class="vital-stats">
              <div class="vital-item" :class="{ danger: currentAdventurer.HP <= currentAdventurer.maxHP * 0.3 }">
                <div class="stat-label">耐久力 (HP)</div>
                <div class="stat-value">{{ currentAdventurer.HP }} / {{ currentAdventurer.maxHP }}</div>
              </div>
              <div class="vital-item" :class="{ danger: currentAdventurer.SAN <= currentAdventurer.maxSAN * 0.3 }">
                <div class="stat-label">正気度 (SAN)</div>
                <div class="stat-value">{{ currentAdventurer.SAN }} / {{ currentAdventurer.maxSAN }}</div>
              </div>
            </div>

            <div class="stats-grid">
              <div v-for="stat in ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU', 'MP']" :key="stat" class="stat-item">
                <div class="stat-label">{{ stat }}</div>
                <div class="stat-value">{{ currentAdventurer[stat] }}</div>
              </div>
            </div>
          </div>
          <p v-else class="placeholder-text">冒険者を生成してください</p>
        </div>
      </div>

      <!-- メインゲームエリア（2カラム） -->
      <div class="game-area row g-3">
        <!-- 左カラム：イベント情報 -->
        <div class="col-md-6">
          <div class="card event-card" ref="eventArea">
            <h2 class="card-title">⚔️ イベント</h2>
            <div v-if="currentEvent" class="event-info">
              <div class="event-box">
                <div class="event-text">
                  <p><strong>イベント {{ eventCount }} / {{ maxEvents }}</strong></p>
                  <p>あなたの【{{ currentEvent.statName }}】が試されるイベントが目の前に立ち塞がりました。</p>
                  <p>このイベントに失敗すると【{{ currentEvent.damageTypeName }}】が下がります！</p>
                </div>
                <div class="event-condition">
                  {{ currentEvent.stat }}{{ currentEvent.diffText ? '×5' + currentEvent.diffText : '×5' }} 以下 ({{ currentEvent.threshold }}以下) で成功
                </div>
              </div>
              <div class="text-center mt-3">
                <button
                  @click="rollDice"
                  :disabled="diceRolled"
                  class="btn-primary-custom"
                >
                  🎲 ダイスを振る (D100)
                </button>
              </div>
            </div>
            <p v-else class="placeholder-text">イベント待機中...</p>
          </div>
        </div>

        <!-- 右カラム：ダイスロールエリア -->
        <div class="col-md-6">
          <div class="card dice-card" ref="diceRollArea">
        <h2 class="card-title">🎲 ダイスロール</h2>
        <div class="dice-area">
          <!-- ダイス結果表示 -->
          <div v-if="diceResult" class="dice-display">
            <div>
              <p class="dice-label">十の位</p>
              <div class="dice">{{ diceResult.tens }}</div>
            </div>
            <div>
              <p class="dice-label">一の位</p>
              <div class="dice">{{ diceResult.ones }}</div>
            </div>
          </div>

          <div v-if="diceResult" class="dice-result-value">
            結果: {{ String(diceResult.total).padStart(2, '0') }}
          </div>

          <!-- 成功/失敗メッセージ -->
          <div v-if="resultMessage" class="result-message" :class="resultMessage.class">
            <div v-html="resultMessage.text"></div>
          </div>

          <!-- ダメージダイス -->
          <div v-if="showDamageDice">
            <button @click="rollDamageDice" class="btn-damage">
              ⚠️ ダメージダイスを振る ({{ currentEvent.damageType === 'SAN' ? '2D12' : '2D6' }})
            </button>
          </div>

          <!-- ダメージ結果 -->
          <div v-if="damageResult" class="damage-result">
            <p class="damage-label">ダメージロール ({{ damageResult.diceType }})</p>
            <div class="dice-display">
              <div class="dice damage-dice">{{ damageResult.dice1 }}</div>
              <div class="damage-plus">+</div>
              <div class="dice damage-dice">{{ damageResult.dice2 }}</div>
            </div>
            <div class="damage-value">合計ダメージ: {{ damageResult.damage }}</div>
            <div class="damage-change">
              【{{ currentEvent.damageTypeName }}】 {{ damageResult.before }} → <span :class="damageResult.after <= 0 ? 'text-danger-bright' : damageResult.after <= 10 ? 'text-warning-bright' : 'text-danger'">{{ Math.max(0, damageResult.after) }}</span>
            </div>
          </div>

          <!-- 次へボタン -->
          <div v-if="showNextButton" class="mt-3 text-center">
            <button @click="goToNextEvent" class="btn-primary-custom">次のイベントへ →</button>
          </div>

          <div v-if="showNextAdventurerButton" class="mt-3 text-center">
            <button @click="goToNextAdventurer" class="btn-primary-custom">次の冒険者へ ⬆️</button>
          </div>

          <p v-if="!diceResult" class="placeholder-text">ダイスを振ってください</p>
        </div>
          </div>
        </div>
      </div>

      <!-- 履歴 -->
      <div class="card history-card mt-3">
        <h2 class="card-title">📜 冒険者履歴 ({{ maxEvents }}回イベント)</h2>
        <div v-if="history.length > 0" class="history">
          <div v-for="(record, index) in history" :key="index" class="history-item" :class="record.success ? 'success' : 'failure'">
            <strong>{{ index + 1 }}. {{ record.name }}</strong> - {{ record.success ? '✅ 成功' : '❌ 失敗' }}{{ record.deathCause ? ` (${record.deathCause})` : '' }}<br>
            イベントクリア数: {{ record.eventsCleared }} / {{ maxEvents }}<br>
            最終ステータス: HP {{ record.finalHP }}/{{ record.maxHP }}, SAN {{ record.finalSAN }}/{{ record.maxSAN }}
          </div>
        </div>
        <p v-else class="placeholder-text">まだ冒険者はいません</p>
      </div>

      <!-- 統計 -->
      <div v-if="stats" class="card stats-card mt-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="card-title mb-0">📊 統計情報 ({{ maxEvents }}回イベント)</h2>
          <button @click="clearStats" class="btn btn-sm btn-danger">統計をクリア</button>
        </div>
        <div class="stats-row">
          <div class="stats-box">
            <div class="stat-label">成功者</div>
            <div class="stats-number">{{ stats.successCount }} 人</div>
          </div>
          <div class="stats-box">
            <div class="stat-label">失敗者</div>
            <div class="stats-number">{{ stats.failureCount }} 人</div>
          </div>
          <div class="stats-box">
            <div class="stat-label">平均生存イベント数</div>
            <div class="stats-number">{{ stats.avgEvents }}</div>
          </div>
          <div class="stats-box">
            <div class="stat-label">死亡</div>
            <div class="stats-number">{{ stats.deaths }} 人</div>
          </div>
          <div class="stats-box">
            <div class="stat-label">発狂</div>
            <div class="stats-number">{{ stats.insanities }} 人</div>
          </div>
        </div>
      </div>

      <!-- リセットボタン -->
      <div class="text-center mt-4 pb-4">
        <button @click="resetGame" class="btn-secondary-custom">ゲームをリセット</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Props {
  gameSlug: string;
}

const props = defineProps<Props>();

// Ref for scrolling
const newAdventurerButton = ref<HTMLElement | null>(null);
const diceRollArea = ref<HTMLElement | null>(null);
const eventArea = ref<HTMLElement | null>(null);

// ゲーム設定
const gameStarted = ref(false);
const maxEvents = ref(10);
const maxAdventurers = 5;

// ゲーム状態
const currentAdventurer = ref<any>(null);
const currentEvent = ref<any>(null);
const adventurerCount = ref(0);
const eventCount = ref(0);
const successCount = ref(0);
const history = ref<any[]>([]);

// UI状態
const diceResult = ref<any>(null);
const diceRolled = ref(false);
const resultMessage = ref<any>(null);
const showDamageDice = ref(false);
const damageResult = ref<any>(null);
const showNextButton = ref(false);
const showNextAdventurerButton = ref(false);

// ステータス名のマッピング
const statNames: Record<string, string> = {
  STR: '筋力（STR）',
  CON: '体力（CON）',
  POW: '精神力（POW）',
  DEX: '敏捷性（DEX）',
  APP: '外見（APP）',
  SIZ: '体格（SIZ）',
  INT: '知性（INT）',
  EDU: '教育（EDU）'
};

const damageNames: Record<string, string> = {
  HP: '耐久力',
  SAN: 'SAN値'
};

// ダイスロール関数
function roll(sides: number, count: number = 1): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

function rollD10(): number {
  return Math.floor(Math.random() * 10);
}

function rollD100(): { tens: number; ones: number; total: number } {
  const tens = rollD10();
  const ones = rollD10();
  return { tens, ones, total: tens * 10 + ones };
}

// 名前生成
function generateName(): string {
  const surnames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
  const givenNames = ['太郎', '次郎', '三郎', '花子', '一郎', '健太', '翔太', '美咲', '陽菜', '蓮'];
  return surnames[Math.floor(Math.random() * surnames.length)] + ' ' +
         givenNames[Math.floor(Math.random() * givenNames.length)];
}

// キャラクター生成
function generateCharacter() {
  const name = generateName();

  const STR = roll(6, 3);
  const CON = roll(6, 3);
  const POW = roll(6, 3);
  const DEX = roll(6, 3);
  const APP = roll(6, 3);
  const SIZ = roll(6, 2) + 6;
  const INT = roll(6, 2) + 6;
  const EDU = roll(6, 3) + 3;

  const HP = Math.ceil((CON + SIZ) / 2);
  const SAN = POW * 5;
  const MP = POW;

  return {
    name,
    STR, CON, POW, DEX, APP, SIZ, INT, EDU,
    HP, maxHP: HP,
    SAN, maxSAN: SAN,
    MP
  };
}

// イベント生成
function generateEvent(character: any) {
  const stats = ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU'];
  const stat = stats[Math.floor(Math.random() * stats.length)];
  const damages = ['HP', 'SAN'];
  const damageType = damages[Math.floor(Math.random() * damages.length)];

  const difficulties = ['easy', 'normal', 'hard'];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

  let threshold = character[stat] * 5;
  let diffText = '';

  if (difficulty === 'easy') {
    threshold = Math.min(threshold + 20, 100);
    diffText = '+20';
  } else if (difficulty === 'hard') {
    threshold = Math.max(threshold - 20, 5);
    diffText = '-20';
  }

  return {
    stat,
    statName: statNames[stat],
    damageType,
    damageTypeName: damageNames[damageType],
    threshold,
    difficulty,
    diffText
  };
}

// ゲーム開始
function startGame() {
  gameStarted.value = true;
  loadHistory();
}

// 新しい冒険者開始
function startNewAdventurer() {
  if (adventurerCount.value >= maxAdventurers) {
    alert('5人の冒険者が終了しました！統計を確認してください。');
    return;
  }

  currentAdventurer.value = generateCharacter();
  eventCount.value = 0;
  successCount.value = 0;
  adventurerCount.value++;

  // UI状態をリセット
  diceResult.value = null;
  diceRolled.value = false;
  resultMessage.value = null;
  showDamageDice.value = false;
  damageResult.value = null;
  showNextButton.value = false;
  showNextAdventurerButton.value = false;

  startNextEvent();
}

// 次のイベント開始
function startNextEvent() {
  eventCount.value++;
  currentEvent.value = generateEvent(currentAdventurer.value);

  // UI状態をリセット
  diceResult.value = null;
  diceRolled.value = false;
  resultMessage.value = null;
  showDamageDice.value = false;
  damageResult.value = null;
  showNextButton.value = false;
}

// ダイスロール
function rollDice() {
  const d100Result = rollD100();
  diceResult.value = d100Result;
  diceRolled.value = true;

  // ダイスロールエリアまでスクロール（スマホ対応）
  setTimeout(() => {
    if (diceRollArea.value) {
      diceRollArea.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);

  setTimeout(() => {
    const success = d100Result.total <= currentEvent.value.threshold;

    if (success) {
      successCount.value++;
      resultMessage.value = {
        class: 'result-success',
        text: `✅ 成功！ ${d100Result.total} ≦ ${currentEvent.value.threshold}`
      };

      if (eventCount.value >= maxEvents.value) {
        resultMessage.value.text += '<br>🎉 全イベントクリア！';
        finishAdventurer(true);
      } else {
        showNextButton.value = true;
      }
    } else {
      const currentValue = currentAdventurer.value[currentEvent.value.damageType];
      resultMessage.value = {
        class: 'result-failure',
        text: `❌ 失敗... ${d100Result.total} > ${currentEvent.value.threshold}<br>
               <span style="font-size: 1.2em; color: #fff;">【${currentEvent.value.damageTypeName}】にダメージ！</span><br>
               <span style="font-size: 0.95em;">現在: ${currentValue}</span>`
      };
      showDamageDice.value = true;
    }
  }, 1000);
}

// ダメージダイスロール
function rollDamageDice() {
  let dice1: number, dice2: number, damage: number, diceType: string;

  if (currentEvent.value.damageType === 'SAN') {
    dice1 = roll(12);
    dice2 = roll(12);
    damage = dice1 + dice2;
    diceType = '2D12';
  } else {
    dice1 = roll(6);
    dice2 = roll(6);
    damage = dice1 + dice2;
    diceType = '2D6';
  }

  const before = currentAdventurer.value[currentEvent.value.damageType];
  const after = before - damage;

  damageResult.value = {
    dice1,
    dice2,
    damage,
    diceType,
    before,
    after
  };

  showDamageDice.value = false;
  currentAdventurer.value[currentEvent.value.damageType] -= damage;

  setTimeout(() => {
    if (currentAdventurer.value.HP <= 0 || currentAdventurer.value.SAN <= 0) {
      let endMessage: string, endCause: string;
      if (currentAdventurer.value.SAN <= 0) {
        endCause = '発狂';
        endMessage = '🌀 正気を失った...<br>探索者は発狂した';
      } else {
        endCause = '死亡';
        endMessage = '💀 致命傷を負った...<br>探索者は死亡した';
      }

      resultMessage.value = {
        class: 'result-gameover',
        text: endMessage
      };
      finishAdventurer(false, endCause);
    } else {
      if (eventCount.value >= maxEvents.value) {
        resultMessage.value = {
          class: 'result-success',
          text: '🎉 全イベントクリア！'
        };
        finishAdventurer(true);
      } else {
        showNextButton.value = true;
      }
    }
  }, 500);
}

// 次のイベントへ
function goToNextEvent() {
  startNextEvent();

  // イベントエリアまでスクロール（スマホ対応）
  setTimeout(() => {
    if (eventArea.value) {
      eventArea.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// 次の冒険者へ
function goToNextAdventurer() {
  // 「新しい冒険者を生成」ボタンまでスクロール
  if (newAdventurerButton.value) {
    newAdventurerButton.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 冒険者終了
function finishAdventurer(success: boolean, deathCause: string | null = null) {
  const record = {
    name: currentAdventurer.value.name,
    success,
    eventsCleared: successCount.value,
    finalHP: currentAdventurer.value.HP,
    finalSAN: currentAdventurer.value.SAN,
    maxHP: currentAdventurer.value.maxHP,
    maxSAN: currentAdventurer.value.maxSAN,
    deathCause
  };

  history.value.push(record);
  saveHistory();

  // 「次のイベントへ」ボタンを隠す
  showNextButton.value = false;

  // 「次の冒険者へ」ボタンを表示
  if (adventurerCount.value < maxAdventurers) {
    showNextAdventurerButton.value = true;
  }
}

// LocalStorageから履歴を読み込み
function loadHistory() {
  try {
    const key = `dice-games:${props.gameSlug}_events_${maxEvents.value}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      if (data && data.history) {
        history.value = data.history;
      }
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

// LocalStorageに履歴を保存
function saveHistory() {
  try {
    const key = `dice-games:${props.gameSlug}_events_${maxEvents.value}`;
    localStorage.setItem(key, JSON.stringify({ history: history.value }));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

// 統計計算
const stats = computed(() => {
  if (history.value.length === 0) return null;

  const successCount = history.value.filter(r => r.success).length;
  const failureCount = history.value.filter(r => !r.success).length;
  const deaths = history.value.filter(r => r.deathCause === '死亡').length;
  const insanities = history.value.filter(r => r.deathCause === '発狂').length;
  const avgEvents = (history.value.reduce((sum, r) => sum + r.eventsCleared, 0) / history.value.length).toFixed(1);

  return {
    successCount,
    failureCount,
    avgEvents,
    deaths,
    insanities
  };
});

// 統計クリア
function clearStats() {
  if (confirm(`${maxEvents.value}回イベントの統計データをクリアしますか？`)) {
    history.value = [];
    saveHistory();
  }
}

// ゲームリセット
function resetGame() {
  if (confirm('ゲームをリセットしますか？現在のプレイ状況は失われます。')) {
    location.reload();
  }
}

onMounted(() => {
  // 初回は何もしない（ゲーム開始ボタンを待つ）
});
</script>

<style scoped>
/* ダークテーマのベーススタイル */
.dice-adventure-game {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
  padding: 20px;
  min-height: 100vh;
  border-radius: 10px;
}

/* カード共通スタイル - 半透明の暗い背景 */
.card {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 20px;
  color: #ffffff;
}

.card-title {
  color: #f39c12;
  margin-bottom: 15px;
  font-size: 1.3em;
  border-bottom: 2px solid #f39c12;
  padding-bottom: 10px;
}

/* ゲーム設定 */
.game-setup {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

.setup-title {
  color: #f39c12;
  margin-bottom: 20px;
}

.setup-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setup-label {
  color: #ffffff;
  font-weight: bold;
}

.setup-select {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  padding: 10px;
  border-radius: 5px;
}

.setup-select option {
  background: #1a1a2e;
  color: #ffffff;
}

/* ボタンスタイル */
.btn-primary-custom,
.btn-start {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.1em;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.btn-primary-custom:hover,
.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.4);
}

.btn-primary-custom:disabled {
  background: #555;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary-custom {
  background: #555;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 1em;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-damage {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.1em;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

/* プレースホルダーテキスト */
.placeholder-text {
  text-align: center;
  color: #999;
  font-style: italic;
}

/* 冒険者情報 */
.adventurer-name {
  text-align: center;
  color: #f39c12;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.vital-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin: 15px 0;
}

.vital-item {
  background: rgba(243, 156, 18, 0.3);
  padding: 12px;
  border-radius: 8px;
  border: 2px solid #f39c12;
  color: #ffffff;
}

.vital-item.danger {
  background: rgba(231, 76, 60, 0.3);
  border-color: #e74c3c;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-item {
  background: rgba(0, 0, 0, 0.5);
  padding: 8px;
  border-radius: 5px;
  text-align: center;
  color: #ffffff;
}

.stat-label {
  font-size: 0.85em;
  color: #bbb;
  margin-bottom: 3px;
}

.stat-value {
  font-size: 1.3em;
  font-weight: bold;
  color: #fff;
}

/* イベント */
.event-card {
  min-height: 600px;
}

.event-box {
  background: rgba(52, 152, 219, 0.3);
  border: 2px solid #3498db;
  border-radius: 10px;
  padding: 20px;
  min-height: 150px;
  color: #ffffff;
}

.event-text {
  font-size: 1.1em;
  line-height: 1.8;
  margin-bottom: 15px;
  color: #ffffff;
}

.event-condition {
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
  color: #f39c12;
  text-align: center;
}

/* ダイスエリア */
.dice-card {
  min-height: 600px;
}

.dice-area {
  text-align: center;
  padding: 20px;
  min-height: 400px;
}

.dice-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 0;
}

.dice-label {
  color: #bbb;
  margin-bottom: 10px;
  font-size: 0.9em;
}

.dice {
  width: 80px;
  height: 80px;
  background: #fff;
  color: #000;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  animation: rollDice 0.5s ease;
}

.damage-dice {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
  font-size: 1em;
  border: 1px solid #a93226;
  animation: rollDamageDice 0.4s ease;
}

@keyframes rollDice {
  0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
  25% { transform: rotateX(180deg) rotateY(90deg); }
  50% { transform: rotateX(360deg) rotateY(180deg); }
  75% { transform: rotateX(180deg) rotateY(270deg); }
}

@keyframes rollDamageDice {
  0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
  25% { transform: rotateX(90deg) rotateY(45deg); }
  50% { transform: rotateX(180deg) rotateY(90deg); }
  75% { transform: rotateX(270deg) rotateY(135deg); }
}

.dice-result-value {
  font-size: 2em;
  color: #f39c12;
  font-weight: bold;
  margin: 15px 0;
}

/* 結果メッセージ */
.result-message {
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  font-size: 1.1em;
  font-weight: bold;
}

.result-success {
  background: rgba(46, 204, 113, 0.4);
  border: 2px solid #2ecc71;
  color: #ffffff;
}

.result-failure {
  background: rgba(231, 76, 60, 0.4);
  border: 2px solid #e74c3c;
  color: #ffffff;
}

.result-gameover {
  background: rgba(192, 57, 43, 0.6);
  border: 3px solid #c0392b;
  color: #fff;
  font-size: 1.3em;
}

/* ダメージ結果 */
.damage-result {
  margin-top: 15px;
  padding: 15px;
  background: rgba(192, 57, 43, 0.3);
  border: 2px solid #c0392b;
  border-radius: 10px;
  color: #ffffff;
}

.damage-label {
  color: #e74c3c;
  font-weight: bold;
  margin-bottom: 10px;
}

.damage-plus {
  color: #e74c3c;
  font-size: 1.5em;
  font-weight: bold;
}

.damage-value {
  color: #e74c3c;
  font-size: 1.3em;
  font-weight: bold;
  margin-top: 10px;
}

.damage-change {
  color: #fff;
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.3);
}

.text-danger {
  color: #e74c3c;
}

.text-danger-bright {
  color: #ff6b6b;
  font-size: 1.3em;
}

.text-warning-bright {
  color: #f39c12;
}

/* 履歴 */
.history-item {
  background: rgba(0, 0, 0, 0.5);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid #3498db;
  color: #ffffff;
}

.history-item.success {
  border-left-color: #2ecc71;
}

.history-item.failure {
  border-left-color: #e74c3c;
}

/* 統計 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.stats-box {
  background: rgba(0, 0, 0, 0.5);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  color: #ffffff;
}

.stats-number {
  font-size: 2em;
  font-weight: bold;
  color: #f39c12;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .vital-stats {
    grid-template-columns: 1fr;
  }
}
</style>
