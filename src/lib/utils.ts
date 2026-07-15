import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTeamName(color: string) {
  switch (color) {
    case 'red': return 'Mustang';
    case 'yellow': return 'Griffin';
    case 'green': return 'Mamba';
    case 'blue': return 'Kraken';
    default: return color || 'Unknown';
  }
}

export function getTeamLogo(color: string) {
  switch (color) {
    case 'red': return 'https://i.imgur.com/VXpn582_d.webp?maxwidth=760&fidelity=grand';
    case 'yellow': return 'https://i.imgur.com/dekqg6u_d.webp?maxwidth=760&fidelity=grand';
    case 'green': return 'https://i.imgur.com/yOtY4b4_d.webp?maxwidth=760&fidelity=grand';
    case 'blue': return 'https://i.imgur.com/3yL179L_d.webp?maxwidth=760&fidelity=grand';
    default: return '';
  }
}
