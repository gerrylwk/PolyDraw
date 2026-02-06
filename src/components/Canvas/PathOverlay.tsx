import React from 'react';
import { PathTestPoint, Shape } from '../../types';

interface PathOverlayProps {
  testPath: PathTestPoint[];
  shapes: Shape[];
  hoveredPointIndex: number | null;
}

const STATUS_FILL: Record<string, string> = {
  inside: '#10b981',
  outside: '#ef4444',
  edge: '#0ea5e9',
};

export const PathOverlay: React.FC<PathOverlayProps> = ({
  testPath,
  shapes,
  hoveredPointIndex,
}) => {
  const validPoints = testPath.filter(p => p.validFormat);
  if (validPoints.length === 0) return null;

  const pathData = validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const shapeMap = new Map(shapes.map(s => [s.id, s.name]));

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ transformOrigin: '0 0', overflow: 'visible' }}
    >
      <path
        d={pathData}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeDasharray="6,4"
        opacity="0.7"
        style={{ vectorEffect: 'non-scaling-stroke' }}
      />

      {validPoints.map((point, i) => {
        const isHovered = hoveredPointIndex === point.index;
        const fill = STATUS_FILL[point.status] || '#ef4444';
        const r = isHovered ? 5 : 3.5;

        return (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={r}
            fill={fill}
            stroke="white"
            strokeWidth="1.5"
            opacity={isHovered ? 1 : 0.9}
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
        );
      })}

      {hoveredPointIndex != null && (() => {
        const point = validPoints.find(p => p.index === hoveredPointIndex);
        if (!point) return null;
        const polyNames = point.containingPolygons
          .map(id => shapeMap.get(id) || id)
          .join(', ');
        return (
          <g>
            <rect
              x={point.x + 8}
              y={point.y + 8}
              width={Math.max(140, (polyNames.length * 5.5) + 50)}
              height={polyNames ? 36 : 22}
              rx="4"
              fill="rgba(0,0,0,0.85)"
            />
            <text
              x={point.x + 14}
              y={point.y + 22}
              fill="white"
              fontSize="10"
              fontFamily="monospace"
            >
              #{point.index + 1} ({Math.round(point.x)}, {Math.round(point.y)})
            </text>
            {polyNames && (
              <text
                x={point.x + 14}
                y={point.y + 34}
                fill="#a5f3fc"
                fontSize="9"
                fontFamily="monospace"
              >
                {polyNames}
              </text>
            )}
          </g>
        );
      })()}
    </svg>
  );
};
