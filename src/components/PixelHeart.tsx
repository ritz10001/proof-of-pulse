"use client";

interface PixelHeartProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function PixelHeart({ size = 64, color = "#e84393", className = "" }: PixelHeartProps) {
  const px = size / 13;

  // Classic pixel heart grid (13x12)
  const rows = [
    [0,0,1,1,0,0,0,1,1,0,0,0,0],
    [0,1,1,1,1,0,1,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0,0],
  ];

  return (
    <svg
      width={size}
      height={(rows.length / 13) * size}
      viewBox={`0 0 ${13 * px} ${rows.length * px}`}
      className={className}
      aria-hidden="true"
    >
      {rows.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}
