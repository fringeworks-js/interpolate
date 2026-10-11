import type { PointFormat } from './_points';
import type { PolygonSpace } from './_polygon';
import type { Coordinates, PolylineMorphOptions } from './_types';

type Sample = {
  coordinates: Coordinates;
  /**
   * 直前の頂点
   */
  index: number;
};

/**
 * 各頂点の位置を、全体の長さに対する割合で求める（長さがない場合は全て 0）
 */
const getFractions = (coordinates: Coordinates[]): number[] => {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const [x0, y0] = coordinates[i - 1],
      [x1, y1] = coordinates[i];
    cumulative.push(cumulative[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const total = cumulative[cumulative.length - 1];
  return cumulative.map((length) => (total > 0 ? length / total : 0));
};

/**
 * 割合 fraction の位置の座標と、直前の頂点を求める
 */
const sample = (
  coordinates: Coordinates[],
  fractions: number[],
  fraction: number,
): Sample => {
  let i = 0;
  while (i < fractions.length - 2 && fractions[i + 1] <= fraction) {
    i++;
  }
  if (coordinates.length === 1) {
    return { coordinates: coordinates[0], index: 0 };
  }
  const span = fractions[i + 1] - fractions[i];
  const ratio = span > 0 ? (fraction - fractions[i]) / span : 0;
  if (ratio >= 1) {
    return { coordinates: coordinates[i + 1], index: i + 1 };
  }
  const [x0, y0] = coordinates[i],
    [x1, y1] = coordinates[i + 1];
  return {
    coordinates: [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio],
    index: i,
  };
};

/**
 * 2つの割合の配列を合わせ、重複を除いて並べる
 */
const mergeFractions = (a: number[], b: number[]): number[] => {
  const merged = [...a, ...b].sort((x, y) => x - y);
  return merged.filter((value, i) => i === 0 || value - merged[i - 1] > 1e-12);
};

/**
 * 折れ線どうしのモーフィングの補間関数を作る
 */
export default function _createPolylineMorphInterpolator<P>(
  a: readonly P[],
  b: readonly P[],
  format: PointFormat,
  createSpace: (coordinates: Coordinates[][][]) => PolygonSpace,
  options: PolylineMorphOptions<P>,
): (t: number) => P[] {
  // 両方とも点がない場合は、常に空の配列を返す
  if (!a.length && !b.length) {
    return () => [];
  }
  const {
    origin = 'start',
    extrapolateStart = false,
    extrapolateEnd = false,
    getCoordinates = format.get as (point: P) => Coordinates,
    createPoint = (coordinates, { from, to, ratio }) =>
      format.create(coordinates, ratio < 0.5 ? from : to) as P,
  } = options;

  const sourceA = a.slice(),
    sourceB = b.slice();
  const space = createSpace([
    [sourceA.map((point) => getCoordinates(point))],
    [sourceB.map((point) => getCoordinates(point))],
  ]);
  let coordinatesA = space.coordinates[0][0],
    coordinatesB = space.coordinates[1][0];

  // 点のない側は、点のある側の折れ線上の基準点1つだけの折れ線とみなす
  const emptyA = !coordinatesA.length,
    emptyB = !coordinatesB.length;
  if (emptyA || emptyB) {
    const existing = emptyA ? coordinatesB : coordinatesA;
    const point =
      origin === 'start'
        ? existing[0]
        : origin === 'end'
          ? existing[existing.length - 1]
          : origin === 'center'
            ? sample(existing, getFractions(existing), 0.5).coordinates
            : space.project(getCoordinates(origin as P));
    if (emptyA) {
      coordinatesA = [point];
    } else {
      coordinatesB = [point];
    }
  }
  const fractionsA = getFractions(coordinatesA),
    fractionsB = getFractions(coordinatesB);

  // 両方の頂点の位置で打ち直す
  const pairs = mergeFractions(fractionsA, fractionsB).map(
    (fraction) =>
      [
        sample(coordinatesA, fractionsA, fraction),
        sample(coordinatesB, fractionsB, fraction),
      ] as const,
  );

  return (t) => {
    if (t <= 0 && !(t < 0 && extrapolateStart)) {
      return sourceA.slice();
    } else if (t >= 1 && !(t > 1 && extrapolateEnd)) {
      return sourceB.slice();
    }
    // 点のない側の頂点の代わりに、点のある側の頂点を使う
    const side = emptyA ? 1 : emptyB ? 0 : t < 0.5 ? 0 : 1;
    return pairs.map(([sampleA, sampleB]) => {
      const [x0, y0] = sampleA.coordinates,
        [x1, y1] = sampleB.coordinates;
      const coordinates = space.unproject(
        [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t],
        side,
        0,
        side ? sampleB.index : sampleA.index,
      );
      const from = sourceA[sampleA.index],
        to = sourceB[sampleB.index];
      return createPoint(coordinates, {
        from: emptyA ? to : from,
        to: emptyB ? from : to,
        ratio: t,
      });
    });
  };
}
