import React from 'react';
import { Pill } from 'lucide-react';

interface MedicationIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const MedicationIcon: React.FC<MedicationIconProps> = ({ className, style }) => {
  return (
    <Pill
      className={className}
      style={style}
      strokeWidth={1.75}
    />
  );
};

export default MedicationIcon;
