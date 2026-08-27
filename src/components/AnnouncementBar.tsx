import { useState } from "react";
import { X } from "lucide-react";

const MESSAGE = (
  <>
    <span className="font-bold tracking-widest">LATE ENTRY OPEN</span>
    <span className="mx-3 opacity-60">//</span>
    <span>Don't miss your chance — deadline</span>
    <span className="mx-1.5 font-semibold">Sept 15</span>
    <span className="mx-3 opacity-60">//</span>
    <span>Use code</span>
    <span className="mx-1.5 rounded-sm bg-white px-2 py-0.5 font-mono font-bold text-black">AIAWARD20</span>
    <span>for 20% off</span>
    <span className="mx-3 opacity-60">//</span>
    <span>Submit now at</span>
    <span className="ml-1.5 underline">aiarchitectureawards.com/submit</span>
    <span className="mx-6 opacity-40">✦</span>
  </>
);

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="relative w-full overflow-hidden bg-black text-white text-xs">
      <div className="flex whitespace-nowrap animate-marquee py-2">
        <div className="flex shrink-0 items-center px-4">{MESSAGE}</div>
        <div className="flex shrink-0 items-center px-4" aria-hidden="true">{MESSAGE}</div>
        <div className="flex shrink-0 items-center px-4" aria-hidden="true">{MESSAGE}</div>
        <div className="flex shrink-0 items-center px-4" aria-hidden="true">{MESSAGE}</div>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
