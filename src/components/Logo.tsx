import Image from "next/image";
import { clsx } from "clsx";
import { Link } from "react-router-dom";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/templates"
      className="inline-flex items-center hover:opacity-90 transition-opacity"
      title="Go to Templates"
    >
      <Image
        src="/previewmail_logo.png"
        alt="PreviewMail Logo"
        width={150}
        height={40}
        priority
        style={{ width: "auto" }}
        className={clsx("h-9 w-auto object-contain", className)}
      />
    </Link>
  );
}
