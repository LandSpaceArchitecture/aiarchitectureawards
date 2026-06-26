import { motion } from "motion/react";
import { JURY } from "@/src/constants";
import { usePageMeta } from "@/src/hooks/usePageMeta";
import { Instagram, Linkedin } from "lucide-react";

export default function Jurors() {
  usePageMeta({
    title: "Meet the Jury — 2026 Panel",
    description: "Meet the international panel of architects, professors, and AI design researchers selecting the 2026 AI Architecture Awards winners. Featuring Rada Daleva, Joshua Vermillion, Shweta Hingane, Afshin Ashari, Matt Perotto, and Daeho Lee.",
    canonicalPath: "/jurors",
  });

  const realJurors = JURY.filter((m: any) => !m.placeholder);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="border-b border-black/10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-end">
            <div className="lg:col-span-7">
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-4">
                THE PANEL / 2026
              </div>
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold uppercase tracking-tighter leading-[0.9]">
                Meet the <br />Jury
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pl-12">
              <p className="text-base md:text-lg text-black/60 leading-relaxed">
                An international panel of architects, professors, and AI design researchers — selecting the most visionary AI-driven design work of 2026.
              </p>
              <div className="mt-8 flex gap-8 md:gap-12">
                <div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tighter">{realJurors.length}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mt-1">Jurors</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tighter">5+</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mt-1">Countries</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tighter">8</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mt-1">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jury list — alternating left/right portrait + bio rows */}
      <section className="py-16 md:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24 md:space-y-40">
          {realJurors.map((member: any, idx: number) => {
            const reverse = idx % 2 === 1;
            return (
              <motion.article
                key={member.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center ${
                  reverse ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Portrait */}
                <div className="md:col-span-5">
                  <div className="aspect-[3/4] overflow-hidden bg-black/5 border border-black/5 group">
                    <img
                      src={member.image}
                      alt={`Portrait of ${member.name}`}
                      className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="md:col-span-7 md:px-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-4">
                    0{idx + 1} · 2026 Jury
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.95]">
                    {member.name}
                  </h2>
                  <div className="mt-4 font-mono text-xs uppercase tracking-widest text-black/60 leading-relaxed">
                    {member.role}
                  </div>
                  <p className="mt-8 text-base md:text-lg text-black/70 leading-relaxed">
                    {member.bio}
                  </p>

                  {(member.instagram || member.linkedin) && (
                    <div className="mt-8 flex flex-wrap items-center gap-6">
                      {member.instagram && (
                        <a
                          href={`https://instagram.com/${member.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/60 hover:text-black transition-colors"
                        >
                          <Instagram className="h-3.5 w-3.5" />
                          <span>@{member.instagram}</span>
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={`https://www.linkedin.com/in/${member.linkedin}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/60 hover:text-black transition-colors"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* CTA — Call for Jury */}
      <section className="border-t border-black/10 py-24 md:py-32 bg-black/[0.02]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-4">
            JOIN US
          </div>
          <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.95]">
            Call for Jury 2027
          </h3>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-black/60 leading-relaxed">
            We are growing our jury for future cycles. If you are an architect, researcher, educator, or practitioner working at the intersection of AI and design, we would love to hear from you.
          </p>
          <a
            href="mailto:info@aiarchitectureawards.com?subject=2027%20Jury%20Application"
            className="mt-10 inline-flex items-center gap-3 bg-black px-8 py-5 text-xs font-bold uppercase tracking-[0.3em] text-white hover:bg-gray-800 transition-all"
          >
            <span>Apply via Email</span>
          </a>
        </div>
      </section>
    </div>
  );
}
