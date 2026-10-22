import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { usePageMeta } from "@/src/hooks/usePageMeta";
import { imgSrc } from "@/src/lib/imgSrc";
import data from "@/src/data/ai-tools.json";

type Project = {
  id: string;
  title: string;
  author: string;
  country: string;
  image: string | null;
  category: string | null;
  rank: number | null;
  recognition: string | null;
  tools_raw: string;
  tools: string[];
};

const PROJECTS = data.projects as Project[];

// Tool → canonical website domain (used for favicon fetch via Google s2).
// If a tool isn't here, we fall back to a text-only chip.
const TOOL_DOMAIN: Record<string, string> = {
  "ChatGPT": "chatgpt.com",
  "Midjourney": "midjourney.com",
  "Nano Banana": "gemini.google.com",
  "Google Gemini": "gemini.google.com",
  "Claude": "claude.ai",
  "Codex": "openai.com",
  "ComfyUI": "comfy.org",
  "Stable Diffusion": "stability.ai",
  "Adobe Photoshop": "adobe.com",
  "Rhino": "rhino3d.com",
  "Grasshopper": "rhino3d.com",
  "Kling AI": "klingai.com",
  "D5 Render": "d5render.com",
  "Revit": "autodesk.com",
  "Runway": "runwayml.com",
  "DeepSeek": "deepseek.com",
  "CapCut": "capcut.com",
  "Adobe Firefly": "adobe.com",
  "DALL·E": "openai.com",
  "Flux": "bfl.ai",
  "Magnific": "magnific.ai",
  "Google Veo": "gemini.google.com",
  "Suno": "suno.com",
  "Luma": "lumalabs.ai",
  "Gendo AI": "gendo.ai",
  "MiniMax": "minimax.chat",
};

function toolIconUrl(tool: string): string | null {
  const d = TOOL_DOMAIN[tool];
  if (!d) return null;
  return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
}

function medalFor(rank: number | null) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  if (rank) return "🏆";
  return "🏅";
}

export default function AiTools() {
  usePageMeta({
    title: "AI Tools used by 2026 Winners",
    description:
      "Which AI tools powered the AI Architecture Awards 2026 winning projects — click a tool to see every winner that used it.",
    canonicalPath: "/aitools",
  });

  const [selected, setSelected] = useState<string | null>(null);

  const toolCounts = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of PROJECTS) {
      for (const t of p.tools) {
        if (!map.has(t)) map.set(t, []);
        map.get(t)!.push(p);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, []);

  const selectedProjects = useMemo(() => {
    if (!selected) return [];
    return toolCounts.find(([t]) => t === selected)?.[1] ?? [];
  }, [selected, toolCounts]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-28 pb-10 sm:px-6 lg:px-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-400">
          AI Architecture Awards 2026
        </span>
        <h1 className="mt-4 text-5xl font-bold uppercase tracking-tighter sm:text-7xl md:text-8xl leading-[0.9]">
          AI Tools
        </h1>
        <p className="mt-6 text-base md:text-lg text-black/60 leading-relaxed max-w-xl">
          The platforms, models and workflows behind the 2026 winning projects.
          Click any tool to see which winners used it.
        </p>
      </div>

      {/* Tools grid */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {toolCounts.map(([tool, projects]) => {
            const active = tool === selected;
            return (
              <button
                key={tool}
                onClick={() => setSelected(active ? null : tool)}
                className={
                  "group inline-flex items-center gap-2 border pl-2 pr-3 py-2 font-mono text-xs transition-all " +
                  (active
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/20 hover:border-black")
                }
              >
                {toolIconUrl(tool) ? (
                  <img
                    src={toolIconUrl(tool)!}
                    alt=""
                    aria-hidden
                    className={"h-4 w-4 object-contain " + (active ? "bg-white rounded-sm p-[1px]" : "")}
                    loading="lazy"
                  />
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center text-[10px] font-bold border border-current rounded-sm">
                    {tool[0]}
                  </span>
                )}
                <span className="uppercase tracking-wider font-bold">{tool}</span>
                <span
                  className={
                    "px-1.5 py-0.5 text-[10px] font-bold " +
                    (active ? "bg-white text-black" : "bg-black/5 text-black/60 group-hover:bg-black/10")
                  }
                >
                  {projects.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected tool → projects */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8"
          >
            <div className="border-t border-black pt-10">
              <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-black/40 mb-3">
                    Winners that used
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-bold uppercase tracking-tighter leading-[0.9]">
                    {selected}
                  </h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-2 border border-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {selectedProjects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/project/${p.id}`}
                    className="group block"
                  >
                    <div className="relative block aspect-[4/5] overflow-hidden border border-black bg-gray-50">
                      {p.image && (
                        <img
                          src={imgSrc(p.image, "card")}
                          alt={p.title}
                          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                        {p.rank && (
                          <div className="bg-yellow-400 text-black px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                            {medalFor(p.rank)} #{p.rank}
                          </div>
                        )}
                        {p.recognition && (
                          <div className="bg-blue-600 text-white px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest">
                            🏅 {p.recognition}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-1">
                        {p.category}
                      </div>
                      <h3 className="text-lg font-bold uppercase tracking-tight leading-tight">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-black">{p.author}</p>
                      <p className="text-[11px] text-black/50">{p.country}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.tools.map((t) => (
                          <span
                            key={t}
                            className={
                              "px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider " +
                              (t === selected
                                ? "bg-black text-white"
                                : "bg-black/5 text-black/60")
                            }
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selected && (
        <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
          <div className="border-t border-black/10 pt-10 text-xs font-mono uppercase tracking-wider text-black/40">
            Click a tool above to see winning projects that used it.
          </div>
        </div>
      )}
    </div>
  );
}
