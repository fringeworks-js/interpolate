import _createArcCoordinates, { _resolveArcOptions } from '../_internal/_arc';
import {
  projectLatitude,
  toDegrees,
  toRadians,
  unprojectLatitude,
  wrapLongitude,
} from '../_internal/_geo';
import { geoFormat } from '../_internal/_points';
import type { Coordinates } from '../_internal/_types';
import type { CreateGeoArcOptions } from './types';

/**
 * 地図上の2点を結ぶ弧（2次ベジェ曲線）を、折れ線の頂点の配列として作る
 *
 * メルカトル座標で計算するので、画面上できれいな弧になる。`curvature` が正の値なら進行方向の左に膨らむ。
 * 点は `[lng, lat]`（GeoJSON の順）と `{ lat, lng }` を自動で判別する。
 * 経度は近い方向に取り、途中の点の経度は始点の経度から連続した値にする。
 * 両端は渡した点をそのまま入れ、途中の点は `from` のプロパティを引き継ぐ。
 * `interpolateGeoPolyline` や `interpolateGeoPositionOnRoute` と組み合わせて使う
 * @param from 始点
 * @param to 終点
 * @param options オプション
 * @returns 弧の頂点の配列
 */
export default function createGeoArc<P>(
  from: P,
  to: P,
  options: CreateGeoArcOptions<P> = {},
): P[] {
  const {
    getCoordinates = geoFormat.get as (point: P) => Coordinates,
    createPoint = (coordinates, context) =>
      geoFormat.create(coordinates, context.from) as P,
  } = options;
  const [curvature, segmentCount] = _resolveArcOptions(
    options.curvature,
    options.segmentCount,
  );
  const [lng0, lat0] = getCoordinates(from),
    [lng1, lat1] = getCoordinates(to);
  const coordinates = _createArcCoordinates(
    [toRadians(lng0), projectLatitude(lat0)],
    [toRadians(lng0 + wrapLongitude(lng1 - lng0)), projectLatitude(lat1)],
    curvature,
    segmentCount,
    true,
  );
  return coordinates.map(([x, y], k) =>
    k === 0
      ? from
      : k === segmentCount
        ? to
        : createPoint([toDegrees(x), unprojectLatitude(y)], {
            from,
            to,
            ratio: k / segmentCount,
          }),
  );
}
