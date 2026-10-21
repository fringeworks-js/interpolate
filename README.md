# @fringeworks/interpolate

`@fringeworks/interpolate` is a library some will find handy, offering niche interpolators that [d3-interpolate](https://d3js.org/d3-interpolate) does not cover, such as typing effects and animated lines and polygons on maps.

**[日本語のREADMEはこちら](./README.ja.md)**

## Installation

```bash
npm install @fringeworks/interpolate
# or
pnpm add @fringeworks/interpolate
```

## Usage

Functions, types, and constants can be imported by the same name from the root or from a per-function path. A per-function path also provides its function as the default export.

```ts
import { interpolateTyping } from '@fringeworks/interpolate';
import interpolateTyping from '@fringeworks/interpolate/interpolateTyping';
```

Like d3-interpolate, each function takes values and returns a function that returns the value for `t` (0 to 1). You can pass it directly to d3-transition's `tween` and similar APIs.

```ts
const i = interpolateTyping('', 'Hello');
i(0); // ''
i(0.6); // 'Hel'
i(1); // 'Hello'
```

### `t` outside the range

When `t` is outside 0 to 1, the result stops at the nearest end. The polyline, route, morph, and polygon functions keep calculating outside the range when you set `extrapolateStart` (t < 0) or `extrapolateEnd` (t > 1). Use them with easings that overshoot, such as `backOut` and `elasticOut`.

### Point formats

Functions that take points detect the following point formats automatically. For other formats, convert points with the `getCoordinates` and `createPoint` options.

| Function                       | Point format                                                         |
| ------------------------------ | -------------------------------------------------------------------- |
| `interpolatePolyline`, etc.    | `[x, y]` / `{ x, y }`                                                |
| `interpolateGeoPolyline`, etc. | `[lng, lat]` (GeoJSON order) / `{ lat, lng }` (Google Maps, Leaflet) |

New points inherit the properties of the original point (for arrays, the elements after the second).

```ts
// Points shaped like { latitude, longitude }
interpolateGeoPolyline(points, {
  getCoordinates: ({ latitude, longitude }) => [longitude, latitude],
  createPoint: ([longitude, latitude], { from }) => ({
    ...from,
    latitude,
    longitude,
  }),
});
```

### Calculations on maps

The map functions (those with `Geo` in their names) calculate in Mercator coordinates to match how Google Maps and Leaflet normally draw. They do not depend on any map library.

- Segments that cross longitude ±180° take the shorter direction (179° → -179° is a 2° move)
- The longitude of a new point is not normalized to -180 to 180; it stays continuous with the original point's longitude (for example, 181° after 179°). Google Maps normalizes longitudes automatically, and Leaflet draws continuous longitudes correctly
- Latitudes are clamped to the Web Mercator range (±85.0511°) before projection

### Composition

`chainInterpolators` and `staggerInterpolators` combine interpolators into one. They have no notion of time and only compute values from `t`, so you can jump to any point or link them to scrolling or a slider. They also work outside the DOM (maps, Canvas), where d3-transition does not apply: just advance `t` with `requestAnimationFrame` or similar. Composed interpolators can be composed again. `reverseInterpolator` and `repeatInterpolator` play them backward or repeat them.

---

## API

| Function                                            | Description                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `interpolateTyping(a, b, options?)`                 | Returns an interpolator that retypes one string into another, like typing                              |
| `interpolateFormattedNumber(a, b, options?)`        | Returns an interpolator that interpolates numbers and returns formatted strings                        |
| `interpolateDurationText(a, b, options?)`           | Returns an interpolator for time strings such as `mm:ss`                                               |
| `interpolateScramble(a, b, options?)`               | Returns an interpolator that changes one string into another through random characters                 |
| `interpolatePolyline(points, options?)`             | Returns an interpolator that draws a polyline from its start up to the fraction t of its length        |
| `interpolateGeoPolyline(points, options?)`          | The map version of `interpolatePolyline`                                                               |
| `interpolatePolylineMorph(a, b, options?)`          | Returns an interpolator that morphs one polyline into another                                          |
| `interpolateGeoPolylineMorph(a, b, options?)`       | The map version of `interpolatePolylineMorph`                                                          |
| `interpolatePositionOnRoute(route, options?)`       | Returns an interpolator that gives the position and direction at the fraction t along a polyline route |
| `interpolateGeoPositionOnRoute(route, options?)`    | The map version of `interpolatePositionOnRoute`                                                        |
| `createArc(from, to, options?)`                     | Creates an arc between two points as an array of polyline vertices                                     |
| `createGeoArc(from, to, options?)`                  | The map version of `createArc`                                                                         |
| `interpolatePolygon(polygon, options?)`             | Returns an interpolator that scales a polygon from zero area up to its original shape                  |
| `interpolateGeoPolygon(polygon, options?)`          | The map version of `interpolatePolygon`                                                                |
| `interpolateMultiPolygon(polygons, options?)`       | The multiple-polygon version of `interpolatePolygon`                                                   |
| `interpolateGeoMultiPolygon(polygons, options?)`    | The map version of `interpolateMultiPolygon`                                                           |
| `interpolateGeoCamera(a, b, options?)`              | Returns an interpolator that moves a map camera, zooming out first for distant places                  |
| `chainInterpolators(interpolators, options?)`       | Returns an interpolator that plays interpolators one after another                                     |
| `staggerInterpolators(interpolators, options?)`     | Returns an interpolator that plays interpolators together, each starting a little later                |
| `reverseInterpolator(interpolator)`                 | Returns an interpolator that plays an interpolator backward                                            |
| `repeatInterpolator(interpolator, count, options?)` | Returns an interpolator that repeats an interpolator a given number of times                           |

### `interpolateTyping`

```ts
interpolateTyping(a: string, b: string, options?: InterpolateTypingOptions): (t: number) => string
```

Returns an interpolator that retypes one string into another, like typing.

- If `a` is empty, it types `b` from the start
- If `b` is empty, it erases `a` from the end
- Otherwise, it erases `a` from the end during the `eraseRatio` share of the time (by default the first half, 0 to 0.5), then types `b` during the rest
- With `keepCommonPrefix`, it keeps the common leading part and erases and types only the differing part. If nothing is left to erase or to type, the remaining part uses the whole time

Characters are handled as graphemes (what looks like one character), so emoji and combining characters are never split. In environments without `Intl.Segmenter`, characters are handled as code points.\
If `t` is 0 or less, it returns `a`; if `t` is 1 or more, it returns `b`.

```ts
interpolateTyping('', 'Hello')(0.6); // 'Hel'
interpolateTyping('Hello', '')(0.4); // 'Hel'
interpolateTyping('Hello', 'World')(0.25); // 'He'
interpolateTyping('Hello', 'World')(0.75); // 'Wo'
interpolateTyping('Hello', 'World', { eraseRatio: 0.2 })(0.6); // 'Wo'
```

| Parameter  | Type                       | Description                               |
| ---------- | -------------------------- | ----------------------------------------- |
| `a`        | `string`                   | The start string (the value when `t` = 0) |
| `b`        | `string`                   | The end string (the value when `t` = 1)   |
| `options?` | `InterpolateTypingOptions` | The options below                         |

| Option              | Type      | Description                                                                                                                                                         |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eraseRatio?`       | `number`  | When erasing then typing, the share of the whole time spent erasing (0 to 1). Values out of range are clamped to 0 to 1, and `NaN` becomes `0.5`. Defaults to `0.5` |
| `keepCommonPrefix?` | `boolean` | Keeps the common leading part (in graphemes) and erases and types only the differing part                                                                           |

### `interpolateFormattedNumber`

```ts
interpolateFormattedNumber(a: number, b: number, options?: InterpolateFormattedNumberOptions): (t: number) => string
```

Returns an interpolator that interpolates numbers and returns formatted strings. Use it for count-up displays and similar.

- By default, intermediate values are rounded to the larger number of fraction digits of `a` and `b` before formatting. Between integers, intermediate values are integers too, so nothing like `1,234.567` appears
- If `t` is 0 or less, it formats `a`; if `t` is 1 or more, it formats `b`

```ts
const i = interpolateFormattedNumber(1200, 12000, {
  formatter: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }),
});
i(0.5); // '$6,600.00'

interpolateFormattedNumber(0, 100, { formatter: (value) => `${value}%` })(0.25); // '25%'
```

| Option            | Type              | Description                                                                                                                                                                                           |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formatter?`      | `NumberFormatter` | A function that turns a number into a string, or an `Intl.NumberFormat`. Defaults to `new Intl.NumberFormat()` (the runtime locale)                                                                   |
| `fractionDigits?` | `number`          | The number of fraction digits for intermediate values. Fractions are rounded; negative or non-finite values fall back to the default. Defaults to the larger number of fraction digits of `a` and `b` |
| `rounding?`       | `Rounding`        | How to round (`'round'` / `'floor'` / `'ceil'`). With `'ceil'`, a countdown shows 1 until just before it reaches 0. Defaults to `'round'`                                                             |

### `interpolateDurationText`

```ts
interpolateDurationText(a: string, b: string, options?: InterpolateDurationTextOptions): (t: number) => string
```

Returns an interpolator for time strings. Use it for timer and countdown displays.

- It reads `h:mm:ss` / `mm:ss` / `ss`, and seconds may have fractions (`00:09.58`). It throws a `TypeError` for strings it cannot read
- It converts everything to seconds before interpolating, so carries such as `00:59` → `01:00` flow naturally
- Intermediate strings follow the format of `b` (number of parts, zero padding, fraction digits) and are rounded to the smallest unit of `b`. If `a` and `b` have the same number of parts, the first part is zero-padded to the smaller width of the two
- The first part may exceed 60 or 24 (`90:00`, `30:00:00`). Times of day that do not cross midnight (`09:00` → `17:30`) also work
- If `t` is 0 or less, it returns `a` as is; if `t` is 1 or more, it returns `b` as is

```ts
interpolateDurationText('05:00', '00:00')(0.5); // '02:30'
interpolateDurationText('0:00:00', '1:30:00')(0.5); // '0:45:00'
interpolateDurationText('00:00.00', '00:09.58')(0.5); // '00:04.79'
```

| Option      | Type       | Description                                                                                                            |
| ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `rounding?` | `Rounding` | How to round intermediate values to the smallest unit of `b` (`'round'` / `'floor'` / `'ceil'`). Defaults to `'round'` |

### `interpolateScramble`

```ts
interpolateScramble(a: string, b: string, options?: InterpolateScrambleOptions): (t: number) => string
```

Returns an interpolator that changes one string into another through random characters.

- Each character has its own staggered range: before it, the character of `a`; within it, random characters; after it, the character of `b`. Characters settle from left to right
- If the lengths differ, it uses the longer one. Positions missing from `b` disappear when they settle; positions missing from `a` do not appear until their range starts
- Whitespace is never scrambled. Characters are handled as graphemes
- The same `t` always gives the same string. Random characters come from a pseudo-random number based on the position and `t`
- If `t` is 0 or less, it returns `a` as is; if `t` is 1 or more, it returns `b` as is

```ts
const i = interpolateScramble('', 'ACCESS GRANTED');
i(0.3); // 'Amxypi'
i(0.5); // 'ACCES1 7D' (settles from the left; the rest are random)
i(0.7); // 'ACCESS GxeSnC'
```

| Option         | Type     | Description                                                                                                                                                   |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stagger?`     | `number` | The gap until the next character starts, as a ratio of one character's length. 0 changes all characters at once; 1 changes them one by one. Defaults to `0.2` |
| `characters?`  | `string` | The characters to use randomly. Defaults to uppercase and lowercase letters and digits                                                                        |
| `changeCount?` | `number` | How many times the random characters change while `t` goes from 0 to 1. Defaults to `60`                                                                      |
| `seed?`        | `number` | A value that decides the sequence of random characters. Defaults to `0`                                                                                       |

If `characters` is empty, or `stagger` / `changeCount` is negative or not finite, the default value is used.

### `interpolatePolyline`

```ts
interpolatePolyline<P>(points: readonly P[], options?: InterpolatePolylineOptions<P>): (t: number) => P[]
```

Returns an interpolator that draws a polyline from its start up to the fraction `t` of its total length. Use it to animate a line being drawn.

- At the end, it adds a point interpolated within the segment at the position for `t`
- If `t` is 0 or less, it returns only the first point; if `t` is 1 or more, it returns the whole polyline
- It returns a new array each time. Original points are included as the same references; only the interpolated point is new

```ts
const i = interpolatePolyline([
  [0, 0],
  [10, 0],
  [10, 10],
]);
i(0.25); // [[0, 0], [5, 0]]
i(0.75); // [[0, 0], [10, 0], [10, 5]]
```

| Option              | Type                                                                | Description                                                                                                       |
| ------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `snapToVertex?`     | `boolean`                                                           | Ends at the last vertex reached instead of adding an interpolated point. It does not extrapolate in this case     |
| `extrapolateStart?` | `boolean`                                                           | Keeps calculating for t < 0, extending the first segment backward                                                 |
| `extrapolateEnd?`   | `boolean`                                                           | Keeps calculating for t > 1, extending the last segment forward                                                   |
| `getCoordinates?`   | `(point: P) => Coordinates`                                         | A function that gets coordinates from a point                                                                     |
| `createPoint?`      | `(coordinates: Coordinates, context: PolylinePointContext<P>) => P` | A function that creates a point from coordinates. `context` has the segment's start `from`, end `to`, and `ratio` |

### `interpolateGeoPolyline`

```ts
interpolateGeoPolyline<P>(points: readonly P[], options?: InterpolateGeoPolylineOptions<P>): (t: number) => P[]
```

The map version of `interpolatePolyline`. By default, it interpolates along straight lines in Mercator coordinates (how Google Maps and Leaflet normally draw) and measures lengths in projected coordinates, so the line grows at a constant speed on screen.

```ts
const i = interpolateGeoPolyline([
  { lat: 35.68, lng: 139.77 },
  { lat: 21.31, lng: -157.86 }, // crosses longitude ±180°
]);
polyline.setPath(i(0.5));
```

In addition to the options of `interpolatePolyline`, it has the following option.

| Option      | Type      | Description                                                                        |
| ----------- | --------- | ---------------------------------------------------------------------------------- |
| `geodesic?` | `boolean` | Interpolates along great circles. Use it with `geodesic` of a Google Maps Polyline |

### `interpolatePolylineMorph`

```ts
interpolatePolylineMorph<P>(a: readonly P[], b: readonly P[], options?: InterpolatePolylineMorphOptions<P>): (t: number) => P[]
```

Returns an interpolator that morphs one polyline into another.

- It resamples both polylines at the combined vertex positions (as fractions of the total length) of both, then interpolates matching points linearly. Polylines with different numbers of points can be matched, and no corner is rounded off midway
- If `t` is 0 or less, it returns the points of `a`; if `t` is 1 or more, those of `b`, in a new array
- New points inherit the properties of the preceding vertex on the `a` side if `t` is less than 0.5, otherwise on the `b` side
- Polylines drawn in opposite directions flip over as they morph. Align their directions beforehand if needed
- When either polyline has no points, it grows from or shrinks to `origin` (the start by default) on the polyline that has points. The line keeps its shape while changing toward that point; to erase a line by retracting it, use `reverseInterpolator(interpolatePolyline(route))`. If neither polyline has points, it always returns an empty array

```ts
const i = interpolatePolylineMorph(
  [
    [0, 0],
    [5, 0],
    [10, 0],
  ],
  [
    [0, 10],
    [10, 20],
  ],
);
i(0.5); // [[0, 5], [5, 7.5], [10, 10]]
```

| Option              | Type                                                                     | Description                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `origin?`           | `'start' \| 'end' \| 'middle' \| P`                                      | When either polyline has no points, the point it grows from or shrinks to: the start, the end, or the halfway point along the polyline that has points, or a point. Defaults to `'start'` |
| `extrapolateStart?` | `boolean`                                                                | Keeps calculating for t < 0                                                                                                                                                               |
| `extrapolateEnd?`   | `boolean`                                                                | Keeps calculating for t > 1                                                                                                                                                               |
| `getCoordinates?`   | `(point: P) => Coordinates`                                              | A function that gets coordinates from a point                                                                                                                                             |
| `createPoint?`      | `(coordinates: Coordinates, context: PolylineMorphPointContext<P>) => P` | A function that creates a point from coordinates. `context` has the preceding vertex on the `a` side `from`, on the `b` side `to`, and the value of `t` as `t`                            |

### `interpolateGeoPolylineMorph`

```ts
interpolateGeoPolylineMorph<P>(a: readonly P[], b: readonly P[], options?: InterpolateGeoPolylineMorphOptions<P>): (t: number) => P[]
```

The map version of `interpolatePolylineMorph`. It interpolates in Mercator coordinates. The options are the same as `interpolatePolylineMorph`.

### `interpolatePositionOnRoute`

```ts
interpolatePositionOnRoute<P>(route: readonly P[], options?: InterpolatePositionOnRouteOptions<P>): (t: number) => RoutePosition<P>
```

Treats a polyline as a route and returns an interpolator that gives the position `point` at the fraction `t` of its total length and the direction of travel `angle`. Use it to move an icon along a route while rotating it.

- `angle` is the clockwise angle from the positive x axis in screen coordinates (degrees, -180 to 180). You can pass it to CSS `rotate()` as is
- Exactly at a vertex, it returns the original point as the same reference, and the direction is that of the segment ahead (at the end, the last segment)
- If the total length is 0, `angle` is 0. It throws a `RangeError` if there are no points

```ts
const i = interpolatePositionOnRoute([
  [0, 0],
  [10, 0],
  [10, 10],
]);
i(0.25); // { point: [5, 0], angle: 0 }
i(0.75); // { point: [10, 5], angle: 90 }
```

The options are the same as `interpolatePolyline` except `snapToVertex` (`extrapolateStart` / `extrapolateEnd` / `getCoordinates` / `createPoint`).

### `interpolateGeoPositionOnRoute`

```ts
interpolateGeoPositionOnRoute<P>(route: readonly P[], options?: InterpolateGeoPositionOnRouteOptions<P>): (t: number) => GeoRoutePosition<P>
```

The map version of `interpolatePositionOnRoute`. It returns the position `point` and the heading of travel `heading`.

- `heading` is the clockwise bearing from north (degrees, -180 to 180), the same as Google Maps' `computeHeading`
- By default, it follows straight lines in Mercator coordinates, and `heading` is the direction on screen. With `geodesic`, it moves along great circles, and `heading` is the direction of the great circle at that position

```ts
const i = interpolateGeoPositionOnRoute(route);
const { point, heading } = i(t);
marker.setPosition(point);
marker.setIcon({ ...icon, rotation: heading });
```

The options are the same as `interpolateGeoPolyline` except `snapToVertex` (`geodesic` / `extrapolateStart` / `extrapolateEnd` / `getCoordinates` / `createPoint`).

### `createArc`

```ts
createArc<P>(from: P, to: P, options?: CreateArcOptions<P>): P[]
```

Creates an arc (a quadratic Bézier curve) between two points as an array of polyline vertices. Use it with `interpolatePolyline` to draw the arc, or with `interpolatePositionOnRoute` to move along it.

- Coordinates are treated as screen coordinates (y points down)
- Both ends are the points you pass as is; points in between inherit the properties of `from`

```ts
const arc = createArc([0, 0], [10, 0]);
arc[32]; // [5, -2] (0.2 times the distance high, bulging to the left of travel)
interpolatePolyline(arc);
```

| Option            | Type                                                                | Description                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `curvature?`      | `number`                                                            | The height of the arc as a ratio of the distance between the points. Positive values bulge to the left of travel, negative values to the right, and 0 gives a straight line. Non-finite values fall back to the default. Defaults to `0.2` |
| `segmentCount?`   | `number`                                                            | How many line segments make up the arc. Fractions are rounded; values below 1 or non-finite values fall back to the default. Defaults to `64`                                                                                              |
| `getCoordinates?` | `(point: P) => Coordinates`                                         | A function that gets coordinates from a point                                                                                                                                                                                              |
| `createPoint?`    | `(coordinates: Coordinates, context: PolylinePointContext<P>) => P` | A function that creates a point from coordinates. `context` has the start `from`, the end `to`, and the position on the curve `ratio` (0 to 1)                                                                                             |

### `createGeoArc`

```ts
createGeoArc<P>(from: P, to: P, options?: CreateGeoArcOptions<P>): P[]
```

The map version of `createArc`. It calculates in Mercator coordinates, so the arc looks clean on screen. When crossing longitude ±180°, it takes the shorter direction, and the longitudes of points in between stay continuous with the start. The options are the same as `createArc`.

```ts
const arc = createGeoArc(
  { lat: 35.55, lng: 139.78 },
  { lat: 21.32, lng: -157.92 },
);
interpolateGeoPolyline(arc); // draw the arc
interpolateGeoPositionOnRoute(arc); // move a plane icon along the arc
```

### `interpolatePolygon`

```ts
interpolatePolygon<P>(polygon: readonly (readonly P[])[], options?: InterpolatePolygonOptions<P>): (t: number) => P[][]
```

Returns an interpolator that scales a polygon around an origin, from zero area (`t` = 0) to its original shape (`t` = 1).

- Like a GeoJSON Polygon, `polygon` is an array of rings (the first is the exterior, the rest are holes). Rings may or may not repeat the first point at the end
- Coordinates are treated as screen coordinates (y points down). `top` in `origin` is the smaller y side
- If `t` is 1 or more, it returns the original points as the same references

```ts
const square = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ],
];
interpolatePolygon(square)(0.5); // [[[2.5, 2.5], [7.5, 2.5], [7.5, 7.5], [2.5, 7.5]]]
interpolatePolygon(square, { origin: 'bottom', axis: 'y' })(0.5); // [[[0, 5], [10, 5], [10, 10], [0, 10]]]
```

| Option              | Type                                                               | Description                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `origin?`           | `'centroid' \| OriginKeyword \| P`                                 | The origin of scaling. `'centroid'` is the area centroid (the second and later rings are subtracted as holes regardless of winding order). Keywords use the bounding box. Defaults to `'centroid'` |
| `axis?`             | `ScaleAxis`                                                        | The axis to scale. With `'x'` / `'y'`, the shape grows from an edge. Defaults to `'both'`                                                                                                          |
| `extrapolateStart?` | `boolean`                                                          | Keeps calculating for t < 0, flipping the shape across the origin                                                                                                                                  |
| `extrapolateEnd?`   | `boolean`                                                          | Keeps calculating for t > 1, scaling beyond the original size                                                                                                                                      |
| `getCoordinates?`   | `(point: P) => Coordinates`                                        | A function that gets coordinates from a point                                                                                                                                                      |
| `createPoint?`      | `(coordinates: Coordinates, context: PolygonPointContext<P>) => P` | A function that creates a point from coordinates. `context` has the original point `source`                                                                                                        |

### `interpolateGeoPolygon`

```ts
interpolateGeoPolygon<P>(polygon: readonly (readonly P[])[], options?: InterpolateGeoPolygonOptions<P>): (t: number) => P[][]
```

The map version of `interpolatePolygon`. It scales in Mercator coordinates, so shapes are not distorted on screen even at high latitudes. `top` in `origin` is north. The options are the same as `interpolatePolygon`.

### `interpolateMultiPolygon`

```ts
interpolateMultiPolygon<P>(polygons: readonly (readonly (readonly P[])[])[], options?: InterpolateMultiPolygonOptions<P>): (t: number) => P[][][]
```

The multiple-polygon version of `interpolatePolygon`. Like a GeoJSON MultiPolygon, `polygons` is an array of polygons. By default, it uses one origin for the whole.

In addition to the options of `interpolatePolygon`, it has the following option.

| Option              | Type      | Description                                                    |
| ------------------- | --------- | -------------------------------------------------------------- |
| `originPerPolygon?` | `boolean` | Finds an origin for each polygon and scales each one around it |

### `interpolateGeoMultiPolygon`

```ts
interpolateGeoMultiPolygon<P>(polygons: readonly (readonly (readonly P[])[])[], options?: InterpolateGeoMultiPolygonOptions<P>): (t: number) => P[][][]
```

The map version of `interpolateMultiPolygon`. The options are the same as `interpolateMultiPolygon`.

### `interpolateGeoCamera`

```ts
interpolateGeoCamera<P>(a: GeoCamera<P>, b: GeoCamera<P>, options?: InterpolateGeoCameraOptions<P>): GeoCameraInterpolator<P>
```

Returns an interpolator that moves a map camera (`{ center, zoom }`): for distant places, it zooms out first, moves, and zooms back in. It applies the van Wijk and Nuij method used by d3's `interpolateZoom` to Web Mercator coordinates and zoom levels.

- Longitude moves in the shorter direction, and the returned longitude stays continuous with that of `a`
- `heading` turns in the shorter direction and `tilt` is interpolated linearly. When only one of `a` and `b` has one of them, that value is used throughout
- The returned value has only `center`, `zoom`, `heading`, and `tilt`; other properties of `a` / `b` are not included
- The returned function has `duration`, a time in milliseconds that suits the amount of movement: short for near moves, longer for far ones
- If `t` is 0 or less, it returns the values of `a`; if `t` is 1 or more, those of `b` (the center point is the same reference), in a new object

```ts
const i = interpolateGeoCamera(
  { center: { lat: 35.68, lng: 139.77 }, zoom: 12 },
  { center: { lat: 40.71, lng: -74.0 }, zoom: 12 },
  { viewportWidth: map.getDiv().offsetWidth },
);
// advance t from 0 to 1 over i.duration milliseconds
map.moveCamera(i(t));
```

| Option            | Type                                                              | Description                                                                                                                      |
| ----------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `viewportWidth?`  | `number`                                                          | The width of the map (px). The ratio of the travel distance to the screen width decides how far it zooms out. Defaults to `1000` |
| `curve?`          | `number`                                                          | How much the path curves (d3's `rho`, `curve` of Mapbox's `flyTo`). Larger values zoom out more. Defaults to `√2`                |
| `getCoordinates?` | `(point: P) => Coordinates`                                       | A function that gets coordinates (`[lng, lat]`) from a center point                                                              |
| `createPoint?`    | `(coordinates: Coordinates, context: CameraPointContext<P>) => P` | A function that creates a center point from coordinates. `context` has the center point of `a` as `source`                       |

If `viewportWidth` / `curve` is 0 or less or not finite, the default value is used.

### `chainInterpolators`

```ts
chainInterpolators<I extends readonly (Interpolator<unknown> | null)[]>(interpolators: I, options?: ChainInterpolatorsOptions): Interpolator<ChainedValue<I>>
```

Returns an interpolator that plays interpolators one after another.

- It splits 0 to 1 into segments by the ratio of `weights`, and returns the value of the interpolator for the segment containing `t`, called with `t` rescaled to that segment (0 to 1). A `t` exactly on a boundary belongs to the later segment
- `null` is a hold segment. It returns the end value of the previous interpolator (or the start value of the next one if it comes first)
- For `t` outside the range, the first or last interpolator receives the extended `t` as is. Whether it extrapolates depends on that interpolator's options

```ts
const i = chainInterpolators(
  [interpolateTyping('Hello', ''), null, interpolateTyping('', 'World')],
  { weights: [2, 1, 2] },
);
i(0.2); // 'He'
i(0.5); // '' (hold)
i(0.8); // 'Wo'
```

| Option     | Type                | Description                                                                  |
| ---------- | ------------------- | ---------------------------------------------------------------------------- |
| `weights?` | `readonly number[]` | The ratio of segment lengths. Segments with 0 are skipped. Defaults to equal |
| `ease?`    | `Easing`            | An easing function applied to `t` within each segment. Not applied to holds  |

Missing weights and negative or non-finite weights become 1, and extra weights are ignored. If the weights total 0, it splits evenly. It throws a `RangeError` if there are no interpolators (an empty array, or every segment is a hold).

### `staggerInterpolators`

```ts
staggerInterpolators<I extends readonly Interpolator<unknown>[]>(interpolators: I, options?: StaggerInterpolatorsOptions): Interpolator<StaggeredValues<I>>
```

Returns an interpolator that plays interpolators together, each starting a little later, and returns all their values as an array.

- Each interpolator receives `t` rescaled to its own range and clamped to 0 to 1. Before it starts it stays at 0; after it ends it stays at 1
- For easings that overshoot, set `ease`. Each interpolator can extrapolate through its own options
- It returns a new array each time

```ts
const i = staggerInterpolators([drawRouteA, drawRouteB, drawRouteC]);
// Each lasts 0.5 and they start at 0 / 0.25 / 0.5
const [a, b, c] = i(0.5); // drawRouteA(1), drawRouteB(0.5), drawRouteC(0)
```

| Option     | Type                                     | Description                                                                                                                                 |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `stagger?` | `number`                                 | The gap until the next start, as a ratio of one item's length. 0 plays all at once; 1 plays them in turn without overlap. Defaults to `0.5` |
| `ranges?`  | `readonly (readonly [number, number])[]` | The range `[start, end]` of each interpolator. Takes precedence over `stagger`                                                              |
| `ease?`    | `Easing`                                 | An easing function applied to `t` within each range                                                                                         |

The length of each item is chosen so that the whole fits in 0 to 1, so any `stagger` stays in range. Missing `ranges` are filled with ranges from `stagger`, and extra ones are ignored. If `stagger` is negative or not finite, the default value is used.

### `reverseInterpolator`

```ts
reverseInterpolator<T>(interpolator: Interpolator<T>): Interpolator<T>
```

Returns an interpolator that plays an interpolator backward (`t => interpolator(1 - t)`).

```ts
const i = reverseInterpolator(interpolateTyping('', 'Hello'));
i(0.4); // 'Hel'
```

### `repeatInterpolator`

```ts
repeatInterpolator<T>(interpolator: Interpolator<T>, count: number, options?: RepeatInterpolatorOptions): Interpolator<T>
```

Returns an interpolator that repeats an interpolator `count` times.

- `count` may be fractional (2.5 ends partway through the third time). If `count` is 0 or less or not finite, it plays once
- A `t` exactly on a boundary between repetitions is the end of the earlier one
- For `t` outside the range, the first or last repetition receives the extended `t` as is

```ts
const blink = repeatInterpolator(fade, 2, { direction: 'alternate' }); // there and back
```

| Option       | Type              | Description                                                                                                                                                       |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direction?` | `RepeatDirection` | The direction of each repetition, the same as CSS `animation-direction`: `'normal'` / `'reverse'` / `'alternate'` / `'alternate-reverse'`. Defaults to `'normal'` |

### Types

| Type                                      | Description                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `InterpolateTypingOptions`                | Options for `interpolateTyping`                                                                    |
| `NumberFormatter`                         | A function that turns a number into a string, or an `Intl.NumberFormat`                            |
| `Rounding`                                | How to round: `'round'` / `'floor'` / `'ceil'`                                                     |
| `InterpolateFormattedNumberOptions`       | Options for `interpolateFormattedNumber`                                                           |
| `InterpolateDurationTextOptions`          | Options for `interpolateDurationText`                                                              |
| `InterpolateScrambleOptions`              | Options for `interpolateScramble`                                                                  |
| `Coordinates`                             | Coordinates: `[x, y]` on a plane, `[lng, lat]` on a map                                            |
| `OriginKeyword`                           | An origin keyword, the same as CSS `transform-origin` (`'center'`, `'top'`, `'bottom left'`, etc.) |
| `ScaleAxis`                               | The axis to scale: `'both'` / `'x'` / `'y'`                                                        |
| `PolylinePointContext<P>`                 | The information passed to `createPoint` of the polyline functions                                  |
| `PolygonPointContext<P>`                  | The information passed to `createPoint` of the polygon functions                                   |
| `InterpolatePolylineOptions<P>`           | Options for `interpolatePolyline`                                                                  |
| `InterpolateGeoPolylineOptions<P>`        | Options for `interpolateGeoPolyline`                                                               |
| `InterpolatePositionOnRouteOptions<P>`    | Options for `interpolatePositionOnRoute`                                                           |
| `RoutePosition<P>`                        | The value of `interpolatePositionOnRoute` (`{ point, angle }`)                                     |
| `InterpolateGeoPositionOnRouteOptions<P>` | Options for `interpolateGeoPositionOnRoute`                                                        |
| `GeoRoutePosition<P>`                     | The value of `interpolateGeoPositionOnRoute` (`{ point, heading }`)                                |
| `InterpolatePolylineMorphOptions<P>`      | Options for `interpolatePolylineMorph`                                                             |
| `InterpolateGeoPolylineMorphOptions<P>`   | Options for `interpolateGeoPolylineMorph`                                                          |
| `PolylineMorphPointContext<P>`            | The information passed to `createPoint` of the morph functions                                     |
| `CreateArcOptions<P>`                     | Options for `createArc`                                                                            |
| `CreateGeoArcOptions<P>`                  | Options for `createGeoArc`                                                                         |
| `InterpolatePolygonOptions<P>`            | Options for `interpolatePolygon`                                                                   |
| `InterpolateGeoPolygonOptions<P>`         | Options for `interpolateGeoPolygon`                                                                |
| `InterpolateMultiPolygonOptions<P>`       | Options for `interpolateMultiPolygon`                                                              |
| `InterpolateGeoMultiPolygonOptions<P>`    | Options for `interpolateGeoMultiPolygon`                                                           |
| `GeoCamera<P>`                            | A map camera (`{ center, zoom, heading?, tilt? }`)                                                 |
| `CameraPointContext<P>`                   | The information passed to `createPoint` of `interpolateGeoCamera`                                  |
| `InterpolateGeoCameraOptions<P>`          | Options for `interpolateGeoCamera`                                                                 |
| `GeoCameraInterpolator<P>`                | The function returned by `interpolateGeoCamera` (has `duration`)                                   |
| `Interpolator<T>`                         | A function that returns a value for `t`: `(t: number) => T`                                        |
| `Easing`                                  | An easing function: `(t: number) => number`                                                        |
| `ChainInterpolatorsOptions`               | Options for `chainInterpolators`                                                                   |
| `ChainedValue<I>`                         | The value type of `chainInterpolators` (a union of each interpolator's return type)                |
| `StaggerInterpolatorsOptions`             | Options for `staggerInterpolators`                                                                 |
| `StaggeredValues<I>`                      | The value type of `staggerInterpolators` (a tuple of each interpolator's return type)              |
| `RepeatDirection`                         | The direction of each repetition                                                                   |
| `RepeatInterpolatorOptions`               | Options for `repeatInterpolator`                                                                   |
