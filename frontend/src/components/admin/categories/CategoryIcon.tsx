'use client';

import React from 'react';
import {
  Wrench,
  Flame,
  Shield,
  Activity,
  Gauge,
  Layers,
  Disc,
  Zap,
  Settings,
  Package,
  Cpu,
  Sparkles,
  Cog,
  Battery,
  Radio,
  Compass,
  Crosshair,
  LucideIcon,
} from 'lucide-react';

export const POPULAR_CATEGORY_ICONS: Array<{ name: string; icon: LucideIcon; label: string }> = [
  { name: 'Wrench', icon: Wrench, label: 'Mechanical & Spares' },
  { name: 'Flame', icon: Flame, label: 'Exhaust & Performance' },
  { name: 'Shield', icon: Shield, label: 'Helmets & Protection' },
  { name: 'Disc', icon: Disc, label: 'Brakes & Discs' },
  { name: 'Zap', icon: Zap, label: 'Electrical & Ignition' },
  { name: 'Gauge', icon: Gauge, label: 'Meters & Gauges' },
  { name: 'Layers', icon: Layers, label: 'Body Decals & Wraps' },
  { name: 'Activity', icon: Activity, label: 'Engine & Transmission' },
  { name: 'Package', icon: Package, label: 'Accessories' },
  { name: 'Settings', icon: Settings, label: 'General Parts' },
  { name: 'Cpu', icon: Cpu, label: 'Sensors & ECU' },
  { name: 'Battery', icon: Battery, label: 'Batteries & Starters' },
  { name: 'Cog', icon: Cog, label: 'Gears & Sprockets' },
  { name: 'Sparkles', icon: Sparkles, label: 'Cleaning & Care' },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Flame,
  Shield,
  Activity,
  Gauge,
  Layers,
  Disc,
  Zap,
  Settings,
  Package,
  Cpu,
  Sparkles,
  Cog,
  Battery,
  Radio,
  Compass,
  Crosshair,
};

interface CategoryIconProps {
  name?: string;
  className?: string;
}

export function CategoryIcon({ name, className = 'w-4 h-4' }: CategoryIconProps) {
  const IconComponent = (name && ICON_MAP[name]) ? ICON_MAP[name] : Wrench;
  return <IconComponent className={className} />;
}
