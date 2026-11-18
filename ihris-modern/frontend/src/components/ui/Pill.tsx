import type { ReactNode } from "react";

type Tone = "ok" | "warn" | "danger" | "mute";

/** شارة حالة صغيرة بألوان النظام. */
export default function Pill({
  tone = "mute",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`pill p-${tone}`}>{children}</span>;
}
