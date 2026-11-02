import type { SVGProps } from "react";

const paths = {
  arrowUpRight: "M7 17 17 7M8 7h9v9",
  close: "M6 6l12 12M18 6 6 18",
  info: "M12 16v-5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  permit: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  truck: "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  scale: "M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0ZM19 7l-3 7a3 3 0 0 0 6 0ZM8 21h8",
  layers: "M12 3 2 8l10 5 10-5zM2 13l10 5 10-5",
  rupee: "M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-2 5-6 5H7l8 7",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  collapse: "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3",
  cards: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  table: "M3 5h18M3 12h18M3 19h18",
  check: "M5 12l5 5L20 7",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDown: "M12 5v14M5 12l7 7 7-7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  sort: "M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4",
  menu: "M4 6h16M4 12h16M4 18h16",
  wallet: "M3 7h15a3 3 0 0 1 3 3v8H3zM3 7l3-3h11v3M16 13h2",
  report: "M6 3h9l4 4v14H6zM9 12h6M9 16h6M9 8h3",
  database: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3ZM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  pickaxe: "M14 4c3 0 5.5 1.5 7 4M14 4C11 4 7 6 4 9M14 4l-2 2M11 7 3 21",
  gavel: "M14 4l6 6M11 7l6 6M8 10l6-6M10 12 3 19M4 21h9",
  landmark: "M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7z",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z M9 12l2 2 4-4",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2",
  download: "M12 4v12M6 10l6 6 6-6M4 20h16",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

/** Decorative stroke icon. Hidden from assistive tech; give the parent an accessible name. */
export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
