import _createArcCoordinates, { _resolveArcOptions } from '../_internal/_arc';
import { planarFormat } from '../_internal/_points';
import type { Coordinates } from '../_internal/_types';
import type { CreateArcOptions } from './types';

/**
 * 2点を結ぶ弧（2次ベジェ曲線）を、折れ線の頂点の配列として作る
 *
 * 座標は画面座標（y が下向き）として扱い、`curvature` が正の値なら進行方向の左に膨らむ。
 * 両端は渡した点をそのまま入れ、途中の点は `from` のプロパティを引き継ぐ。
 * `interpolatePolyline` や `interpolatePositionOnRoute` と組み合わせて使う
 * @param from 始点
 * @param to 終点
 * @param options オプション
 * @returns 弧の頂点の配列
 */
export default function createArc<P>(
  from: P,
  to: P,
  options: CreateArcOptions<P> = {},
): P[] {
  const {
    getCoordinates = planarFormat.get as (point: P) => Coordinates,
    createPoint = (coordinates, context) =>
      planarFormat.create(coordinates, context.from) as P,
  } = options;
  const [curvature, segmentCount] = _resolveArcOptions(
    options.curvature,
    options.segmentCount,
  );
  const coordinates = _createArcCoordinates(
    getCoordinates(from),
    getCoordinates(to),
    curvature,
    segmentCount,
    false,
  );
  return coordinates.map((point, k) =>
    k === 0
      ? from
      : k === segmentCount
        ? to
        : createPoint(point, { from, to, ratio: k / segmentCount }),
  );
}
