import * as React from "react";

export type SpriteIconName =
  | "drop"
  | "grid"
  | "doc"
  | "box"
  | "wallet"
  | "trend"
  | "sales"
  | "report"
  | "calendar"
  | "lock"
  | "clock"
  | "exit"
  | "menu"
  | "warehouse"
  | "bag"
  | "people"
  | "truck"
  | "cart"
  | "undo"
  | "receipt"
  | "layers"
  | "percent"
  | "database"
  | "settings"
  | "alert"
  | "chevron";

export function SvgIcon({
  name,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { name: SpriteIconName }) {
  return (
    <svg aria-hidden="true" className={className} {...props}>
      <use href={`#${name}`} />
    </svg>
  );
}

/**
 * Sprite SVG asli dari prototipe lama:
 * - templates/icons.html
 * - templates/workspace-icons.html
 */
export function SvgSprites() {
  return (
    <>
      <svg className="symbols" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <symbol id="drop" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              stroke="none"
              d="M12 1C10 6 4 11 4 15a8 8 0 0016 0c0-4-6-10-8-14Zm4 13c1 4-2 6-5 6 2-1 4-3 5-6Z"
            />
          </symbol>
          <symbol id="grid" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </symbol>
          <symbol id="doc" viewBox="0 0 24 24">
            <path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8m-8 4h6" />
          </symbol>
          <symbol id="box" viewBox="0 0 24 24">
            <path d="m3 7 9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5m-9 5v10m-5-17 9 5" />
          </symbol>
          <symbol id="wallet" viewBox="0 0 24 24">
            <rect x="3" y="6" width="18" height="15" rx="3" />
            <path d="m4 6 13-4 1 4m3 6h-6v4h6" />
          </symbol>
          <symbol id="trend" viewBox="0 0 24 24">
            <path d="M3 17l6-6 4 3 8-9m-7 0h7v7" />
          </symbol>
          <symbol id="sales" viewBox="0 0 24 24">
            <path d="M3 21h18M6 18v-6m6 6V7m6 11V3" />
          </symbol>
          <symbol id="report" viewBox="0 0 24 24">
            <path d="M4 3h16v18H4zM8 16v-4m4 4V8m4 8v-6" />
          </symbol>
          <symbol id="calendar" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 2v6m10-6v6M3 11h18" />
          </symbol>
          <symbol id="lock" viewBox="0 0 24 24">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 018 0v3" />
          </symbol>
          <symbol id="clock" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v7l4 2" />
          </symbol>
          <symbol id="exit" viewBox="0 0 24 24">
            <path d="M9 3H4v18h5m4-14 5 5-5 5m-5-5h11" />
          </symbol>
          <symbol id="menu" viewBox="0 0 24 24">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </symbol>
          <symbol id="warehouse" viewBox="0 0 24 24">
            <path d="m3 9 9-6 9 6v12H3zm4 12v-9h10v9m-10-6h10m-10 3h10" />
          </symbol>
          <symbol id="bag" viewBox="0 0 24 24">
            <path d="M4 8h16l1 13H3zm4 0V6a4 4 0 0 1 8 0v2" />
          </symbol>
          <symbol id="people" viewBox="0 0 24 24">
            <circle cx="9" cy="8" r="3.4" />
            <path d="M2 20v-2a6.8 6.8 0 0 1 13.6 0v2m0-15a3.3 3.3 0 0 1 0 6.4m2 3a5 5 0 0 1 4 5" />
          </symbol>
          <symbol id="truck" viewBox="0 0 24 24">
            <path d="M2 5h13v12H2zm13 4h4l3 4v4h-7" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="18" cy="18" r="2" />
          </symbol>
          <symbol id="cart" viewBox="0 0 24 24">
            <path d="M2 3h3l3 12h11l3-9H6" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </symbol>
          <symbol id="undo" viewBox="0 0 24 24">
            <path d="m8 4-5 5 5 5m-4-5h10a6 6 0 0 1 0 12h-3" />
          </symbol>
          <symbol id="receipt" viewBox="0 0 24 24">
            <path d="M5 3l2 1 2-1 3 1 3-1 2 1 2-1v18l-3-1-4 1-4-1-3 1zm3 5h8m-8 4h8m-8 4h5" />
          </symbol>
          <symbol id="layers" viewBox="0 0 24 24">
            <path d="m2 8 10-5 10 5-10 5zm1 5 9 5 9-5m-18 5 9 5 9-5" />
          </symbol>
          <symbol id="percent" viewBox="0 0 24 24">
            <path d="m5 20 14-16" />
            <circle cx="7" cy="7" r="3" />
            <circle cx="17" cy="17" r="3" />
          </symbol>
          <symbol id="database" viewBox="0 0 24 24">
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" />
          </symbol>
          <symbol id="settings" viewBox="0 0 24 24">
            <path d="M3 6h7m4 0h7M3 12h12m4 0h2M3 18h3m4 0h11" />
            <circle cx="12" cy="6" r="2" />
            <circle cx="17" cy="12" r="2" />
            <circle cx="8" cy="18" r="2" />
          </symbol>
          <symbol id="alert" viewBox="0 0 24 24">
            <path d="m12 3 10 17H2zM12 9v5m0 3v.1" />
          </symbol>
          <symbol id="chevron" viewBox="0 0 24 24">
            <path d="m9 5 7 7-7 7" />
          </symbol>
        </defs>
      </svg>
    </>
  );
}
