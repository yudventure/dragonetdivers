// Ikon garis gaya Lucide (stroke 1.75, ujung membulat) — BRANDING.md §6.
function Icon({ children, className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...props}>
      {children}
    </svg>
  );
}

export function ChatIcon(props) {
  return (
    <Icon {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8.5 10.5c.5 2 2.5 4 4.5 4.5l1.3-1.3 2 .9v1.6c0 .4-.4.8-.8.8C10.6 17 7 13.4 7 8.8c0-.4.4-.8.8-.8h1.6l.9 2Z" />
    </Icon>
  );
}

export function ArrowIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

export function FishIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" />
      <path d="M18 12v.5" />
      <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" />
      <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" />
    </Icon>
  );
}

export function UsersIcon(props) {
  return (
    <Icon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

export function SunsetIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 10V2" />
      <path d="m4.93 10.93 1.41 1.41" />
      <path d="M2 18h2" />
      <path d="M20 18h2" />
      <path d="m19.07 10.93-1.41 1.41" />
      <path d="M22 22H2" />
      <path d="m16 6-4 4-4-4" />
      <path d="M16 18a4 4 0 0 0-8 0" />
    </Icon>
  );
}

// Motif garis ombak dari logo (brand/patterns/wave-divider.svg).
export function Wave({ className = "h-4 w-24" }) {
  return (
    <svg viewBox="0 0 96 16" fill="none" aria-hidden="true" className={className}>
      <path d="M3 9c5-5 10-5 15 0s10 5 15 0" stroke="var(--color-teal)" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 9c5-5 10-5 15 0s10 5 15 0" stroke="var(--color-lagoon)" strokeWidth="3" strokeLinecap="round" />
      <path d="M77 9c3-3.4 6.5-3.4 9.5 0s6 3.4 7.5 1.2" stroke="var(--color-teal)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
