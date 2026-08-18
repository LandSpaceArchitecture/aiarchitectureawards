import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Mail, ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { usePageMeta } from "@/src/hooks/usePageMeta";

interface QA {
  q: string;
  a: React.ReactNode;
}

interface Section {
  id: string;
  number: string;
  title: string;
  items: QA[];
}

const FAQ_SECTIONS: Section[] = [
  {
    id: "about",
    number: "01",
    title: "About the Awards",
    items: [
      {
        q: "What are the AI Architecture Awards?",
        a: "The AI Architecture Awards (AIAA) is a global platform recognizing excellence in architectural design facilitated by artificial intelligence. We celebrate the synergy between human creativity and machine intelligence across architecture, landscape, urban design, interior, visualization, diagrams, animation, and real estate.",
      },
      {
        q: "Who organizes the awards?",
        a: "AIAA is an independent initiative dedicated to documenting the rise of AI-driven design practice. Our jury includes professors, founders, and practitioners from internationally recognized studios and universities.",
      },
      {
        q: "When is the 2026 edition?",
        a: (
          <ul className="space-y-2">
            <li>Early Entry Deadline: <strong>August 14, 2026</strong></li>
            <li>Standard Entry Deadline: <strong>August 26, 2026</strong></li>
            <li>Late Entry Deadline: <strong>September 15, 2026</strong></li>
            <li>Final Submission Deadline: <strong>September 30, 2026</strong></li>
            <li>Jury Review: <strong>October 1 – October 9, 2026</strong></li>
            <li>Winners Announcement: <strong>October 12, 2026</strong></li>
          </ul>
        ),
      },
    ],
  },
  {
    id: "eligibility",
    number: "02",
    title: "Eligibility",
    items: [
      {
        q: "Who can submit?",
        a: "Anyone, anywhere in the world. Individual designers, studios, students, researchers — open to all skill levels and disciplines.",
      },
      {
        q: "Can I submit work made entirely by AI?",
        a: "Yes. We recognize that AI tools are central to today's creative process. Submissions can be fully AI-generated, hybrid human-AI collaborations, or AI-assisted traditional design.",
      },
      {
        q: "Can student work be submitted?",
        a: "Absolutely. We encourage student submissions. There is no separate student fee, but all work is judged on the same criteria.",
      },
      {
        q: "Can I submit work that has been published or won other awards?",
        a: "Yes, prior publication or recognition does not disqualify your work.",
      },
      {
        q: "Can I submit on behalf of a team?",
        a: 'Yes. Use the "Other Credits" field on the submission form to list all collaborators and team members.',
      },
    ],
  },
  {
    id: "categories",
    number: "03",
    title: "Categories & Pricing",
    items: [
      {
        q: "What are the categories?",
        a: (
          <ol className="space-y-1 list-decimal list-inside">
            <li>AI Architecture Design</li>
            <li>AI Landscape Architecture</li>
            <li>AI Urban Design & Masterplanning</li>
            <li>AI Interior & Spatial Design</li>
            <li>AI Visualization & Rendering</li>
            <li>AI Diagram & Mapping</li>
            <li>AI Animation & Video</li>
            <li>AI Real Estate & Land Development</li>
          </ol>
        ),
      },
      {
        q: "How much does it cost to submit?",
        a: (
          <div className="space-y-4">
            <p>Two pricing tracks based on entrant type:</p>
            <div>
              <p><strong>Student</strong> — for current students (honor system, may be asked for verification if shortlisted):</p>
              <ul className="ml-4 space-y-1">
                <li>Early (until August 14): <strong>$20</strong> per category</li>
                <li>Standard (until August 26): <strong>$30</strong> per category</li>
                <li>Late (until September 15): <strong>$40</strong> per category</li>
                <li>Animation & Video: <strong>$35</strong> fixed</li>
                <li>Each additional category: <strong>+$10</strong></li>
              </ul>
            </div>
            <div>
              <p><strong>Professional</strong> — architects, studios, designers, researchers:</p>
              <ul className="ml-4 space-y-1">
                <li>Early (until August 14): <strong>$50</strong> per category</li>
                <li>Standard (until August 26): <strong>$80</strong> per category</li>
                <li>Late (until September 15): <strong>$110</strong> per category</li>
                <li>Animation & Video: <strong>$90</strong> fixed</li>
                <li>Each additional category: <strong>+$10</strong></li>
              </ul>
            </div>
            <p className="text-xs text-black/50">Studios entering 3+ projects can email info@aiarchitectureawards.com for bulk pricing.</p>
          </div>
        ),
      },
      {
        q: "Can one project enter multiple categories?",
        a: "Yes. Select all relevant categories on the submission form. You pay the first category at the standard tier price, and each additional one is +$10.",
      },
    ],
  },
  {
    id: "submission",
    number: "04",
    title: "Submission Process",
    items: [
      {
        q: "How do I submit?",
        a: (
          <ol className="space-y-1 list-decimal list-inside">
            <li>Create an account or log in</li>
            <li>Go to the Submit page</li>
            <li>Fill in project details, select categories, upload images</li>
            <li>Pay via secure Stripe checkout</li>
            <li>Receive email confirmation</li>
          </ol>
        ),
      },
      {
        q: "What images do I need?",
        a: (
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>1 cover image</strong> (required)</li>
            <li>Up to <strong>5 additional gallery images</strong> (optional but recommended)</li>
            <li>Maximum file size: <strong>15 MB</strong> per image (auto-compressed)</li>
            <li>Accepted formats: JPG, PNG, WebP</li>
          </ul>
        ),
      },
      {
        q: "Can I include a video?",
        a: "Yes. Provide a URL (YouTube, Vimeo, etc.) in the Video URL field. The video is not required.",
      },
      {
        q: "Can I edit my submission after submitting?",
        a: (
          <span>
            Not directly through the website. Email{" "}
            <a href="mailto:info@aiarchitectureawards.com" className="underline hover:no-underline">
              info@aiarchitectureawards.com
            </a>{" "}
            with your submission ID and we'll help you make corrections.
          </span>
        ),
      },
      {
        q: "Can I see my submitted projects?",
        a: (
          <span>
            Yes. Log in and go to{" "}
            <Link to="/my-submissions" className="underline hover:no-underline">
              My Submissions
            </Link>{" "}
            to see all projects you've entered, payment history, and current status.
          </span>
        ),
      },
    ],
  },
  {
    id: "payment",
    number: "05",
    title: "Payment & Refunds",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "All major credit cards (Visa, Mastercard, American Express, Discover), Apple Pay, and Google Pay via Stripe.",
      },
      {
        q: "Is payment secure?",
        a: "Yes. We use Stripe for all transactions. Your card details never touch our servers.",
      },
      {
        q: "Can I get a refund?",
        a: (
          <span>
            Submission fees are non-refundable once the entry is accepted, except in case of duplicate payment or technical error. Contact{" "}
            <a href="mailto:info@aiarchitectureawards.com" className="underline hover:no-underline">
              info@aiarchitectureawards.com
            </a>{" "}
            within 7 days for assistance.
          </span>
        ),
      },
      {
        q: "Do I get an invoice/receipt?",
        a: "Yes, automatically by email after successful submission, with project details and fee paid. Stripe also sends a separate payment receipt.",
      },
    ],
  },
  {
    id: "jury",
    number: "06",
    title: "Jury & Evaluation",
    items: [
      {
        q: "Who judges the work?",
        a: "An international panel of architects, professors, and AI design researchers. Current jury includes Rada Daleva (Daleva Design), Joshua Vermillion (UNLV), Shweta Hingane (The Archart Studio), and additional members.",
      },
      {
        q: "How is the work evaluated?",
        a: (
          <span>
            Submissions are evaluated <strong>blind</strong> — jurors see project title, descriptions, and images, but not your name, email, or country. This ensures merit-based judgment free from bias.
          </span>
        ),
      },
      {
        q: "What criteria do jurors use?",
        a: (
          <ul className="space-y-1 list-disc list-inside">
            <li>Innovation in AI tool use</li>
            <li>Conceptual rigor and design quality</li>
            <li>Visual impact and craft</li>
            <li>Contribution to the discipline</li>
          </ul>
        ),
      },
      {
        q: "When will I know if I won?",
        a: "Winners will be announced October 12, 2026 by email and on aiarchitectureawards.com.",
      },
    ],
  },
  {
    id: "winners",
    number: "07",
    title: "Winners & Recognition",
    items: [
      {
        q: "What do winners receive?",
        a: (
          <ul className="space-y-1 list-disc list-inside">
            <li>Inclusion in the official 2026 winners selection</li>
            <li>Digital certificate of recognition</li>
            <li>Coverage on AIAA channels and partner publications</li>
            <li>Permanent archive on aiarchitectureawards.com</li>
          </ul>
        ),
      },
      {
        q: "Can I use the AIAA award badge?",
        a: "Yes — once results are announced, all selected entrants receive a digital badge they can use in portfolios, social media, and press materials.",
      },
    ],
  },
  {
    id: "rights",
    number: "08",
    title: "Rights & Privacy",
    items: [
      {
        q: "Who owns the rights to submitted work?",
        a: (
          <span>
            <strong>You retain full copyright.</strong> By submitting, you grant AIAA a non-exclusive license to display your work on aiarchitectureawards.com and in promotional materials, with proper attribution.
          </span>
        ),
      },
      {
        q: "Will my submitter info be shared?",
        a: "No. Your name, email, and country are only visible to the AIAA administrative team. The jury reviews work blind. Your contact information is never sold or shared with third parties.",
      },
      {
        q: "Can I withdraw my submission?",
        a: (
          <span>
            Yes, at any time before the announcement. Email{" "}
            <a href="mailto:info@aiarchitectureawards.com" className="underline hover:no-underline">
              info@aiarchitectureawards.com
            </a>{" "}
            with your submission ID. Fees are non-refundable after the entry has been accepted.
          </span>
        ),
      },
    ],
  },
  {
    id: "support",
    number: "09",
    title: "Support",
    items: [
      {
        q: "I have a question not answered here.",
        a: (
          <span>
            Email{" "}
            <a href="mailto:info@aiarchitectureawards.com" className="underline hover:no-underline">
              info@aiarchitectureawards.com
            </a>{" "}
            — we typically respond within 24–48 hours.
          </span>
        ),
      },
      {
        q: "I forgot my password.",
        a: 'Use the "Sign in with Google" option, or contact us to reset.',
      },
      {
        q: "I can't see my project after payment.",
        a: (
          <span>
            It should appear in{" "}
            <Link to="/my-submissions" className="underline hover:no-underline">
              My Submissions
            </Link>{" "}
            immediately. If not, email us with the payment confirmation and we'll resolve within 24 hours.
          </span>
        ),
      },
    ],
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-6 flex items-start justify-between gap-6 text-left group"
      >
        <span className="text-lg md:text-xl font-bold uppercase tracking-tight leading-tight group-hover:text-black/60 transition-colors">
          {q}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0 mt-1 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-8 pr-12 text-base text-black/70 leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  usePageMeta({
    title: "FAQ — Submission, Pricing, Jury",
    description: "Answers about submitting to the 2026 AI Architecture Awards: eligibility, fees, jury process, payment, rights, and timelines.",
    canonicalPath: "/faq",
  });

  // Inject FAQPage JSON-LD for Google rich results
  useEffect(() => {
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQ_SECTIONS.flatMap(section =>
        section.items.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": typeof item.a === "string"
              ? item.a
              : `See https://www.aiarchitectureawards.com/faq#${section.id} for full answer.`
          }
        }))
      )
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-jsonld";
    script.text = JSON.stringify(faqJsonLd);
    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById("faq-jsonld");
      if (existing) existing.remove();
    };
  }, []);

  const toggle = (key: string) => {
    setOpenKey(prev => (prev === key ? null : key));
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-4">
              KNOWLEDGE / FAQ
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter leading-[0.9]">
              Frequently <br />
              Asked <br />
              Questions
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pl-12 flex items-end">
            <p className="text-base md:text-lg text-black/60 leading-relaxed">
              Everything you need to know about the 2026 AI Architecture Awards — submissions, pricing, jury, and rights. Still can't find an answer?{" "}
              <a href="mailto:info@aiarchitectureawards.com" className="underline hover:no-underline text-black">
                Email us
              </a>.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-24">
          {FAQ_SECTIONS.map(section => (
            <section key={section.id} id={section.id}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-8">
                <div className="lg:col-span-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-2">
                    {section.number}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight leading-tight">
                    {section.title}
                  </h2>
                </div>
                <div className="lg:col-span-9">
                  {section.items.map((item, idx) => {
                    const key = `${section.id}-${idx}`;
                    return (
                      <FAQItem
                        key={key}
                        q={item.q}
                        a={item.a}
                        isOpen={openKey === key}
                        onToggle={() => toggle(key)}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-32 border-t border-black/10 pt-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tight leading-tight">
              Still have questions?
            </h3>
            <p className="mt-4 text-base text-black/60 leading-relaxed max-w-md">
              Reach out anytime. We respond within 24–48 hours.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
            <a
              href="mailto:info@aiarchitectureawards.com"
              className="inline-flex items-center justify-center gap-3 border border-black px-8 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Us</span>
            </a>
            <Link
              to="/submit"
              className="inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-gray-800 transition-all"
            >
              <span>Submit Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
