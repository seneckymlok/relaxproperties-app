import { MetadataRoute } from 'next';
import { getCachedPublishedProperties } from '@/lib/property-store';
import { getPublishedBlogPosts } from '@/lib/blog-store';

const BASE_URL = 'https://www.relaxproperties.sk';
const LANGUAGES = ['sk', 'en', 'cz'] as const;

const STATIC_PAGES = [
  'about',
  'contact',
  'buying-process',
  'cookie-policy',
  'privacy-policy',
  'favorites',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, blogPosts] = await Promise.all([
    getCachedPublishedProperties(),
    getPublishedBlogPosts(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Homepage for each language
  for (const lang of LANGUAGES) {
    entries.push({
      url: `${BASE_URL}/${lang}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    });
  }

  // Properties listing for each language
  for (const lang of LANGUAGES) {
    entries.push({
      url: `${BASE_URL}/${lang}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  // Individual properties for each language
  for (const property of properties) {
    for (const lang of LANGUAGES) {
      entries.push({
        url: `${BASE_URL}/${lang}/properties/${property.id}`,
        lastModified: new Date(property.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Blog listing for each language
  for (const lang of LANGUAGES) {
    entries.push({
      url: `${BASE_URL}/${lang}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  // Individual blog posts for each language
  for (const post of blogPosts) {
    for (const lang of LANGUAGES) {
      entries.push({
        url: `${BASE_URL}/${lang}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Static pages for each language
  for (const page of STATIC_PAGES) {
    for (const lang of LANGUAGES) {
      entries.push({
        url: `${BASE_URL}/${lang}/${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  }

  return entries;
}
