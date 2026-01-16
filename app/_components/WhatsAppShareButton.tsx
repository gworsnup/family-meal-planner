"use client";

type WhatsAppShareButtonProps = {
  label: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 3.5a7.5 7.5 0 0 0-6.48 11.27L4 21l6.4-1.63A7.5 7.5 0 1 0 12 3.5zm0-1.5a9 9 0 0 1 0 18c-1.69 0-3.3-.47-4.68-1.34L3 20l1.6-4.23A9 9 0 1 1 12 2zm4.63 12.82c-.2.57-1.13 1.1-1.57 1.15-.4.05-.9.08-1.46-.1-.34-.11-.78-.25-1.35-.49-2.36-1.02-3.9-3.4-4.02-3.56-.12-.16-.96-1.28-.96-2.45 0-1.17.6-1.74.82-1.97.2-.23.46-.28.61-.28h.44c.14 0 .34-.03.53.4.2.44.68 1.5.73 1.61.06.11.1.25.02.4-.07.16-.1.25-.2.39-.1.14-.22.32-.31.43-.1.11-.2.23-.08.45.12.22.56.92 1.2 1.49.82.73 1.5.96 1.72 1.06.22.1.35.08.48-.05.13-.13.56-.65.71-.87.15-.22.3-.19.5-.12.2.08 1.27.6 1.49.71.22.11.36.16.41.25.05.09.05.52-.15 1.09z" />
    </svg>
  );
}

export default function WhatsAppShareButton({
  label,
  className,
  onClick,
  disabled = false,
}: WhatsAppShareButtonProps) {
  const classes = [
    "inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1EBE5D] disabled:cursor-not-allowed disabled:opacity-60",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" onClick={onClick} className={classes} disabled={disabled}>
      <WhatsAppIcon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
