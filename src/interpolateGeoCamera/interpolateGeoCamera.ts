import {
  projectLatitude,
  toDegrees,
  toRadians,
  unprojectLatitude,
  wrapLongitude,
} from '../_internal/_geo';
import { _positiveOr } from '../_internal/_numbers';
import { geoFormat } from '../_internal/_points';
import type { Coordinates } from '../_internal/_types';
import type {
  GeoCamera,
  GeoCameraInterpolator,
  InterpolateGeoCameraOptions,
} from './types';

/**
 * ズーム 0 での世界の幅（px）
 */
const WORLD_SIZE = 256;

const EPSILON2 = 1e-12;

/**
 * 地図のカメラを、遠い場所へは一度ズームアウトしてから移動し、ズームインするように補間する関数を返す
 *
 * d3 の `interpolateZoom` と同じ van Wijk と Nuij の方法を、Web メルカトルの座標とズームレベルに当てはめる。
 * 中心の点は `[lng, lat]`（GeoJSON の順）と `{ lat, lng }` を自動で判別する。
 * 経度は近い方向に移動し、返す経度は補間前の経度から連続した値にする。
 * `heading` は近い方向に回り、`tilt` は線形に補間する（どちらも補間前と補間後の両方にある場合だけ）
 * @param a 補間前のカメラ（t = 0 のときの値）
 * @param b 補間後のカメラ（t = 1 のときの値）
 * @param options オプション
 * @returns `t` に応じたカメラを返す関数。`duration` に移動量に見合った時間（ミリ秒）を持つ
 */
export default function interpolateGeoCamera<P>(
  a: GeoCamera<P>,
  b: GeoCamera<P>,
  options: InterpolateGeoCameraOptions<P> = {},
): GeoCameraInterpolator<P> {
  const {
    getCoordinates = geoFormat.get as (point: P) => Coordinates,
    createPoint = (coordinates, { source }) =>
      geoFormat.create(coordinates, source) as P,
  } = options;
  // 0 以下や有限でない数は既定値にする
  const viewportWidth = _positiveOr(options.viewportWidth, 1000),
    curve = _positiveOr(options.curve, Math.SQRT2);

  // ズーム 0 の世界の座標（px）に直す。経度は近い方向に取る
  const [lng0, lat0] = getCoordinates(a.center),
    [lng1Raw, lat1] = getCoordinates(b.center);
  const lng1 = lng0 + wrapLongitude(lng1Raw - lng0);
  const toWorld = (degrees: number) =>
    (toRadians(degrees) / (2 * Math.PI)) * WORLD_SIZE;
  const ux0 = toWorld(lng0),
    uy0 = (projectLatitude(lat0) / (2 * Math.PI)) * WORLD_SIZE,
    ux1 = toWorld(lng1),
    uy1 = (projectLatitude(lat1) / (2 * Math.PI)) * WORLD_SIZE;
  // 画面の幅に映る世界の幅
  const w0 = viewportWidth / 2 ** a.zoom,
    w1 = viewportWidth / 2 ** b.zoom;

  const rho = curve,
    rho2 = rho * rho,
    rho4 = rho2 * rho2;
  const dx = ux1 - ux0,
    dy = uy1 - uy0,
    d2 = dx * dx + dy * dy;

  // t から、中心の移動の割合と画面に映る世界の幅を求める
  let at: (t: number) => [ratio: number, width: number];
  let S: number;
  if (d2 < EPSILON2) {
    // 中心がほぼ同じ場合は、ズームだけを指数的に変える
    S = Math.log(w1 / w0) / rho;
    at = (t) => [t, w0 * Math.exp(rho * t * S)];
  } else {
    const d1 = Math.sqrt(d2),
      b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
      b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
      r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
      r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    const coshr0 = Math.cosh(r0),
      sinhr0 = Math.sinh(r0);
    at = (t) => {
      const s = t * S;
      return [
        (w0 / (rho2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - sinhr0),
        (w0 * coshr0) / Math.cosh(rho * s + r0),
      ];
    };
  }

  const hasHeading =
      typeof a.heading === 'number' && typeof b.heading === 'number',
    hasTilt = typeof a.tilt === 'number' && typeof b.tilt === 'number';

  const interpolate = ((t: number): GeoCamera<P> => {
    if (t <= 0) {
      return { ...a };
    } else if (t >= 1) {
      return { ...b };
    }
    const [ratio, width] = at(t);
    const x = ux0 + ratio * dx,
      y = uy0 + ratio * dy;
    const camera: GeoCamera<P> = {
      center: createPoint(
        [
          toDegrees((x / WORLD_SIZE) * 2 * Math.PI),
          unprojectLatitude((y / WORLD_SIZE) * 2 * Math.PI),
        ],
        { source: a.center },
      ),
      zoom: Math.log2(viewportWidth / width),
    };
    if (hasHeading) {
      camera.heading = a.heading + wrapLongitude(b.heading - a.heading) * t;
    }
    if (hasTilt) {
      camera.tilt = a.tilt + (b.tilt - a.tilt) * t;
    }
    return camera;
  }) as GeoCameraInterpolator<P>;
  interpolate.duration = (Math.abs(S) * 1000 * rho) / Math.SQRT2;
  return interpolate;
}
