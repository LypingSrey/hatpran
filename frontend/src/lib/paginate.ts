import type { Paginated } from './types';

/**
 * Load every page of a paginated API list, one page at a time, and return all the items in order.
 * For lists the screen needs whole (e.g. to group them), since the API returns at most 100 per page.
 */
export async function fetchAllPages<T>(loadPage: (page: number) => Promise<Paginated<T>>): Promise<T[]> {
  const first = await loadPage(1);
  const items = [...first.data];
  for (let page = 2; page <= first.meta.last_page; page++) {
    items.push(...(await loadPage(page)).data);
  }
  return items;
}
