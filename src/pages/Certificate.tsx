import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "@/src/hooks/usePageMeta";

type Winner = {
  slug: string;
  cert_id: string;
  project_id: string;
  project_title: string;
  author_name: string;
  country: string;
  rank?: number;
  category?: string;
};

const WINNERS: Winner[] = [
  { slug: "crystal-spiral",               cert_id: "AIAA-2026-01", project_id: "a068f4d1-4808-494f-97ac-932c605a1325", project_title: "CRYSTAL SPIRAL",                                                                                                 author_name: "FLASHFORWARD AGENCY",       country: "Italy",          rank: 1 },
  { slug: "beneath-the-still-water",      cert_id: "AIAA-2026-02", project_id: "9734620b-30f1-4422-a6dd-b8b1434f2d14", project_title: "beneath the still water",                                                                                       author_name: "Eunjin Choi",               country: "Korea, South",   rank: 2 },
  { slug: "the-house-that-never-existed", cert_id: "AIAA-2026-03", project_id: "879cc44c-1589-4d99-9d30-25195a610b53", project_title: "THE HOUSE THAT NEVER EXISTED",                                                                                  author_name: "Im Jiwon, Ryu Eunbee",      country: "Korea, South",   rank: 3 },
  { slug: "dancheong-refracted",          cert_id: "AIAA-2026-04", project_id: "37dabb17-9677-45bc-8ac6-1a5b9310bff8", project_title: "DANCHEONG, REFRACTED",                                                                                          author_name: "eunjeong kim",              country: "Korea, South",   rank: 4 },
  { slug: "multimodal-architecture",      cert_id: "AIAA-2026-05", project_id: "74af2043-1894-4523-9f93-a3eb86a5ea46", project_title: "Multimodal Architecture: Applications of Language in a Human-AI Collaborative Design Process",              author_name: "Devvratsingh",              country: "India",          rank: 5 },
  { slug: "the-landscape-remembers",      cert_id: "AIAA-2026-06", project_id: "f36cf930-1d1e-4742-a7a6-dc7a8c091365", project_title: "The Landscape Remembers",                                                                                      author_name: "gwon ye rim",               country: "Korea, South",   rank: 6 },
  { slug: "casa-patio",                   cert_id: "AIAA-2026-07", project_id: "706cb015-b9a1-420a-ac6b-251293253aa7", project_title: "CASA PATIO — A Contemporary Interpretation of Yucatecan Domestic Architecture",                              author_name: "EXPERIMENTARQ ARQUITECTOS", country: "Mexico",         rank: 7 },
  { slug: "the-last-voice",               cert_id: "AIAA-2026-08", project_id: "c8a4a6fe-810b-49f9-b112-549fe5c105fc", project_title: "THE LAST VOICE — Memorial for The Livonian Language",                                                          author_name: "JIHYEON YOON, YUMIN KIM",   country: "Korea, South",   rank: 8, category: "INTERIOR" },
  { slug: "canopia",                      cert_id: "AIAA-2026-09", project_id: "",                                     project_title: "CanopIA — Automatic detection and counting of urban trees by an AI agent connected to QGIS",                 author_name: "Loic Tcheugoue · Karol Mezafack · Jovis Nguefack", country: "Cameroon", rank: 9, category: "REAL ESTATE" },
  { slug: "voxel-terra",                  cert_id: "AIAA-2026-10", project_id: "d7e83e9e-98a0-4e31-958d-856a0abe9665", project_title: "Voxel Terra",                                                                                                   author_name: "Adithi Bhanu Prakash",      country: "Australia",      rank: 10, category: "ARCHITECTURE" },
  { slug: "aitopia",                      cert_id: "AIAA-2026-11", project_id: "18059aa5-097d-425c-b09b-93b78671d3e2", project_title: "AItopia: Digital Inhabitable Scape",                                                                           author_name: "Nomavek Studio",            country: "United Kingdom", category: "VISUALIZATION" },
  { slug: "odyssey-fruity-city",          cert_id: "AIAA-2026-12", project_id: "e68a34ac-ab55-4b6c-b147-0d5006390902", project_title: "Odyssey to Peter Cook's Fruity City",                                                                           author_name: "Yi Wang / Yione Studio",    country: "United States",  category: "ANIMATION" },
  { slug: "monster",                      cert_id: "AIAA-2026-13", project_id: "916693aa-2a4b-4e05-815a-c1dcf6fa4087", project_title: "MONSTER",                                                                                                       author_name: "Chen yiwei",                country: "China",          category: "URBAN" },
  { slug: "after-breath",                 cert_id: "AIAA-2026-14", project_id: "7d152afc-c30e-4126-a702-4e3b092ecee3", project_title: "AFTER BREATH",                                                                                                  author_name: "hyunbin / do",              country: "Korea, South",   category: "LANDSCAPE" },
  { slug: "city-scanner",                 cert_id: "AIAA-2026-15", project_id: "17cf7531-05c1-46b9-a108-a977f041c3e5", project_title: "City Scanner",                                                                                                  author_name: "Alejandro Quinto",          country: "Spain",          category: "DIAGRAM & MAPPING" },
];

const SITE_ORIGIN = "https://aiarchitectureawards.com";

function rankLabel(rank?: number) {
  if (!rank) return null;
  if (rank === 1) return "FIRST PLACE OVERALL";
  if (rank === 2) return "SECOND PLACE OVERALL";
  if (rank === 3) return "THIRD PLACE OVERALL";
  return `TOP TEN OVERALL · RANK ${rank}`;
}

export default function Certificate() {
  const { slug } = useParams();
  const winner = useMemo(() => WINNERS.find((w) => w.slug === slug), [slug]);

  usePageMeta({
    title: winner ? `${winner.author_name} — Winner Certificate` : "Certificate",
    description: winner ? `Official AI Architecture Awards 2026 recognition certificate for ${winner.project_title}.` : "AI Architecture Awards 2026 certificate.",
    canonicalPath: slug ? `/certificate/${slug}` : "/certificate",
  });

  if (!winner) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <h2 className="text-3xl font-bold uppercase tracking-tighter">Certificate not found</h2>
        <p className="mt-4 text-sm text-black/60">
          The slug <code className="font-mono text-black">{slug ?? "(none)"}</code> did not match any 2026 winner.
        </p>
        <Link to="/" className="mt-8 inline-block border border-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
          Return home
        </Link>
      </div>
    );
  }

  const rl = rankLabel(winner.rank);
  const verifyUrl = `${SITE_ORIGIN}/project/${winner.project_id || ""}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&margin=0`;

  return (
    <div className="bg-neutral-100 min-h-screen py-10 print:bg-white print:py-0">
      {/* No-print controls */}
      <div className="print:hidden mx-auto max-w-[1100px] px-6 mb-6 flex items-center justify-between">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/60 hover:text-black">
          ← Home
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.3em] text-white hover:bg-gray-800 transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Certificate — A4 landscape ≈ 1100 × 780 at ~96dpi */}
      <div
        className="mx-auto bg-white text-black relative overflow-hidden print:shadow-none shadow-[0_12px_48px_rgba(0,0,0,0.14)]"
        style={{ width: 1100, height: 780 }}
      >
        {/* ───────── Decorative layers ───────── */}
        {/* Grain / paper texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Faint hairline grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Watermark: giant AIAA logo on the right (very light) */}
        <img
          src="/aiaa-logo.png"
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            right: -140,
            top: 90,
            width: 900,
            opacity: 0.045,
            transform: "rotate(-6deg)",
          }}
        />

        {/* Watermark circle seal (bottom-left) */}
        <svg
          className="absolute pointer-events-none"
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{ left: -70, bottom: -70, opacity: 0.055 }}
          aria-hidden
        >
          <circle cx="160" cy="160" r="155" fill="none" stroke="#000" strokeWidth="2" />
          <circle cx="160" cy="160" r="135" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="160" cy="160" r="100" fill="none" stroke="#000" strokeWidth="1" />
          <text
            fontFamily="'JetBrains Mono', monospace"
            fontSize="11"
            fontWeight="700"
            letterSpacing="4"
            fill="#000"
          >
            <textPath href="#seal-path" startOffset="0">
              AI ARCHITECTURE AWARDS · 2026 · AI ARCHITECTURE AWARDS · 2026 ·
            </textPath>
          </text>
          <defs>
            <path id="seal-path" d="M 160 40 a 120 120 0 1 1 -0.1 0" fill="none" />
          </defs>
        </svg>

        {/* Double hairline frame */}
        <div className="absolute inset-6 border border-black pointer-events-none" />
        <div className="absolute inset-[34px] border border-black/20 pointer-events-none" />

        {/* Corner marks */}
        <CornerMarks />

        {/* ───────── Content ───────── */}
        <div className="relative" style={{ padding: "60px 70px 0", height: "100%" }}>
          {/* Top header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.5em] text-black/40 mb-3">
                CERTIFICATE OF RECOGNITION
              </div>
              <img
                src="/aiaa-logo.png"
                alt="AI Architecture Awards 2026"
                className="h-14 w-auto object-contain"
              />
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">
                CERT.ID
              </div>
              <div className="font-mono text-xs font-bold mt-1">{winner.cert_id}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mt-4">
                EDITION
              </div>
              <div className="font-mono text-xs font-bold mt-1">2026 · I</div>
            </div>
          </div>

          {/* Body */}
          <div className="mt-14 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-black/40">
              This certifies that
            </div>

            {/* Author name with flanking rules */}
            <div className="mt-7 flex items-center justify-center gap-6">
              <span className="h-px flex-shrink-0 bg-black/30" style={{ width: 60 }} />
              <h1
                className="font-bold uppercase tracking-tight leading-[0.95]"
                style={{ fontSize: winner.author_name.length > 30 ? 40 : 56 }}
              >
                {winner.author_name}
              </h1>
              <span className="h-px flex-shrink-0 bg-black/30" style={{ width: 60 }} />
            </div>

            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black/50">
              {winner.country}
            </div>

            <div className="mt-9 font-mono text-[10px] uppercase tracking-[0.5em] text-black/40">
              is hereby awarded
            </div>

            {/* Award block */}
            <div className="mt-5 space-y-2 inline-block">
              {rl && (
                <div className="text-2xl md:text-[26px] font-bold uppercase tracking-tight">
                  {rl}
                </div>
              )}
              {winner.category && (
                <div className="text-lg md:text-xl font-bold uppercase tracking-tight text-black/70">
                  {winner.category} · CATEGORY RECOGNITION
                </div>
              )}
            </div>

            <div className="mt-9 font-mono text-[10px] uppercase tracking-[0.5em] text-black/40">
              for the project
            </div>

            <div className="mt-4 text-lg md:text-xl italic font-medium leading-snug max-w-[800px] mx-auto">
              「 {winner.project_title} 」
            </div>
          </div>

          {/* Footer */}
          <div className="absolute left-0 right-0 bottom-0 px-[70px] pb-12">
            <div className="flex items-end justify-between gap-10">
              {/* Date */}
              <div className="flex-1">
                <div className="border-t border-black pt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/60">
                  Awarded
                </div>
                <div className="font-mono text-sm font-bold mt-1">October 22, 2026</div>
              </div>

              {/* Signature */}
              <div className="flex-1 text-center">
                <img
                  src="/signature-zixu.png"
                  alt="Zixu Qiao"
                  className="h-16 w-auto mx-auto mb-1 object-contain"
                  style={{ transform: "translateY(6px)" }}
                />
                <div className="border-t border-black pt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/60">
                  Zixu Qiao · Director
                </div>
                <div className="font-mono text-[9px] text-black/50 mt-0.5">AI Architecture Awards</div>
              </div>

              {/* QR */}
              <div className="flex-1 flex items-end justify-end gap-4">
                <div className="text-right">
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-black/40">
                    Verify at
                  </div>
                  <div className="font-mono text-[9px] text-black/60 mt-1 max-w-[150px] break-all">
                    {verifyUrl.replace(/^https?:\/\//, "")}
                  </div>
                </div>
                <img
                  src={qrSrc}
                  alt="Verify certificate"
                  width={72}
                  height={72}
                  className="border border-black/20"
                />
              </div>
            </div>

            {/* Partners strip */}
            <div className="mt-6 border-t border-black/10 pt-3 flex items-center justify-center gap-6 font-mono text-[9px] uppercase tracking-[0.4em] text-black/40">
              <span>Official Partners</span>
              <span className="h-px w-6 bg-black/20" />
              <span>SUAPP AI</span>
              <span>·</span>
              <span>D5 Render</span>
              <span>·</span>
              <span>Aino World</span>
            </div>
          </div>
        </div>
      </div>

      {/* Index of all winners */}
      <div className="print:hidden mx-auto max-w-[1100px] px-6 mt-10">
        <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-3">
          All 15 certificates
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {WINNERS.map((w) => (
            <Link
              key={w.slug}
              to={`/certificate/${w.slug}`}
              className={`border border-black/10 px-3 py-2 text-[11px] font-medium hover:bg-black hover:text-white transition-colors ${w.slug === slug ? "bg-black text-white" : ""}`}
            >
              <span className="font-mono text-[9px] text-black/40 mr-2">{w.cert_id}</span>
              {w.author_name}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 1100px 780px; margin: 0; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function CornerMarks() {
  const Mark = ({ className }: { className: string }) => (
    <svg width="18" height="18" viewBox="0 0 18 18" className={`absolute ${className}`} aria-hidden>
      <path d="M9 0v18M0 9h18" stroke="black" strokeWidth="1" />
    </svg>
  );
  return (
    <>
      <Mark className="top-10 left-10" />
      <Mark className="top-10 right-10" />
      <Mark className="bottom-10 left-10" />
      <Mark className="bottom-10 right-10" />
    </>
  );
}
