import React from 'react';
import { Camera, Coins, Home } from 'lucide-react';

export const getIcon = (name: string, size: number = 24) => {
  const icons: Record<string, React.ReactNode> = {
    home: <Home size={size} />,
    camera: <Camera size={size} />,
    coins: <Coins size={size} />
  };
  return icons[name] || null;
};

export function NavIcon({ name, size }: { name: string; size?: number }) {
  return <>{getIcon(name, size)}</>;
}
