/**
 * Web メルカトルで扱える緯度の上限
 */
export const MAX_LATITUDE = 85.0511287798066;

const RAD = Math.PI / 180;

export const toRadians = (degrees: number): number => degrees * RAD;

export const toDegrees = (radians: number): number => radians / RAD;

/**
 * 経度の差を -180 〜 180 に直す（近い方向に取る）
 */
export const wrapLongitude = (delta: number): number =>
  delta - 360 * Math.round(delta / 360);

/**
 * 緯度をメルカトル座標の y に変換する（北が正）
 */
export const projectLatitude = (lat: number): number => {
  const clamped = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  return Math.log(Math.tan(Math.PI / 4 + toRadians(clamped) / 2));
};

/**
 * メルカトル座標の y を緯度に変換する
 */
export const unprojectLatitude = (y: number): number =>
  toDegrees(2 * Math.atan(Math.exp(y)) - Math.PI / 2);
