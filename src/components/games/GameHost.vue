<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue';

/**
 * ゲームコンポーネントの動的ホスト
 *
 * Astroの client: ディレクティブは静的にimportされたコンポーネントしか受け付けないため、
 * ページ側からは常にこのGameHostだけをマウントし、実際のゲームの選択はVue側で行う。
 * これにより、ゲームを追加しても [slug].astro を編集する必要がない。
 */
interface Props {
  /** frontmatterの component 名。例: 'PigGame.vue' */
  component: string;
  gameSlug: string;
  /** frontmatterの config。そのままゲームのpropsとして渡す */
  config?: Record<string, unknown>;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
});

// 同ディレクトリのゲームコンポーネントを遅延読み込みで列挙する。
// 動的importのため、実際に読み込まれるのは選択された1つだけ。
const modules = import.meta.glob<{ default: Component }>('./*.vue');

const gameComponent = computed(() => {
  const loader = modules[`./${props.component}`];

  if (!loader) {
    // ページ側でもビルド時に検証しているため、通常ここには到達しない
    console.error(
      `ゲームコンポーネントが見つかりません: "${props.component}"`,
      Object.keys(modules)
    );
    return null;
  }

  return defineAsyncComponent(loader);
});
</script>

<template>
  <component
    :is="gameComponent"
    v-if="gameComponent"
    :gameSlug="gameSlug"
    v-bind="config"
  />

  <div v-else class="alert alert-warning" role="alert">
    このゲームを読み込めませんでした。
  </div>
</template>
