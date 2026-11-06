import { memo, useMemo } from 'react';
import { polygonContains } from 'd3';
import type { CSSProperties } from 'react';
import type { makePath } from '../geography/projection';
import { labelGeometry, type PlacedLabel } from '../geography/labels';
import { WATER_LABELS } from '../geography/maritime';
import type { MapView } from '../navigation/view';

interface Props { view: MapView; path: ReturnType<typeof makePath>; width: number; height: number; scale: number; administrativeLabels: PlacedLabel[] }

export const MaritimeLayer = memo(function MaritimeLayer({ view, path, width, height, scale, administrativeLabels }: Props) {
  const national = view.route.level === 'national';
  const labels = useMemo(() => {
    if (view.route.level === 'municity') return [];
    const land = view.collection.features.flatMap(feature => labelGeometry(feature, path)?.polygons ?? []);
    const pixelsPerDegree = Math.abs(path.centroid({ type: 'Point', coordinates: [122, 12] })[0] - path.centroid({ type: 'Point', coordinates: [121, 12] })[0]) * scale;
    const boxes = administrativeLabels.map(label => ({ x: label.anchor[0] * scale + label.dx - label.width / 2 - 4, y: label.anchor[1] * scale + label.dy - label.height / 2 - 4, w: label.width + 8, h: label.height + 8 }));
    return WATER_LABELS.flatMap(label => {
      if (label.kind === 'local' && pixelsPerDegree < label.minScale) return [];
      const anchor = path.centroid({ type: 'Point', coordinates: label.anchor });
      const size = (label.kind === 'ocean' ? 12 : label.kind === 'local' ? 10 : 11) * (width < 600 ? 0.9 : 1);
      const lines = width < 600 && ['sulu', 'celebes'].includes(label.id) ? label.name.split(' ') : label.lines;
      const w = Math.max(...lines.map(line => line.length)) * size * 0.66 + 16;
      const h = lines.length * size * 1.35 + 12;
      // Fixed view fitting is checked before pan/zoom. SVG naturally clips the
      // moving context layer; it never pins sea names to screen coordinates.
      if (anchor[0] < 0 || anchor[0] > width || anchor[1] < 0 || anchor[1] > height) return [];
      const box = { x: anchor[0] * scale - w / 2, y: anchor[1] * scale - h / 2, w, h };
      if (boxes.some(other => box.x < other.x + other.w && box.x + w > other.x && box.y < other.y + other.h && box.y + h > other.y)) return [];
      const inside = (x: number, y: number) => land.some(([outer, ...holes]) => polygonContains(outer, [x, y]) && !holes.some(hole => polygonContains(hole, [x, y])));
      // Sample label footprint plus land vertices, so text stays in water.
      for (const fy of [0, 0.25, 0.5, 0.75, 1]) for (const fx of [0, 0.25, 0.5, 0.75, 1]) {
        if (inside((box.x + w * fx) / scale, (box.y + h * fy) / scale)) return [];
      }
      if (land.some(([outer]) => outer.some(([x, y]) => x * scale > box.x && x * scale < box.x + w && y * scale > box.y && y * scale < box.y + h))) return [];
      boxes.push(box);
      return [{ ...label, lines, anchor, size }];
    });
  }, [view, path, width, height, scale, administrativeLabels]);
  return <g data-maritime-layer="" className="pointer-events-none" aria-label="Maritime geographic context">
    <g data-water-labels="" opacity={national ? 1 : 0.7}>
      {labels.map(label => <g key={label.id} transform={`translate(${label.anchor[0]},${label.anchor[1]})`}>
        <text data-water-label={label.id} aria-label={label.name} textAnchor="middle" dominantBaseline="central" className={`map-water-label map-water-label-${label.kind}`}
          style={{ '--water-label-size': `${label.size}px` } as CSSProperties}>
          <title>{label.name} · NAMRIA / PAGASA geographic reference</title>
          {label.lines.map((line, i) => <tspan key={line} x="0" dy={i ? '1.35em' : `${-(label.lines.length - 1) * 0.675}em`}>{line}</tspan>)}
        </text>
      </g>)}
    </g>
  </g>;
});
