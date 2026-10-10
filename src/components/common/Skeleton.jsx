import { cn } from "@/lib/cn";
export default function Skeleton({ className }) {
  return <div aria-hidden className={cn("animate-pulse rounded-2xl bg-ink/10", className)} />;
}
