<script setup lang="ts">
import DiceDisplay from './DiceDisplay.vue';
import type { Dice } from '../../types/game';

interface Props {
  dice: Dice[];
}

defineProps<Props>();
</script>

<template>
  <div class="dice-tray">
    <div class="dice-area" :data-count="dice.length">
      <DiceDisplay
        v-for="die in dice"
        :key="die.id"
        :value="die.value"
        :isRolling="die.isRolling"
      />
    </div>
  </div>
</template>

<style scoped>
.dice-tray {
  background: linear-gradient(135deg, #1e7e34 0%, #28a745 100%);
  border-radius: 20px;
  padding: 40px;
  box-shadow:
    inset 0 4px 8px rgba(0, 0, 0, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

/* フェルトの質感 */
.dice-tray::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(0, 0, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 枠の装飾 */
.dice-tray::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  pointer-events: none;
}

/* サイコロエリア */
.dice-area {
  display: grid;
  gap: 20px;
  justify-content: center;
  align-items: center;
  min-height: 140px;
  position: relative;
  z-index: 1;
}

/* サイコロ数に応じたグリッドレイアウト */
.dice-area[data-count="1"] {
  grid-template-columns: repeat(1, 80px);
}

.dice-area[data-count="2"] {
  grid-template-columns: repeat(2, 80px);
}

.dice-area[data-count="3"] {
  grid-template-columns: repeat(3, 80px);
}

.dice-area[data-count="4"] {
  grid-template-columns: repeat(2, 80px);
}

.dice-area[data-count="5"],
.dice-area[data-count="6"] {
  grid-template-columns: repeat(3, 80px);
}

/* 7-9個: 少し小さく */
.dice-area[data-count="7"],
.dice-area[data-count="8"],
.dice-area[data-count="9"] {
  grid-template-columns: repeat(3, 70px);
}

.dice-area[data-count="7"] :deep(.dice-face),
.dice-area[data-count="8"] :deep(.dice-face),
.dice-area[data-count="9"] :deep(.dice-face) {
  width: 70px;
  height: 70px;
}

/* 10-12個: さらに小さく */
.dice-area[data-count="10"],
.dice-area[data-count="11"],
.dice-area[data-count="12"] {
  grid-template-columns: repeat(4, 60px);
}

.dice-area[data-count="10"] :deep(.dice-face),
.dice-area[data-count="11"] :deep(.dice-face),
.dice-area[data-count="12"] :deep(.dice-face) {
  width: 60px;
  height: 60px;
}

.dice-area[data-count="10"] :deep(.dot),
.dice-area[data-count="11"] :deep(.dot),
.dice-area[data-count="12"] :deep(.dot) {
  width: 10px;
  height: 10px;
}

/* 13個以上: 最小サイズ */
.dice-area[data-count="13"],
.dice-area[data-count="14"],
.dice-area[data-count="15"] {
  grid-template-columns: repeat(5, 50px);
}

.dice-area[data-count="13"] :deep(.dice-face),
.dice-area[data-count="14"] :deep(.dice-face),
.dice-area[data-count="15"] :deep(.dice-face) {
  width: 50px;
  height: 50px;
}

.dice-area[data-count="13"] :deep(.dot),
.dice-area[data-count="14"] :deep(.dot),
.dice-area[data-count="15"] :deep(.dot) {
  width: 8px;
  height: 8px;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .dice-tray {
    padding: 30px 20px;
  }

  .dice-area {
    gap: 15px;
  }

  /* モバイルでは3列まで */
  .dice-area[data-count="4"],
  .dice-area[data-count="5"],
  .dice-area[data-count="6"],
  .dice-area[data-count="7"],
  .dice-area[data-count="8"],
  .dice-area[data-count="9"],
  .dice-area[data-count="10"],
  .dice-area[data-count="11"],
  .dice-area[data-count="12"],
  .dice-area[data-count="13"],
  .dice-area[data-count="14"],
  .dice-area[data-count="15"] {
    grid-template-columns: repeat(3, 60px);
  }

  .dice-area :deep(.dice-face) {
    width: 60px !important;
    height: 60px !important;
  }

  .dice-area :deep(.dot) {
    width: 10px !important;
    height: 10px !important;
  }
}
</style>
