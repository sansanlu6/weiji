import React from 'react';

interface ToiletIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const ToiletIcon: React.FC<ToiletIconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.8,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 3h3c1 0 1.5 0.5 1.5 1.5v6c0 1-0.5 1.5-1.5 1.5H7c-1 0-1.5-0.5-1.5-1.5v-6C5.5 3.5 6 3 7 3z" />
    <path d="M5.5 12h13c0.8 0 1.5 0.7 1.5 1.5v0.5c-0.3 3.5-2 6-6 6h-4c-4 0-5.7-2.5-6-6v-0.5C4 12.7 4.7 12 5.5 12z" />
  </svg>
);

export default ToiletIcon;
