type IconProps = {
  size?: number;
};

export function Mark({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.16" />
      <path
        d="M8 16.5V7.5h3.1c1.9 0 3.15 1.05 3.15 2.65 0 1.08-.62 1.95-1.62 2.28L15.7 16.5h-2.2l-2.55-3.7H10.1v3.7H8Zm2.1-5.25h.95c.82 0 1.32-.46 1.32-1.18S11.87 8.9 11.05 8.9H10.1v2.35Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SendIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12 20 4l-6.5 16-2.2-6.2L4 12Z" fill="currentColor" />
    </svg>
  );
}

export function StopIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}

export function CopyIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" fill="none" strokeWidth="1.6" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" fill="none" strokeWidth="1.6" />
    </svg>
  );
}

export function PinIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16.2 3.8 20.2 7.8c.4.4.4 1 0 1.4l-1.6 1.6-5.4-5.4 1.6-1.6c.4-.4 1-.4 1.4 0ZM12.5 6.1l5.4 5.4-6.7 6.7-.9.3-2.6 2.6-1.4-1.4 2.6-2.6.3-.9 6.7-6.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MoreIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="6" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="18" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function DownIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AttachIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 12.5 15 6a3.2 3.2 0 1 1 4.5 4.5l-8.2 8.2a4.6 4.6 0 0 1-6.5-6.5l7.4-7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
