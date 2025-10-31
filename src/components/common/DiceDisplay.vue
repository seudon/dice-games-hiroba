<script setup lang="ts">
import type { DiceValue } from '../../types/game';

interface Props {
  value: DiceValue;
  size?: 'sm' | 'md' | 'lg';
  isRolling?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  isRolling: false,
});
</script>

<template>
  <div
    class="dice-face"
    :class="[`dice-${size}`, { rolling: isRolling }]"
    :aria-label="`サイコロ: ${value}の目`"
    role="img"
  >
    <div class="dots" :class="{ 'one-dot': value === 1 }">
      <!-- 1の目 -->
      <template v-if="value === 1">
        <span class="dot center"></span>
      </template>

      <!-- 2の目 -->
      <template v-else-if="value === 2">
        <span class="dot top-left"></span>
        <span class="dot bottom-right"></span>
      </template>

      <!-- 3の目 -->
      <template v-else-if="value === 3">
        <span class="dot top-left"></span>
        <span class="dot center"></span>
        <span class="dot bottom-right"></span>
      </template>

      <!-- 4の目 -->
      <template v-else-if="value === 4">
        <span class="dot top-left"></span>
        <span class="dot top-right"></span>
        <span class="dot bottom-left"></span>
        <span class="dot bottom-right"></span>
      </template>

      <!-- 5の目 -->
      <template v-else-if="value === 5">
        <span class="dot top-left"></span>
        <span class="dot top-right"></span>
        <span class="dot center"></span>
        <span class="dot bottom-left"></span>
        <span class="dot bottom-right"></span>
      </template>

      <!-- 6の目 -->
      <template v-else-if="value === 6">
        <span class="dot top-left"></span>
        <span class="dot top-right"></span>
        <span class="dot middle-left"></span>
        <span class="dot middle-right"></span>
        <span class="dot bottom-left"></span>
        <span class="dot bottom-right"></span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dice-face {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.5);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
}

.dice-sm { width: 60px; height: 60px; }
.dice-md { width: 80px; height: 80px; }
.dice-lg { width: 100px; height: 100px; }

.dice-face.rolling {
  animation: roll 0.5s ease-in-out;
}

@keyframes roll {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(90deg); }
  50% { transform: rotate(180deg); }
  75% { transform: rotate(270deg); }
}

.dots {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 15%;
}

.dot {
  width: 18%;
  height: 18%;
  background: #1a1a1a;
  border-radius: 50%;
  position: absolute;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 1の目だけ赤 */
.dots.one-dot .dot {
  background: #d32f2f;
}

/* 位置指定 */
.dot.center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.dot.top-left {
  top: 15%;
  left: 15%;
}

.dot.top-right {
  top: 15%;
  right: 15%;
}

.dot.middle-left {
  top: 50%;
  left: 15%;
  transform: translateY(-50%);
}

.dot.middle-right {
  top: 50%;
  right: 15%;
  transform: translateY(-50%);
}

.dot.bottom-left {
  bottom: 15%;
  left: 15%;
}

.dot.bottom-right {
  bottom: 15%;
  right: 15%;
}
</style>
