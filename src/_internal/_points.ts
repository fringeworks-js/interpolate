import type { Coordinates } from './_types';

/**
 * 点の形式ごとの、座標の取り出し方と点の作り方
 */
export type PointFormat = {
  get: (point: unknown) => Coordinates;
  create: (coordinates: Coordinates, source: unknown) => unknown;
};

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === 'object' && value !== null;

const unsupported = (point: unknown): never => {
  throw new TypeError(
    `Unsupported point format: ${JSON.stringify(point)}. Use the getCoordinates and createPoint options.`,
  );
};

/**
 * 平面の点（`[x, y]` / `{ x, y }`）
 */
export const planarFormat: PointFormat = {
  get: (point) => {
    if (Array.isArray(point)) {
      return [point[0], point[1]];
    } else if (
      isRecord(point) &&
      typeof point.x === 'number' &&
      typeof point.y === 'number'
    ) {
      return [point.x, point.y];
    }
    return unsupported(point);
  },
  create: ([x, y], source) => {
    if (Array.isArray(source)) {
      return [x, y, ...source.slice(2)];
    } else if (isRecord(source)) {
      return { ...source, x, y };
    }
    return unsupported(source);
  },
};

/**
 * 地図の点（`[lng, lat]` / `{ lat, lng }`）
 */
export const geoFormat: PointFormat = {
  get: (point) => {
    if (Array.isArray(point)) {
      return [point[0], point[1]];
    } else if (
      isRecord(point) &&
      typeof point.lat === 'number' &&
      typeof point.lng === 'number'
    ) {
      return [point.lng, point.lat];
    }
    return unsupported(point);
  },
  create: ([lng, lat], source) => {
    if (Array.isArray(source)) {
      return [lng, lat, ...source.slice(2)];
    } else if (isRecord(source)) {
      return { ...source, lat, lng };
    }
    return unsupported(source);
  },
};
