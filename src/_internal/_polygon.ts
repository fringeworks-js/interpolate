import {
  projectLatitude,
  toDegrees,
  toRadians,
  unprojectLatitude,
  wrapLongitude,
} from './_geo';
import type { PointFormat } from './_points';
import type { Coordinates, MultiPolygonOptions, OriginKeyword } from './_types';

/**
 * 座標の配列（MultiPolygon の形）
 */
type CoordinatesTree = Coordinates[][][];

/**
 * 拡大・縮小を計算する空間
 */
export type PolygonSpace = {
  /**
   * 計算に使う座標
   */
  coordinates: CoordinatesTree;
  /**
   * y が大きいほうが上か
   */
  yUp: boolean;
  /**
   * 点の座標を計算に使う座標に変換する
   */
  project: (coordinates: Coordinates) => Coordinates;
  /**
   * 計算に使う座標を、polygon k・リング r・点 i の座標に戻す
   */
  unproject: (
    coordinates: Coordinates,
    k: number,
    r: number,
    i: number,
  ) => Coordinates;
};

/**
 * 平面（画面座標として y が下向き）
 */
export const planarSpace = (coordinates: CoordinatesTree): PolygonSpace => ({
  coordinates,
  yUp: false,
  project: (point) => point,
  unproject: (point) => point,
});

/**
 * メルカトル座標
 *
 * 経度は最初の点を基準に、リングごとに近い方向に取って連続した値に直してから投影し、
 * 戻すときは元の点の経度から連続した値にする
 */
export const mercatorSpace = (coordinates: CoordinatesTree): PolygonSpace => {
  // 空のリングがあっても、最初に見つかった点を基準にする
  const reference = coordinates.flat(2)[0]?.[0] ?? 0;
  const unwrap = (lng: number, base: number): number =>
    base + wrapLongitude(lng - base);
  const unwrapped = coordinates.map((rings) =>
    rings.map((ring) => {
      const result: number[] = [];
      ring.forEach(([lng], i) => {
        result.push(unwrap(lng, i === 0 ? reference : result[i - 1]!));
      });
      return result;
    }),
  );
  return {
    coordinates: coordinates.map((rings, k) =>
      rings.map((ring, r) =>
        ring.map(([, lat], i): Coordinates => [
          toRadians(unwrapped[k]![r]![i]!),
          projectLatitude(lat),
        ]),
      ),
    ),
    yUp: true,
    project: ([lng, lat]) => [
      toRadians(unwrap(lng, reference)),
      projectLatitude(lat),
    ],
    unproject: ([x, y], k, r, i) => [
      coordinates[k]![r]![i]![0] + toDegrees(x) - unwrapped[k]![r]![i]!,
      unprojectLatitude(y),
    ],
  };
};

/**
 * 面積の重心を求める
 *
 * 各ポリゴンの1つ目のリングを外周、2つ目以降を穴として、回り方によらず穴の面積を差し引く。
 * 面積がない場合は頂点の平均を返す
 */
const getCentroid = (polygons: CoordinatesTree): Coordinates => {
  const [refX, refY] = polygons[0]?.[0]?.[0] ?? [0, 0];
  let area = 0,
    sumX = 0,
    sumY = 0,
    scale = 0,
    meanX = 0,
    meanY = 0,
    count = 0;
  for (const rings of polygons) {
    rings.forEach((ring, r) => {
      let ringArea = 0,
        ringX = 0,
        ringY = 0;
      ring.forEach(([x, y], i) => {
        const [nextX, nextY] = ring[(i + 1) % ring.length]!;
        const x0 = x - refX,
          y0 = y - refY,
          x1 = nextX - refX,
          y1 = nextY - refY;
        const cross = x0 * y1 - x1 * y0;
        ringArea += cross;
        ringX += (x0 + x1) * cross;
        ringY += (y0 + y1) * cross;
        scale += Math.abs(cross);
        meanX += x0;
        meanY += y0;
        count++;
      });
      // 外周は正、穴は負の面積にそろえる
      const sign = (r === 0 ? 1 : -1) * (Math.sign(ringArea) || 1);
      area += ringArea * sign;
      sumX += ringX * sign;
      sumY += ringY * sign;
    });
  }
  if (Math.abs(area) > scale * 1e-10) {
    return [refX + sumX / (3 * area), refY + sumY / (3 * area)];
  } else if (count) {
    return [refX + meanX / count, refY + meanY / count];
  }
  return [refX, refY];
};

/**
 * キーワードで指定した基準点を、外接矩形から求める
 */
const getKeywordOrigin = (
  polygons: CoordinatesTree,
  keyword: OriginKeyword,
  yUp: boolean,
): Coordinates => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const rings of polygons) {
    for (const ring of rings) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (minX > maxX) {
    return [0, 0];
  }
  let x = (minX + maxX) / 2,
    y = (minY + maxY) / 2;
  for (const word of keyword.split(' ')) {
    if (word === 'left') {
      x = minX;
    } else if (word === 'right') {
      x = maxX;
    } else if (word === 'top') {
      y = yUp ? maxY : minY;
    } else if (word === 'bottom') {
      y = yUp ? minY : maxY;
    }
  }
  return [x, y];
};

/**
 * MultiPolygon の補間関数を作る
 */
export default function _createPolygonInterpolator<P>(
  polygons: readonly (readonly (readonly P[])[])[],
  format: PointFormat,
  createSpace: (coordinates: CoordinatesTree) => PolygonSpace,
  options: MultiPolygonOptions<P>,
): (t: number) => P[][][] {
  const {
    origin = 'centroid',
    axis = 'both',
    originPerPolygon = false,
    extrapolateStart = false,
    extrapolateEnd = false,
    getCoordinates = format.get as (point: P) => Coordinates,
    createPoint = (coordinates, { source }) =>
      format.create(coordinates, source) as P,
  } = options;

  const source = polygons.map((rings) => rings.map((ring) => ring.slice()));
  const space = createSpace(
    source.map((rings) =>
      rings.map((ring) => ring.map((point) => getCoordinates(point))),
    ),
  );

  const resolveOrigin = (target: CoordinatesTree): Coordinates =>
    origin === 'centroid'
      ? getCentroid(target)
      : typeof origin === 'string'
        ? getKeywordOrigin(target, origin as OriginKeyword, space.yUp)
        : space.project(getCoordinates(origin as P));
  const whole = originPerPolygon ? undefined : resolveOrigin(space.coordinates);
  const origins = space.coordinates.map(
    (rings) => whole ?? resolveOrigin([rings]),
  );

  return (t) => {
    let scale = t;
    if (t < 0 && !extrapolateStart) {
      scale = 0;
    } else if (t > 1 && !extrapolateEnd) {
      scale = 1;
    }
    if (scale === 1) {
      return source.map((rings) => rings.map((ring) => ring.slice()));
    }

    return source.map((rings, k) => {
      const [originX, originY] = origins[k]!;
      return rings.map((ring, r) =>
        ring.map((point, i) => {
          const [x, y] = space.coordinates[k]![r]![i]!;
          const scaled: Coordinates = [
            axis === 'y' ? x : originX + (x - originX) * scale,
            axis === 'x' ? y : originY + (y - originY) * scale,
          ];
          return createPoint(space.unproject(scaled, k, r, i), {
            source: point,
          });
        }),
      );
    });
  };
}
