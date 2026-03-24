export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="#8B85ED" />
      <g transform="translate(15, 30)">
        <rect width="70" height="45" rx="4" fill="#EFEEFC" />
        <path d="M 0 4 Q 0 0 4 0 L 66 0 Q 70 0 70 4 L 35 25 Z" fill="#E5E4F5" />
        <path d="M 0 45 L 25 25 M 70 45 L 45 25" stroke="#E1E0F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="35" cy="25" rx="14" ry="10" fill="#5851AC" />
        <circle cx="35" cy="25" r="5" fill="#ffffff" />
        <circle cx="35" cy="25" r="2.5" fill="#241E5C" />
      </g>
    </svg>
  );
}
