'use client';

import React from 'react';

interface IshikawaProps {
  activeCategory?: string;
  onCategoryClick?: (category: string) => void;
}

const CATEGORIES = [
  { id: 'Matière', label: 'Matière', y: 100 },
  { id: 'Matériel', label: 'Matériel', y: 200 },
  { id: 'Méthode', label: 'Méthode', y: 300 },
  { id: 'Main d\'oeuvre', label: 'Main d\'œuvre', y: 100, right: true },
  { id: 'Milieu', label: 'Milieu', y: 200, right: true },
];

export function IshikawaDiagram({ activeCategory, onCategoryClick }: IshikawaProps) {
  const W = 700;
  const H = 400;
  const spineY = H / 2;
  const headX = W - 80;
  const tailX = 60;

  const leftBones = CATEGORIES.filter(c => !c.right);
  const rightBones = CATEGORIES.filter(c => c.right);

  const leftPositions = [
    { x: 160, angle: -40 },
    { x: 280, angle: -35 },
    { x: 400, angle: -40 },
  ];

  const rightPositions = [
    { x: 200, angle: 40 },
    { x: 320, angle: 35 },
  ];

  return (
    <svg
      className="ishikawa-svg"
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: W, fontFamily: 'Inter, sans-serif' }}
    >
      {/* Colonne vertébrale */}
      <line x1={tailX} y1={spineY} x2={headX} y2={spineY} className="ishikawa-spine" />

      {/* Tête du poisson (Effet) */}
      <polygon
        points={`${headX},${spineY - 30} ${W - 10},${spineY} ${headX},${spineY + 30}`}
        fill="#ef4444"
        opacity={0.9}
      />
      <text x={headX - 5} y={spineY - 40} textAnchor="middle" className="ishikawa-head" fill="#ef4444" fontSize="11">
        EFFET / ANOMALIE
      </text>

      {/* Arêtes du haut (gauche) */}
      {leftBones.map((cat, i) => {
        const pos = leftPositions[i];
        const boneStartX = pos.x;
        const boneLength = 100;
        const boneEndX = boneStartX + boneLength * Math.cos((pos.angle * Math.PI) / 180);
        const boneEndY = spineY + boneLength * Math.sin((pos.angle * Math.PI) / 180);
        const isActive = activeCategory === cat.id;

        return (
          <g
            key={cat.id}
            onClick={() => onCategoryClick?.(cat.id)}
            style={{ cursor: 'pointer' }}
          >
            <line
              x1={boneStartX}
              y1={spineY}
              x2={boneEndX}
              y2={boneEndY}
              className="ishikawa-bone"
              stroke={isActive ? '#60a5fa' : '#475569'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <rect
              x={boneEndX - 45}
              y={boneEndY - 28}
              width={90}
              height={22}
              rx={4}
              fill={isActive ? '#1e40af' : '#1e293b'}
              stroke={isActive ? '#60a5fa' : '#334155'}
              strokeWidth={1}
            />
            <text
              x={boneEndX}
              y={boneEndY - 13}
              textAnchor="middle"
              fontSize="11"
              fontWeight={isActive ? '700' : '500'}
              fill={isActive ? '#93c5fd' : '#94a3b8'}
            >
              {cat.label}
            </text>
          </g>
        );
      })}

      {/* Arêtes du bas (droite / main d'oeuvre + milieu) */}
      {rightBones.map((cat, i) => {
        const pos = rightPositions[i];
        const boneStartX = pos.x;
        const boneLength = 100;
        const boneEndX = boneStartX + boneLength * Math.cos((pos.angle * Math.PI) / 180);
        const boneEndY = spineY - boneLength * Math.sin((pos.angle * Math.PI) / 180);
        const isActive = activeCategory === cat.id;

        return (
          <g
            key={cat.id}
            onClick={() => onCategoryClick?.(cat.id)}
            style={{ cursor: 'pointer' }}
          >
            <line
              x1={boneStartX}
              y1={spineY}
              x2={boneEndX}
              y2={boneEndY}
              className="ishikawa-bone"
              stroke={isActive ? '#60a5fa' : '#475569'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <rect
              x={boneEndX - 45}
              y={boneEndY + 6}
              width={90}
              height={22}
              rx={4}
              fill={isActive ? '#1e40af' : '#1e293b'}
              stroke={isActive ? '#60a5fa' : '#334155'}
              strokeWidth={1}
            />
            <text
              x={boneEndX}
              y={boneEndY + 21}
              textAnchor="middle"
              fontSize="11"
              fontWeight={isActive ? '700' : '500'}
              fill={isActive ? '#93c5fd' : '#94a3b8'}
            >
              {cat.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
