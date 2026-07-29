"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  className,
  pendingLabel,
  children,
}: {
  className?: string;
  pendingLabel?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel || "Menyimpan..." : children}
    </button>
  );
}
