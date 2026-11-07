import type { Category } from '@/types/product';

function formatCategoryName(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * DummyJSON has returned categories both as plain slugs and as
 * `{ slug, name, url }` objects across versions - normalize both shapes.
 */
export function normalizeCategories(input: unknown): Category[] {
  if (!Array.isArray(input)) return [];

  const categories: Category[] = [];

  for (const entry of input) {
    if (typeof entry === 'string' && entry.trim() !== '') {
      categories.push({
        slug: entry,
        name: formatCategoryName(entry),
        url: `/products/category/${entry}`,
      });
      continue;
    }

    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      const slug = record.slug;
      if (typeof slug === 'string' && slug.trim() !== '') {
        categories.push({
          slug,
          name: typeof record.name === 'string' && record.name.trim() !== ''
            ? record.name
            : formatCategoryName(slug),
          url: typeof record.url === 'string' ? record.url : `/products/category/${slug}`,
        });
      }
    }
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}
