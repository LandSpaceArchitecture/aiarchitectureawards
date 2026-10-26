import { Link } from "react-router-dom";
import { ArrowRight, Mail, Package, Globe, Pencil } from "lucide-react";
import { usePageMeta } from "@/src/hooks/usePageMeta";

export default function Trophy() {
  usePageMeta({
    title: "Official Winner Trophy — AI Architecture Awards 2026",
    description:
      "The 2026 AI Architecture Awards Official Winner Trophy — a personalised physical trophy for winners and finalists. $150 USD, international shipping included.",
    canonicalPath: "/trophy",
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="border-b border-black/10 pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-400">
                AI Architecture Awards 2026
              </span>
              <h1 className="mt-4 text-5xl font-bold uppercase tracking-tighter sm:text-7xl md:text-8xl leading-[0.9]">
                Official<br />Winner Trophy
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pl-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/40 mb-2">
                Price
              </div>
              <div className="text-5xl md:text-6xl font-bold tracking-tighter leading-none">
                $150<span className="text-black/40 text-2xl ml-2 font-normal">USD</span>
              </div>
              <div className="mt-3 font-mono text-[11px] uppercase tracking-widest text-black/60">
                International shipping included
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-lg md:text-xl text-black/70 leading-relaxed max-w-3xl">
            A personalised, archival-quality physical trophy produced to mark your recognition at the
            2026 AI Architecture Awards. Available to all 2026 winners, category recognitions, and
            shortlist finalists.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-black/10 pt-16">
            <div>
              <Pencil className="h-6 w-6 mb-4" />
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-2">
                Personalised engraving
              </div>
              <p className="text-sm text-black/70 leading-relaxed">
                Each trophy is laser-engraved with your name (or team members), project title,
                category / rank, and the year 2026.
              </p>
            </div>
            <div>
              <Globe className="h-6 w-6 mb-4" />
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-2">
                Worldwide shipping
              </div>
              <p className="text-sm text-black/70 leading-relaxed">
                Tracked international shipping is included in the $150 price. Trophies ship to any
                country where our courier partners deliver.
              </p>
            </div>
            <div>
              <Package className="h-6 w-6 mb-4" />
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-black/40 mb-2">
                Protective packaging
              </div>
              <p className="text-sm text-black/70 leading-relaxed">
                Delivered in a rigid presentation box with foam insert, suitable for display or gifting.
                Allow approximately 4–6 weeks for production and delivery.
              </p>
            </div>
          </div>

          {/* How to order */}
          <div className="mt-24 border-t border-black pt-16">
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-black/40 mb-4">
              How to order
            </div>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-[0.95] max-w-3xl">
              Email us with your details and we'll send you the invoice.
            </h2>

            <ol className="mt-10 space-y-6 max-w-3xl">
              <li className="flex gap-6">
                <div className="font-mono text-xs text-black/40 pt-1 shrink-0 w-8">01</div>
                <div>
                  <div className="font-bold text-base mb-1">Send an email to{" "}
                    <a href="mailto:info@aiarchitectureawards.com?subject=Official Winner Trophy — Order"
                       className="underline decoration-black/30 hover:decoration-black">
                      info@aiarchitectureawards.com
                    </a>
                  </div>
                  <p className="text-sm text-black/60">Subject line: <span className="font-mono">Official Winner Trophy — Order</span></p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="font-mono text-xs text-black/40 pt-1 shrink-0 w-8">02</div>
                <div>
                  <div className="font-bold text-base mb-1">Include the engraving details</div>
                  <ul className="text-sm text-black/60 space-y-1 list-disc pl-5">
                    <li>Project title (exactly as you want it engraved)</li>
                    <li>Name(s) of the recipient(s)</li>
                    <li>Your award: rank / category / shortlist</li>
                    <li>Your Certificate ID (e.g. AIAA-2026-01)</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="font-mono text-xs text-black/40 pt-1 shrink-0 w-8">03</div>
                <div>
                  <div className="font-bold text-base mb-1">Confirm the shipping address</div>
                  <p className="text-sm text-black/60">Full postal address, recipient name, and a phone number for the courier.</p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="font-mono text-xs text-black/40 pt-1 shrink-0 w-8">04</div>
                <div>
                  <div className="font-bold text-base mb-1">Pay via PayPal invoice</div>
                  <p className="text-sm text-black/60">We'll send a $150 PayPal invoice. Production begins once payment is received.</p>
                </div>
              </li>
            </ol>

            <a
              href="mailto:info@aiarchitectureawards.com?subject=Official Winner Trophy — Order&body=Hi AI Architecture Awards team,%0D%0A%0D%0AI'd like to order the Official Winner Trophy.%0D%0A%0D%0AEngraving details:%0D%0A• Project title: %0D%0A• Recipient name(s): %0D%0A• Award (rank / category / shortlist): %0D%0A• Certificate ID (AIAA-2026-...): %0D%0A%0D%0AShipping address:%0D%0A• Full name: %0D%0A• Street: %0D%0A• City / State / Postal code: %0D%0A• Country: %0D%0A• Phone: %0D%0A%0D%0AThank you!"
              className="mt-12 inline-flex items-center gap-3 bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-gray-800 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Request Order Form
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Fine print */}
          <div className="mt-24 border-t border-black/10 pt-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/40 mb-4">
              Important
            </div>
            <ul className="text-xs text-black/60 space-y-2 leading-relaxed">
              <li>
                <strong className="text-black">International shipping is included</strong> in the
                $150 price. Import duties, VAT, and local customs charges (if any) are the recipient's
                responsibility and are not covered.
              </li>
              <li>
                <strong className="text-black">Production time</strong> is approximately 4–6 weeks
                from the date of payment, plus courier transit time to your destination.
              </li>
              <li>
                <strong className="text-black">Engraving is final.</strong> Please double-check names
                and spelling before confirming your order; replacements for approved copy cannot be
                offered free of charge.
              </li>
              <li>
                Available exclusively to 2026 AIAA winners, category recognitions and shortlist
                finalists.
              </li>
            </ul>

            <Link
              to="/winner"
              className="mt-10 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-black/60 hover:text-black transition-colors"
            >
              ← Back to Winners
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
