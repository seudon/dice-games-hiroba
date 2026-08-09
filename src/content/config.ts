// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const gamesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    component: z.string(),                    // 例: 'ZoromeGame.vue'
    description: z.string(),
    // ゲームの直前に表示する要点。これだけ読めば遊べる長さ（2〜3文）に収める
    quickRule: z.string(),
    // 実際のサイコロで遊ぶときの人数。maxを省略すると「◯人〜」と表示される
    players: z.object({
      min: z.number().min(1),
      max: z.number().optional(),
    }),
    // 実際に遊ぶために必要な道具。1つ目はサイコロを書く
    equipment: z.string().array().min(1),
    duration: z.string(),                     // 例: '5-10分'
    difficulty: z.enum(['初級', '中級', '上級', '超級']),
    diceCount: z.number().min(1).max(15),     // 使用するサイコロの数
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
