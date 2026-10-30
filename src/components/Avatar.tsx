/* eslint-disable @next/next/no-img-element */
export default function Avatar({ url, name, size = 40 }: { url?: string | null; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" title="Open full photo" className="shrink-0">
        <img src={url} alt={name} style={style} className="rounded-full border border-sand object-cover" />
      </a>
    );
  }
  return (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-full bg-sand font-medium text-ink/60" title="No photo yet">
      {initials || "?"}
    </span>
  );
}
