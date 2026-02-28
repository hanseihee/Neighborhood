export interface FavoriteApt {
  aptName: string;
  regionCode: string;
  regionName: string;
  latestPrice: number;
  addedAt: number;
}

const STORAGE_KEY = 'neighborhood-favorites';

export function getFavorites(): FavoriteApt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addFavorite(fav: FavoriteApt): void {
  const favorites = getFavorites();
  if (favorites.some((f) => f.aptName === fav.aptName && f.regionCode === fav.regionCode))
    return;
  favorites.push(fav);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function removeFavorite(aptName: string, regionCode: string): void {
  const favorites = getFavorites().filter(
    (f) => !(f.aptName === aptName && f.regionCode === regionCode)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavorite(aptName: string, regionCode: string): boolean {
  return getFavorites().some(
    (f) => f.aptName === aptName && f.regionCode === regionCode
  );
}
