import {
  projectLatitude,
  toDegrees,
  toRadians,
  unprojectLatitude,
  wrapLongitude,
} from './_geo';
import type { PointFormat } from './_points';
import type {
  Coordinates,
  PolylineOptions,
  PolylinePointContext,
} from './_types';

/**
 * 区間の長さの測り方と、区間内の位置・向きの求め方
 */
export type PolylineMetric = {
  /**
   * 区間 i（点 i から点 i + 1）の長さ
   */
  measure: (i: number) => number;
  /**
   * 区間 i の ratio の位置の座標
   */
  locate: (i: number, ratio: number) => Coordinates;
  /**
   * 区間 i の ratio の位置での向き（度）
   *
   * 平面は x 軸の正の方向から時計回り（画面座標）、地図は北から時計回り
   */
  direction: (i: number, ratio: number) => number;
};

/**
 * 平面の直線
 */
export const planarMetric = (coordinates: Coordinates[]): PolylineMetric => ({
  measure: (i) => {
    const [x0, y0] = coordinates[i]!,
      [x1, y1] = coordinates[i + 1]!;
    return Math.hypot(x1 - x0, y1 - y0);
  },
  locate: (i, ratio) => {
    const [x0, y0] = coordinates[i]!,
      [x1, y1] = coordinates[i + 1]!;
    return [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio];
  },
  direction: (i) => {
    const [x0, y0] = coordinates[i]!,
      [x1, y1] = coordinates[i + 1]!;
    return toDegrees(Math.atan2(y1 - y0, x1 - x0));
  },
});

/**
 * メルカトル座標の直線（Google Maps / Leaflet の通常の描画）
 *
 * 経度は近い方向に取って連続した値に直してから投影し、
 * 補間した点の経度は、区間の始点の経度から連続した値で返す
 */
export const mercatorMetric = (coordinates: Coordinates[]): PolylineMetric => {
  const unwrapped: number[] = [];
  coordinates.forEach(([lng], i) => {
    unwrapped.push(
      i === 0
        ? lng
        : unwrapped[i - 1]! + wrapLongitude(lng - coordinates[i - 1]![0]),
    );
  });
  const projected = coordinates.map(([, lat], i): Coordinates => [
    toRadians(unwrapped[i]!),
    projectLatitude(lat),
  ]);
  return {
    measure: (i) => {
      const [x0, y0] = projected[i]!,
        [x1, y1] = projected[i + 1]!;
      return Math.hypot(x1 - x0, y1 - y0);
    },
    locate: (i, ratio) => {
      const [x0, y0] = projected[i]!,
        [x1, y1] = projected[i + 1]!;
      const x = x0 + (x1 - x0) * ratio,
        y = y0 + (y1 - y0) * ratio;
      return [
        coordinates[i]![0] + toDegrees(x) - unwrapped[i]!,
        unprojectLatitude(y),
      ];
    },
    direction: (i) => {
      const [x0, y0] = projected[i]!,
        [x1, y1] = projected[i + 1]!;
      // メルカトル座標は x が東、y が北
      return toDegrees(Math.atan2(x1 - x0, y1 - y0));
    },
  };
};

type Vector = [number, number, number];

const toVector = ([lng, lat]: Coordinates): Vector => {
  const lambda = toRadians(lng),
    phi = toRadians(lat);
  return [
    Math.cos(phi) * Math.cos(lambda),
    Math.cos(phi) * Math.sin(lambda),
    Math.sin(phi),
  ];
};

const angleBetween = ([ax, ay, az]: Vector, [bx, by, bz]: Vector): number =>
  Math.atan2(
    Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx),
    ax * bx + ay * by + az * bz,
  );

/**
 * 大円（`geodesic: true`）
 */
export const geodesicMetric = (coordinates: Coordinates[]): PolylineMetric => {
  const vectors = coordinates.map(toVector);
  const angles = vectors
    .slice(0, -1)
    .map((vector, i) => angleBetween(vector, vectors[i + 1]!));

  // 対蹠点どうしの区間は大円が定まらないため、緯度経度の直線で代用する
  const isDegenerate = (i: number) => Math.sin(angles[i]!) < 1e-12;

  const locate = (i: number, ratio: number): Coordinates => {
    const [lng0, lat0] = coordinates[i]!,
      [lng1, lat1] = coordinates[i + 1]!;
    if (isDegenerate(i)) {
      return [
        lng0 + wrapLongitude(lng1 - lng0) * ratio,
        lat0 + (lat1 - lat0) * ratio,
      ];
    }
    const angle = angles[i]!,
      sin = Math.sin(angle);
    const a = Math.sin((1 - ratio) * angle) / sin,
      b = Math.sin(ratio * angle) / sin;
    const [x0, y0, z0] = vectors[i]!,
      [x1, y1, z1] = vectors[i + 1]!;
    const x = a * x0 + b * x1,
      y = a * y0 + b * y1,
      z = a * z0 + b * z1;
    const lng = toDegrees(Math.atan2(y, x)),
      lat = toDegrees(Math.atan2(z, Math.hypot(x, y)));
    return [lng0 + wrapLongitude(lng - lng0), lat];
  };

  return {
    measure: (i) => angles[i]!,
    locate,
    direction: (i, ratio) => {
      const [lng0, lat0] = coordinates[i]!,
        [lng1, lat1] = coordinates[i + 1]!;
      if (isDegenerate(i)) {
        return toDegrees(Math.atan2(wrapLongitude(lng1 - lng0), lat1 - lat0));
      }
      // 大円上の位置での接線を、東・北の成分に分けて方位を求める
      const angle = angles[i]!,
        sin = Math.sin(angle);
      const a = Math.cos((1 - ratio) * angle) / sin,
        b = Math.cos(ratio * angle) / sin;
      const [x0, y0, z0] = vectors[i]!,
        [x1, y1, z1] = vectors[i + 1]!;
      const tx = b * x1 - a * x0,
        ty = b * y1 - a * y0,
        tz = b * z1 - a * z0;
      const [lng, lat] = locate(i, ratio);
      const lambda = toRadians(lng),
        phi = toRadians(lat);
      const east = -Math.sin(lambda) * tx + Math.cos(lambda) * ty;
      const north =
        -Math.sin(phi) * Math.cos(lambda) * tx -
        Math.sin(phi) * Math.sin(lambda) * ty +
        Math.cos(phi) * tz;
      return toDegrees(Math.atan2(east, north));
    },
  };
};

/**
 * 長さを測った折れ線
 */
export type MeasuredPolyline<P> = {
  /**
   * 元の点（配列は複製したもの）
   */
  source: P[];
  metric: PolylineMetric;
  /**
   * 区間ごとの長さ
   */
  lengths: number[];
  /**
   * 先頭から各点までの長さ
   */
  cumulative: number[];
  total: number;
  /**
   * 長さのある最初の区間
   */
  first: number;
  /**
   * 長さのある最後の区間
   */
  last: number;
  /**
   * 先頭からの長さ（0 < distance < total）から、区間と区間内の割合を求める
   */
  find: (distance: number) => [i: number, ratio: number];
  /**
   * 区間 i の ratio の位置の点を作る
   */
  pointAt: (i: number, ratio: number) => P;
};

/**
 * 折れ線の長さを測る
 */
export function _measurePolyline<P>(
  points: readonly P[],
  format: PointFormat,
  createMetric: (coordinates: Coordinates[]) => PolylineMetric,
  options: Pick<PolylineOptions<P>, 'getCoordinates' | 'createPoint'>,
): MeasuredPolyline<P> {
  const {
    getCoordinates = format.get as (point: P) => Coordinates,
    createPoint = (
      coordinates: Coordinates,
      { from }: PolylinePointContext<P>,
    ) => format.create(coordinates, from) as P,
  } = options;

  const source = points.slice(),
    count = source.length;
  const metric = createMetric(source.map((point) => getCoordinates(point)));
  const lengths: number[] = [],
    cumulative = [0];
  for (let i = 0; i < count - 1; i++) {
    lengths.push(metric.measure(i));
    cumulative.push(cumulative[i]! + lengths[i]!);
  }
  const total = cumulative[cumulative.length - 1]!;
  const first = lengths.findIndex((length) => length > 0);
  let last = lengths.length - 1;
  while (last > 0 && lengths[last]! === 0) {
    last--;
  }

  return {
    source,
    metric,
    lengths,
    cumulative,
    total,
    first,
    last,
    find: (distance) => {
      // cumulative[i]! <= distance となる最大の i を探す。
      // distance < total なので、区間 i は必ず長さを持つ
      let low = 0,
        high = count - 2;
      while (low < high) {
        const middle = (low + high + 1) >> 1;
        if (cumulative[middle]! <= distance) {
          low = middle;
        } else {
          high = middle - 1;
        }
      }
      return [low, (distance - cumulative[low]!) / lengths[low]!];
    },
    pointAt: (i, ratio) =>
      createPoint(metric.locate(i, ratio), {
        from: source[i]!,
        to: source[i + 1]!,
        ratio,
      }),
  };
}

/**
 * polyline の補間関数を作る
 */
export default function _createPolylineInterpolator<P>(
  points: readonly P[],
  format: PointFormat,
  createMetric: (coordinates: Coordinates[]) => PolylineMetric,
  options: PolylineOptions<P>,
): (t: number) => P[] {
  const {
    snapToVertex = false,
    extrapolateStart = false,
    extrapolateEnd = false,
  } = options;
  const { source, lengths, total, first, last, find, pointAt } =
    _measurePolyline(points, format, createMetric, options);

  return (t) => {
    if (t <= 0 || total === 0) {
      if (t < 0 && extrapolateStart && !snapToVertex && total > 0) {
        return [source[0]!, pointAt(first, (t * total) / lengths[first]!)];
      }
      return total === 0 && t >= 1 ? source.slice() : source.slice(0, 1);
    } else if (t >= 1) {
      if (t > 1 && extrapolateEnd && !snapToVertex) {
        return [
          ...source,
          pointAt(last, 1 + ((t - 1) * total) / lengths[last]!),
        ];
      }
      return source.slice();
    }

    const [i, ratio] = find(t * total);
    const result = source.slice(0, i + 1);
    if (!snapToVertex && ratio > 0) {
      result.push(pointAt(i, ratio));
    }
    return result;
  };
}
