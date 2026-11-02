import React from "react";

/* Small line icons used across the Overview. */
const ICONS = {
  stock: "M12 3 2 8l10 5 10-5-10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  processing:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  extract: "M14 4c3 0 5.5 1.5 7 4M14 4C11 4 7 6 4 9M14 4l-2 2M11 7 3 21",
  permit: "M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6",
  trip: "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  payment: "M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-2 5-6 5H7l8 7",
  active: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  ship: "M3 16l2 5h14l2-5H3Zm2 0V9h14v7M12 9V3M9 6h6",
  scale: "M4 20h16M6 20V11h12v9M12 11V5M8 5h8M9 15h6",
  alert: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  machine: "M3 17h11V9H8L5 13H3v4Zm11-5h3l3 3v2h-6M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 9V5h4",
  lease: "M5 3h10l4 4v14H5V3Zm4 9h6M9 16h6M9 8h3",
  block: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  location: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7",
  dump: "M3 20h18L15 8l-3 5-2-3-7 10Z",
};

export function Icon({ name, size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Label / value rows with a small marker, used in cards and pop-ups. */
export function BreakdownList({ items, note }) {
  return (
    <>
      {note && <div className="overview-card-note">{note}</div>}
      <ul className="overview-card-list">
        {items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Yesterday (T-1) in IST as a Date, and as "27-Oct-2026". */
export function getYesterday() {
  const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return { date, label: `${get("day")}-${get("month").slice(0, 3)}-${get("year")}` };
}
