import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { site } from './src/data/site.js';
import { blogPosts } from './src/data/blog.js';

export default defineConfig({
  site: site.url,
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !page.includes('/api/'),
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
