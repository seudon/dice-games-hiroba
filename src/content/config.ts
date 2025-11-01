// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const gamesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    component: z.string(),                    // 例: 'ZoromeGame.vue'
    description: z.string(),
    players: z.string(),                      // 例: '1人〜'
    duration: z.string(),                     // 例: '5-10分'
    difficulty: z.enum(['初級', '中級', '上級', '超級']),
    diceCount: z.number().min(1).max(10),     // 使用するサイコロの数
    category: z.enum(['運ゲー', '戦略ゲー', '計算ゲー', 'パーティーゲー', 'TRPG', '統計', 'ロールプレイ']).array(),
    tags: z.string().array().optional(),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    featured: z.boolean().default(false),     // おすすめゲームかどうか
    config: z.record(z.any()).optional(),     // ゲーム固有の設定
  }),
});

export const collections = {
  games: gamesCollection,
};
