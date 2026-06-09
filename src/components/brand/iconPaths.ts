/**
 * getIconPaths — 导出矢量格式时，自定义图标对应的精确 SVG 路径串。
 * 从 App.tsx 抽出（原文照搬），供 svgMarkup 构建导出用的 <svg> 时内联。
 */
export function getIconPaths(iconName: string): string {
  switch (iconName) {
    case 'VintageCar':
      return `
        <!-- Clean horizontal chassis line -->
        <line x1="3" y1="17" x2="21" y2="17" />

        <!-- Classic vertical radiator grille (Now Front Left) -->
        <rect x="3" y="11" width="3" height="6" rx="0.5" />
        <line x1="4.5" y1="11" x2="4.5" y2="17" />

        <!-- Elegant headlight / vintage glass carriage lamp pointing forward Left -->
        <circle cx="2.5" cy="11.5" r="1.2" />
        <line x1="3.5" y1="12" x2="2.5" y2="12" />

        <!-- Sleek straight engine bonnet / hood line -->
        <path d="M6 12.5h6v4.5H6z" />

        <!-- High-society back-angled windshield -->
        <line x1="12" y1="12.5" x2="13.5" y2="8" />

        <!-- Steering column and tilted vintage steering wheel -->
        <line x1="13" y1="11" x2="14.5" y2="11.5" />
        <circle cx="13.8" cy="11.2" r="0.8" />

        <!-- Luxurious upright luxury carriage canopy (遮挡棚 / Carriage hood shelter on right) -->
        <!-- Rounded fabric frame top covering the rear bench -->
        <path d="M12.5 7.5c2.5-1 5.5-1 7 1v4" />
        <!-- Canopy structure ribs/tensioners radiating beautifully -->
        <line x1="19.5" y1="12.5" x2="15.5" y2="7" />
        <line x1="19.5" y1="12.5" x2="17.5" y2="6.8" />
        <line x1="19.5" y1="12.5" x2="19.5" y2="8.5" />

        <!-- Luxurious passenger compartment tub / high back seat panel -->
        <path d="M12.5 12.5h6.5v4.5h-6.5c-1 0-1.5-.5-1.5-1.5v-3" />

        <!-- Custom curved separate front and rear fenders / mudguards -->
        <!-- Front Fender: sweeps gracefully over the front wheel -->
        <path d="M10.5 17.5c0-3.5-1.5-4.5-4.5-4.5" />
        <!-- Rear Fender: sweeps elegantly behind the rear wheel -->
        <path d="M22 17.5c0-3.5-1.8-4.5-4.3-4.5" />

        <!-- Front Wheel (cx=8, cy=18.5, r=3.5) -->
        <circle cx="8" cy="18.5" r="3.5" />
        <circle cx="8" cy="18.5" r="0.7" />
        <line x1="8" y1="15" x2="8" y2="22" />
        <line x1="4.5" y1="18.5" x2="11.5" y2="18.5" />

        <!-- Rear Wheel (cx=18, cy=18.5, r=3.5) -->
        <circle cx="18" cy="18.5" r="3.5" />
        <circle cx="18" cy="18.5" r="0.7" />
        <line x1="18" y1="15" x2="18" y2="22" />
        <line x1="14.5" y1="18.5" x2="21.5" y2="18.5" />
      `;
    case 'Sparkles':
      return `
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
        <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
      `;
    case 'Crown':
      return `
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
        <path d="M5 20h14" />
      `;
    case 'Gem':
      return `
        <path d="M6 3h12l4 6-10 13L2 9z" />
        <path d="M11 3 8 9l4 13 4-13-3-6" />
        <path d="M2 9h20" />
      `;
    case 'Shield':
      return `
        <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8.24-2a1 1 0 0 1 .5 0l8.24 2A1 1 0 0 1 20 6v7z" />
      `;
    case 'Layers':
      return `
        <path d="m12 3-10 5 10 5 10-5-10-5z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      `;
    case 'Flame':
      return `
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      `;
    case 'Cpu':
      return `
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      `;
    case 'Database':
      return `
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      `;
    case 'Globe':
      return `
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      `;
    case 'Zap':
      return `
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      `;
    case 'Atom':
      return `
        <circle cx="12" cy="12" r="1" />
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <ellipse cx="12" cy="12" rx="3" ry="10" transform="rotate(45 12 12)" />
        <ellipse cx="12" cy="12" rx="3" ry="10" transform="rotate(-45 12 12)" />
      `;
    case 'Terminal':
      return `
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      `;
    case 'Hexagon':
      return `
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      `;
    case 'Compass':
      return `
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      `;
    case 'Infinity':
      return `
        <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z" />
      `;
    case 'Box':
      return `
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      `;
    case 'CircleDot':
      return `
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="1" />
      `;
    case 'Crosshair':
      return `
        <circle cx="12" cy="12" r="10" />
        <line x1="22" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
      `;
    case 'Coffee':
      return `
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      `;
    case 'ShoppingBag':
      return `
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      `;
    case 'Wine':
      return `
        <path d="M15 11A5 5 0 0 1 5 11V3h10Z" />
        <path d="M10 16v5" />
        <path d="M19 11c0 3.314-2.686 6-6 6M7 21h6" />
      `;
    case 'Package':
      return `
        <path d="M16.5 9.4 7.55 4.24a1.79 1.79 0 0 0-1.83 0L3.5 5.5a1.8 1.8 0 0 0-.91 1.56v6.88a1.8 1.8 0 0 0 .9 1.56L12 21.3a1.78 1.78 0 0 0 1.83 0l6.67-3.85a1.8 1.8 0 0 0 .91-1.56V9.4A1.8 1.8 0 0 0 21 7.82l-5.4-3.12" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      `;
    case 'Scissors':
      return `
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="9.8" y1="8.2" x2="20" y2="18" />
        <line x1="9.8" y1="15.8" x2="20" y2="6" />
      `;
    case 'Key':
      return `
        <circle cx="7.5" cy="16.5" r="4.5" />
        <path d="m21 3-6.75 6.75" />
        <path d="m11.5 12.5 1 1" />
        <path d="m16 8.5 2 2" />
      `;
    case 'Leaf':
      return `
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-.1 11.3A7 7 0 0 1 11 20z" />
        <path d="M19 2c-4 3.6-7 7.6-9 13" />
      `;
    case 'Sun':
      return `
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      `;
    case 'Moon':
      return `
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      `;
    case 'Sprout':
      return `
        <path d="M7 20h10" />
        <path d="M12 20V12" />
        <path d="M12 12a5 5 0 0 0-5-5H3" />
        <path d="M12 14a5 5 0 0 1 5-5h4" />
      `;
    case 'Wind':
      return `
        <path d="M12.8 19.6A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2M9.8 4.4A1.5 1.5 0 1 1 11 7H2" />
      `;
    case 'Heart':
      return `
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2a5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      `;
    case 'Star':
      return `
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      `;
    default:
      return `
        <path d="M-12 0 L12 0 M0 -12 L0 12 M-8 -8 L8 8 M-8 8 L8 -8" />
        <circle cx="0" cy="0" r="10" />
      `;
  }
}
