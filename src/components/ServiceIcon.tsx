import {
  Palette,
  Fingerprint,
  Monitor,
  Smartphone,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Palette,
  Fingerprint,
  Monitor,
  Smartphone,
  TrendingUp,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Palette;
  return <Icon className={className} aria-hidden="true" />;
}
