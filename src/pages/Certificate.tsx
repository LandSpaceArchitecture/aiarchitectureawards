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
  shortlist?: boolean;
};

const WINNERS: Winner[] = [
  { slug: "crystal-spiral",               cert_id: "AIAA-2026-01", project_id: "a068f4d1-4808-494f-97ac-932c605a1325", project_title: "CRYSTAL SPIRAL",                                                                                                 author_name: "FLASHFORWARD AGENCY",       country: "Italy",          rank: 1 },
  { slug: "beneath-the-still-water",      cert_id: "AIAA-2026-02", project_id: "9734620b-30f1-4422-a6dd-b8b1434f2d14", project_title: "beneath the still water",                                                                                       author_name: "Eunjin Choi · Taehee Kim · Yeonjeong Ryu", country: "Korea, South",   rank: 2 },
  { slug: "the-house-that-never-existed", cert_id: "AIAA-2026-03", project_id: "879cc44c-1589-4d99-9d30-25195a610b53", project_title: "THE HOUSE THAT NEVER EXISTED",                                                                                  author_name: "Im Jiwon, Ryu Eunbee",      country: "Korea, South",   rank: 3 },
  { slug: "dancheong-refracted",          cert_id: "AIAA-2026-04", project_id: "37dabb17-9677-45bc-8ac6-1a5b9310bff8", project_title: "DANCHEONG, REFRACTED",                                                                                          author_name: "EUNJEONG KIM / HYUNBIN DO / GYURI PARK", country: "Korea, South",   rank: 4 },
  { slug: "multimodal-architecture",      cert_id: "AIAA-2026-05", project_id: "74af2043-1894-4523-9f93-a3eb86a5ea46", project_title: "Multimodal Architecture: Applications of Language in a Human-AI Collaborative Design Process",              author_name: "Devvratsingh",              country: "India",          rank: 5 },
  { slug: "the-landscape-remembers",      cert_id: "AIAA-2026-06", project_id: "f36cf930-1d1e-4742-a7a6-dc7a8c091365", project_title: "The Landscape Remembers",                                                                                      author_name: "gwon ye rim · KIM MIN SEON · KIM EUN SU · SEOL SEUNG SEO", country: "Korea, South",   rank: 6 },
  { slug: "casa-patio",                   cert_id: "AIAA-2026-07", project_id: "706cb015-b9a1-420a-ac6b-251293253aa7", project_title: "CASA PATIO — A Contemporary Interpretation of Yucatecan Domestic Architecture",                              author_name: "EXPERIMENTARQ ARQUITECTOS", country: "Mexico",         rank: 7 },
  { slug: "the-last-voice",               cert_id: "AIAA-2026-08", project_id: "c8a4a6fe-810b-49f9-b112-549fe5c105fc", project_title: "THE LAST VOICE — Memorial for The Livonian Language",                                                          author_name: "JIHYEON YOON, YUMIN KIM",   country: "Korea, South",   rank: 8 },
  { slug: "canopia",                      cert_id: "AIAA-2026-09", project_id: "",                                     project_title: "CanopIA — Automatic detection and counting of urban trees by an AI agent connected to QGIS",                 author_name: "Loic Tcheugoue · Karol Mezafack · Jovis Nguefack", country: "Cameroon", rank: 9, category: "REAL ESTATE" },
  { slug: "voxel-terra",                  cert_id: "AIAA-2026-10", project_id: "d7e83e9e-98a0-4e31-958d-856a0abe9665", project_title: "Voxel Terra",                                                                                                   author_name: "Adithi Bhanu Prakash",      country: "Australia",      rank: 10, category: "ARCHITECTURE" },
  { slug: "aitopia",                      cert_id: "AIAA-2026-11", project_id: "18059aa5-097d-425c-b09b-93b78671d3e2", project_title: "AItopia: Digital Inhabitable Scape",                                                                           author_name: "Nomavek Studio",            country: "United Kingdom", category: "VISUALIZATION" },
  { slug: "after-macbeth",                cert_id: "AIAA-2026-16", project_id: "3675ee76-23ef-417f-930e-267f06ac01e7", project_title: "After Macbeth",                                                                                                  author_name: "Natalie Burkhart",          country: "Austria",        category: "INTERIOR" },
  { slug: "odyssey-fruity-city",          cert_id: "AIAA-2026-12", project_id: "e68a34ac-ab55-4b6c-b147-0d5006390902", project_title: "Odyssey to Peter Cook's Fruity City",                                                                           author_name: "Yi Wang / Yione Studio",    country: "United States",  category: "ANIMATION" },
  { slug: "monster",                      cert_id: "AIAA-2026-13", project_id: "916693aa-2a4b-4e05-815a-c1dcf6fa4087", project_title: "MONSTER",                                                                                                       author_name: "Chen yiwei",                country: "China",          category: "URBAN" },
  { slug: "after-breath",                 cert_id: "AIAA-2026-14", project_id: "7d152afc-c30e-4126-a702-4e3b092ecee3", project_title: "AFTER BREATH",                                                                                                  author_name: "HYUNBIN DO / EUNJEONG KIM / GYURI PARK", country: "Korea, South",   category: "LANDSCAPE" },
  { slug: "city-scanner",                 cert_id: "AIAA-2026-15", project_id: "17cf7531-05c1-46b9-a108-a977f041c3e5", project_title: "City Scanner",                                                                                                  author_name: "Alejandro Quinto",          country: "Spain",          category: "DIAGRAM & MAPPING" },

  // ── Shortlist Finalists (28) ────────────────────────────────────────────
  { slug: "bhotekoshi-river-flood-response-map", cert_id: "AIAA-2026-SL01", project_id: "371c74fe-b3e6-4859-9a9a-8aff223c111c", project_title: "Bhotekoshi River Flood Response Map, Rasuwa, Nepal (August 2026)", author_name: "Tek Kshetri", country: "Nepal", shortlist: true },
  { slug: "aetheria-tower", cert_id: "AIAA-2026-SL02", project_id: "012ecaa5-d322-4078-b69d-ef631e4e19bf", project_title: "Aetheria Tower", author_name: "Jamila Karimova", country: "Azerbaijan", shortlist: true },
  { slug: "ai-fungi-and-residual-ground", cert_id: "AIAA-2026-SL03", project_id: "dd473b9e-208c-4bca-9acf-3420f9c8b685", project_title: "AI, Fungi, and Residual Ground: A Field-Verified Protocol for Urban Micro-Sites", author_name: "Davidson Hancong Ding", country: "United States", shortlist: true },
  { slug: "architecture-of-architecture", cert_id: "AIAA-2026-SL04", project_id: "c19fc07e-9a31-4e8f-9eb1-c6dbd213e0bd", project_title: "Architecture of architecture", author_name: "Cristiano Antonutti", country: "Italy", shortlist: true },
  { slug: "beirut-spine-and-graft", cert_id: "AIAA-2026-SL05", project_id: "f2c7b642-5b19-4a99-a5f9-9bef6c1a5464", project_title: "Beirut: Spine and Graft", author_name: "Gregory Taousson", country: "Lebanon", shortlist: true },
  { slug: "cave-home-train-home-and-furry-home", cert_id: "AIAA-2026-SL06", project_id: "7270be94-6c80-4ef8-a7a6-cd7cc3d52fe2", project_title: "Cave Home, Train Home and Furry Home", author_name: "Emre Arslan", country: "Turkey", shortlist: true },
  { slug: "dune-vision", cert_id: "AIAA-2026-SL07", project_id: "9db0a496-cb14-4887-a3c9-09bd1cd417f3", project_title: "Dune vision", author_name: "Fíona Caoileann", country: "Finland", shortlist: true },
  { slug: "emergent-environments-lithification", cert_id: "AIAA-2026-SL08", project_id: "5540b6aa-baa8-45ba-bfdf-8243cdbeeabb", project_title: "EMERGENT ENVIRONMENTS 003: LITHIFICATION", author_name: "Konrad Kołtun / FOUNTAINHEAD ARCHITEKT", country: "Poland", shortlist: true },
  { slug: "framing-potala", cert_id: "AIAA-2026-SL09", project_id: "9be68713-e3fb-4dfe-b014-27ac794306e5", project_title: "Framing Potala: The Sacred Horizon", author_name: "e zhang", country: "China", shortlist: true },
  { slug: "metropolis", cert_id: "AIAA-2026-SL10", project_id: "fa9556fc-7557-4e79-97c0-a24ae79d0eaf", project_title: "Metropolis — Can an accumulated city adapt to an uncertain future without abandoning its memory?", author_name: "Bart Weiyong Zhang", country: "United States", shortlist: true },
  { slug: "mot-solen-ascent-toward-the-sun", cert_id: "AIAA-2026-SL11", project_id: "80a18b67-6160-490f-abe7-3a9f037c8be1", project_title: "MOt solen — The Ascent Toward the Sun", author_name: "CHEMLAL OTHMANE", country: "Morocco", shortlist: true },
  { slug: "nexus-of-urban-alchemy", cert_id: "AIAA-2026-SL12", project_id: "d8c8bd3f-7241-42bb-aea9-4da9d21cab6b", project_title: "Nexus of urban alchemy", author_name: "dongjun lee", country: "Korea, South", shortlist: true },
  { slug: "paradox", cert_id: "AIAA-2026-SL13", project_id: "67294431-5424-4962-ab33-7cc17ae5d88e", project_title: "PARADOX", author_name: "Jenifer Haider Chowdhury", country: "Bangladesh", shortlist: true },
  { slug: "recursive-spatial-consciousness", cert_id: "AIAA-2026-SL14", project_id: "3ca263cf-e882-4790-ba5d-190c37ce4527", project_title: "recursive[spatial]consciousness", author_name: "Patrick McManama", country: "United States", shortlist: true },
  { slug: "rooted-high-rise", cert_id: "AIAA-2026-SL15", project_id: "7ec67c21-7215-4d4b-a824-760112ade874", project_title: "ROOTED HIGH-RISE: AI-Curated Ecologies for Vertical Living", author_name: "Eamon Sun", country: "China", shortlist: true },
  { slug: "sand-port", cert_id: "AIAA-2026-SL16", project_id: "30be08a2-2564-4bbf-b393-0762d5678486", project_title: "Sand Port", author_name: "YEJIN CHA", country: "Korea, South", shortlist: true },
  { slug: "strait-of-union", cert_id: "AIAA-2026-SL17", project_id: "3058781b-a018-4962-8fc4-c1724f8793bc", project_title: "Strait of Union", author_name: "Znera Space", country: "United Arab Emirates", shortlist: true },
  { slug: "temple-to-nothing", cert_id: "AIAA-2026-SL18", project_id: "5755c30e-6c17-432a-8b5c-3d222b9e051b", project_title: "Temple to Nothing", author_name: "Elchanan Brown", country: "Australia", shortlist: true },
  { slug: "the-last-glacier-archive", cert_id: "AIAA-2026-SL19", project_id: "5a064c25-2e7a-4a80-87f3-2faadf253e8c", project_title: "THE LAST GLACIER ARCHIVE", author_name: "JIHYEON YOON, YUMIN KIM", country: "Korea, South", shortlist: true },
  { slug: "the-second-life-of-memory", cert_id: "AIAA-2026-SL20", project_id: "291d4bd4-4278-4c1c-8e83-cf2e64e492ae", project_title: "The Second Life of Memory", author_name: "Siyu Gao", country: "United States", shortlist: true },
  { slug: "the-vortex", cert_id: "AIAA-2026-SL21", project_id: "eb4cd24e-3bdc-42ad-9da9-eab462e56b36", project_title: "The Vortex", author_name: "Jason Pieper", country: "United States", shortlist: true },
  { slug: "timeless-contrast", cert_id: "AIAA-2026-SL22", project_id: "70470329-9681-4dd3-aedd-7583eaec8037", project_title: "Timeless Contrast", author_name: "Malgorzata Puzzo", country: "Poland", shortlist: true },
  { slug: "vertic-multi-hazard-observatory", cert_id: "AIAA-2026-SL23", project_id: "c74fb404-4c02-4c8d-acc5-92353e136009", project_title: "VERTIC: Multi-Hazard Observatory for Natural Disasters in Tropical Regions", author_name: "Loic Tcheugoue · Karol Mezafack · Jovis Nguefack", country: "Cameroon", shortlist: true },
  { slug: "visiontodesign-ai-agent", cert_id: "AIAA-2026-SL24", project_id: "1fe59106-a1a8-4266-a0a6-9525d3ea99bd", project_title: "VisionToDESIGN AI Agent", author_name: "Krish Jain", country: "Canada", shortlist: true },
  { slug: "w-houston-st-renovation", cert_id: "AIAA-2026-SL25", project_id: "84f08c64-fe93-41e7-b5e4-b26bff97fa6d", project_title: "W Houston St Renovation", author_name: "Jenny Han", country: "United States", shortlist: true },
  { slug: "where-home-meets-the-flyway", cert_id: "AIAA-2026-SL27", project_id: "e2494ee3-5c18-4afe-af13-4598774b0501", project_title: "Where Home Meets the Flyway: A Shared Landscape for Migratory Birds and Villagers along Poyang Lake's Wetland Edge", author_name: "Yuwei Gao", country: "China", shortlist: true },
  { slug: "work-to-play", cert_id: "AIAA-2026-SL28", project_id: "402c44db-ef0e-4a00-9b21-7fd9e256fa48", project_title: "Work to Play", author_name: "María Cuellar", country: "Colombia", shortlist: true },
];

const SITE_ORIGIN = "https://aiarchitectureawards.com";

function rankLabel(winner: Winner) {
  if (winner.shortlist) return "SHORTLIST FINALIST";
  const r = winner.rank;
  if (!r) return null;
  if (r === 1) return "FIRST PLACE OVERALL";
  if (r === 2) return "SECOND PLACE OVERALL";
  if (r === 3) return "THIRD PLACE OVERALL";
  return "TOP TEN OVERALL";
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

  const rl = rankLabel(winner);
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

        {/* Watermark: AI ARCHITECTURE AWARDS as big flat text, centered horizontally */}
        <div
          className="absolute pointer-events-none select-none font-bold uppercase whitespace-nowrap"
          aria-hidden
          style={{
            left: "50%",
            top: "60%",
            transform: "translate(-50%, -50%)",
            fontSize: 92,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "#000",
            opacity: 0.05,
          }}
        >
          AI Architecture Awards
        </div>

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
            <div className="flex items-start justify-between gap-10">
              {/* Date */}
              <div className="flex-1">
                <div className="border-t border-black pt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/60">
                  Awarded
                </div>
                <div className="font-mono text-sm font-bold mt-1">October 22, 2026</div>
              </div>

              {/* Issuer */}
              <div className="flex-1 text-center">
                <div className="border-t border-black pt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/60">
                  Issued by
                </div>
                <div className="font-mono text-sm font-bold mt-1">AI Architecture Awards</div>
                <div className="font-mono text-[9px] text-black/50 mt-0.5">Organising Committee</div>
              </div>

              {/* QR */}
              <div className="flex-1 flex items-start justify-end gap-4">
                <div className="text-right">
                  <div className="border-t border-black pt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/60">
                    Verify at
                  </div>
                  <div className="font-mono text-[9px] text-black/60 mt-1 max-w-[150px] break-all">
                    {verifyUrl.replace(/^https?:\/\//, "")}
                  </div>
                </div>
                <img
                  src={qrSrc}
                  alt="Verify certificate"
                  width={64}
                  height={64}
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

      {/* Index of all certificates */}
      <div className="print:hidden mx-auto max-w-[1100px] px-6 mt-10 space-y-8">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-3">
            Winners · {WINNERS.filter(w => !w.shortlist).length} certificates
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {WINNERS.filter(w => !w.shortlist).map((w) => (
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
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-3">
            Shortlist Finalists · {WINNERS.filter(w => w.shortlist).length} certificates
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {WINNERS.filter(w => w.shortlist).map((w) => (
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
