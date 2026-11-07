export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-md bg-pine-strong text-[0.8125rem] font-semibold text-white ${className}`}
    >
      W
    </span>
  );
}
