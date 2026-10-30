import { statusColor } from "@/lib/admin";

export default function Badge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[status] ?? "bg-sand"}`}>{status}</span>;
}
