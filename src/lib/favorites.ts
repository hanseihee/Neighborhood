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

// --- 시군구 즐겨찾기 ---

const DISTRICT_FAVORITES_KEY = 'neighborhood-district-favorites';
const LAST_REGION_KEY = 'neighborhood-last-region';

export function getDistrictFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DISTRICT_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDistrictFavorite(code: string): void {
  const favs = getDistrictFavorites();
  if (favs.includes(code)) return;
  favs.push(code);
  localStorage.setItem(DISTRICT_FAVORITES_KEY, JSON.stringify(favs));
}

export function removeDistrictFavorite(code: string): void {
  const favs = getDistrictFavorites().filter((c) => c !== code);
  localStorage.setItem(DISTRICT_FAVORITES_KEY, JSON.stringify(favs));
}

export function isDistrictFavorite(code: string): boolean {
  return getDistrictFavorites().includes(code);
}

export function getLastRegion(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(LAST_REGION_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastRegion(code: string): void {
  try {
    localStorage.setItem(LAST_REGION_KEY, code);
  } catch {
    // ignore
  }
}
