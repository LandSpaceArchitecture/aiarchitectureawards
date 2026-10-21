import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { PARTNERS } from "@/src/constants";
import { usePageMeta } from "@/src/hooks/usePageMeta";
import { imgSrc } from "@/src/lib/imgSrc";
import data from "@/src/data/winners.json";

type Entry = {
  id: string;
  project_title: string;
  author_name: string;
  country: string;
  category: string[];
  image_urls: string[];
  ai_tools: string | null;
  rank: number | null;
  category_label: string | null;
};

const WINNERS = data.winners as Entry[];
const CATEGORY_ONLY = data.categoryOnly as Entry[];
const REST = data.rest as Entry[];

function Card({ s, idx }: { s: Entry; idx: number }) {
  const medal =
    s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : s.rank ? "🏆" : "";
  return (
    <motion.div
      key={s.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(idx, 10) * 0.03 }}
      className="flex flex-col group"
    >
      <Link
        to={`/project/${s.id}`}
        className="relative block aspect-[4/5] overflow-hidden border border-black bg-gray-50"
      >
        <img
          src={imgSrc(s.image_urls?.[0], "card")}
          alt={s.project_title}
          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          {s.rank && (
            <div className="bg-yellow-400 text-black px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
              {medal} #{s.rank}
            </div>
          )}
          {s.category_label && (
            <div className="bg-blue-600 text-white px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest">
              🏅 {s.category_label}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-1">
            {s.category[0]}
          </div>
          <h3 className="text-lg font-bold uppercase tracking-tight leading-tight line-clamp-2">
            {s.project_title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-black line-clamp-1">{s.author_name}</p>
          <p className="text-[11px] text-black/50 line-clamp-1">{s.country}</p>
          {s.ai_tools && (
            <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-black/40 line-clamp-2">
              <span className="text-black/30">AI · </span>
              {s.ai_tools}
            </p>
          )}
        </div>
      </div>

      <Link
        to={`/project/${s.id}`}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-black/60 hover:text-black transition-colors"
      >
        <span>View Project</span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, count }: { eyebrow: string; title: string; count: number }) {
  return (
    <div className="border-t border-black pt-10 mb-12 flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-black/40 mb-3">
          {eyebrow}
        </div>
        <h2 className="text-5xl sm:text-7xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.9]">
          {title}
        </h2>
      </div>
      <div className="font-mono text-xs text-black/40">
        {count} {count === 1 ? "project" : "projects"}
      </div>
    </div>
  );
}

export default function Winners() {
  usePageMeta({
    title: "2026 Winners",
    description:
      "AI Architecture Awards 2026 — overall winners, category recognitions, and the full shortlist of jury-selected finalists.",
    canonicalPath: "/winner",
  });

  return (
    <div className="bg-white min-h-screen">
      {/* AI Partners banner */}
      <section className="border-b border-black/10 bg-white pt-24 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mb-10 md:mb-12 items-end">
            <div className="lg:col-span-7">
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-3">
                Official AI Partners
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-[0.9]">
                AI <span className="text-black/20">Partners</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pl-12">
              <p className="text-sm md:text-base text-black/60 leading-relaxed">
                Winners of the 2026 AI Architecture Awards receive{" "}
                <strong className="text-black">Pro licenses or Premium subscriptions</strong> from
                our official AI platform partners — exclusive access to the tools reshaping the
                discipline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-black/10 border border-black/10">
            {PARTNERS.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white px-8 py-14 md:px-12 md:py-20 flex items-center justify-center min-h-[280px] transition-all hover:bg-black/[0.02] relative overflow-hidden"
              >
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="max-h-20 md:max-h-24 w-auto max-w-[80%] object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">
                    Visit {partner.name} →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-400">
            AI Architecture Awards 2026
          </span>
          <h1 className="mt-4 text-6xl font-bold uppercase tracking-tighter sm:text-8xl md:text-9xl leading-[0.9]">
            Winners
          </h1>
          <p className="mt-6 text-base md:text-lg text-black/60 leading-relaxed max-w-xl">
            The 2026 cycle celebrates its overall winners, category recognitions, and the full
            shortlist of jury-selected finalists — representing a wide range of practices and
            perspectives in AI-assisted design from around the world.
          </p>
        </div>
      </div>

      {/* Sectioned grid */}
      <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8 space-y-24">
        {WINNERS.length > 0 && (
          <section>
            <SectionTitle eyebrow="2026 · Overall Ranking" title="Winners" count={WINNERS.length} />
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {WINNERS.map((s, idx) => (
                <Card key={s.id} s={s} idx={idx} />
              ))}
            </div>
          </section>
        )}

        {CATEGORY_ONLY.length > 0 && (
          <section>
            <SectionTitle
              eyebrow="2026 · Jury Pick per Discipline"
              title="Category Recognition"
              count={CATEGORY_ONLY.length}
            />
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORY_ONLY.map((s, idx) => (
                <Card key={s.id} s={s} idx={idx} />
              ))}
            </div>
          </section>
        )}

        {REST.length > 0 && (
          <section>
            <SectionTitle
              eyebrow="2026 · All Jury-Selected Finalists"
              title="Shortlist"
              count={REST.length}
            />
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {REST.map((s, idx) => (
                <Card key={s.id} s={s} idx={idx} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
