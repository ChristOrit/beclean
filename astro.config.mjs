import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { site } from './src/data/site.js';
import { blogPosts } from './src/data/blog.js';

export default defineConfig({
  site: site.url,
  adapter: vercel(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      // /api/* et /studio/* (atelier interne) restent hors plan du site.
      filter: (page) => !page.includes('/api/') && !page.includes('/studio/'),
      changefreq: 'weekly',
      priority: 0.7,
      // `lastmod` = date de publication des articles (signal de fraîcheur pour Google).
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        const post = blogPosts.find((p) => url.endsWith(`/blog/${p.slug}`));
        return post ? { ...item, lastmod: post.date, changefreq: 'monthly' } : item;
      },
    }),
  ],
  output: 'static',
});
