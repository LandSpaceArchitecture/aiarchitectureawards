import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Package, Globe, Pencil, Check } from "lucide-react";
import { usePageMeta } from "@/src/hooks/usePageMeta";

type Variant = {
  id: string;
  name: string;
  image: string;
  swatch: string; // CSS color for swatch dot
};

const VARIANTS: Variant[] = [
  { id: "gold",   name: "Gold",         image: "/trophy/gold.webp",   swatch: "#D4AF37" },
  { id: "silver", name: "Silver",       image: "/trophy/silver.webp", swatch: "#C7C8CA" },
  { id: "copper", name: "Copper",       image: "/trophy/copper.webp", swatch: "#B87333" },
  { id: "blue",   name: "Cobalt Blue",  image: "/trophy/blue.webp",   swatch: "#1F4FD4" },
];

const SPECS = [
  { label: "Size",     value: "18 × 8 × 2.5 cm" },
  { label: "Material", value: "Metal + Crystal" },
  { label: "Process",  value: "UV Printing" },
  { label: "Weight",   value: "≈ 1057 g" },
];

export default function Trophy() {
  usePageMeta({
    title: "Official Winner Trophy — AI Architecture Awards 2026",
    description:
      "The 2026 AI Architecture Awards Official Winner Trophy — personalised metal-and-crystal trophy, four finishes, international shipping included. USD 150.",
    canonicalPath: "/trophy",
  });

  const [variant, setVariant] = useState<Variant>(VARIANTS[0]);

  const mailtoHref = useMemo(() => {
    const subject = `Official Winner Trophy — Order (${variant.name})`;
    const body = `Hi AI Architecture Awards team,

I'd like to order the Official Winner Trophy.

Finish: ${variant.name}

Engraving — name(s) on trophy:
•

Shipping address:
• Full name:
• Street:
• City / State / Postal code:
• Country:
• Phone:

Thank you!`;
    return `mailto:info@aiarchitectureawards.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [variant]);

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero */}
      <section className="pt-28 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40">
            AI Architecture Awards 2026
          </span>
          <h1 className="mt-4 text-5xl font-bold uppercase tracking-tighter sm:text-7xl md:text-8xl leading-[0.9]">
            Official<br />Winner Trophy
          </h1>
        </div>
      </section>

      {/* Product viewer */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Image */}
            <div className="lg:col-span-7 bg-black border border-white/10 relative">
              <div className="aspect-square flex items-center justify-center p-6 md:p-10">
                <img
                  key={variant.id}
                  src={variant.image}
                  alt={`AI Architecture Awards 2026 trophy — ${variant.name}`}
                  className="max-h-full max-w-full object-contain transition-opacity duration-300"
                />
              </div>
              {/* Thumbnails */}
              <div className="border-t border-white/10 grid grid-cols-4">
                {VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v)}
                    className={
                      "aspect-square flex items-center justify-center p-2 md:p-3 transition-all border-r border-white/10 last:border-r-0 " +
                      (v.id === variant.id
                        ? "bg-white/10"
                        : "bg-black hover:bg-white/[0.04]")
                    }
                    aria-label={v.name}
                  >
                    <img src={v.image} alt="" className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info panel */}
            <div className="lg:col-span-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3">
                Price
              </div>
              <div className="text-6xl md:text-7xl font-bold tracking-tighter leading-none">
                $150<span className="text-white/40 text-2xl ml-2 font-normal">USD</span>
              </div>
              <div className="mt-3 font-mono text-[11px] uppercase tracking-widest text-white/60">
                International shipping included
              </div>

              {/* Variant selector */}
              <div className="mt-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4">
                  Finish — <span className="text-white">{variant.name}</span>
                </div>
                <div className="flex gap-3">
                  {VARIANTS.map((v) => {
                    const active = v.id === variant.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVariant(v)}
                        aria-label={v.name}
                        className={
                          "h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all " +
                          (active ? "border-white scale-110" : "border-white/20 hover:border-white/60")
                        }
                        style={{ background: v.swatch }}
                      >
                        {active && <Check className="h-5 w-5 text-black" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specs */}
              <div className="mt-10 border-t border-white/10 pt-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 mb-5">
                  Information · Make products with care
                </div>
                <dl className="grid grid-cols-2 gap-y-5 gap-x-6">
                  {SPECS.map((s) => (
                    <div key={s.label}>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        {s.label}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-white">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* CTA */}
              <a
                href={mailtoHref}
                className="mt-10 inline-flex items-center gap-3 w-full justify-center bg-white text-black px-8 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-white/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Order the {variant.name} Trophy
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-3 text-[11px] text-white/40 text-center font-mono uppercase tracking-widest">
                Secure online payment coming soon · Email order active now
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <Pencil className="h-6 w-6 mb-4 text-white" />
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40 mb-2">
                Personalised engraving
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Each trophy is UV-printed with the recipient's name (or team members' names) under
                the standard "AI Architecture Awards 2026" header.
              </p>
            </div>
            <div>
              <Globe className="h-6 w-6 mb-4 text-white" />
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40 mb-2">
                Worldwide shipping
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Tracked international shipping is included in the $150 price. Trophies ship to any
                country where our courier partners deliver.
              </p>
            </div>
            <div>
              <Package className="h-6 w-6 mb-4 text-white" />
              <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40 mb-2">
                Protective packaging
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Delivered in a rigid presentation box with foam insert, suitable for display or
                gifting. Allow approximately 4–6 weeks for production and delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to order */}
      <section className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40 mb-4">
            How to order
          </div>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter leading-[0.95] max-w-3xl">
            Email us with your details and we'll send you a PayPal invoice.
          </h2>

          <ol className="mt-10 space-y-6 max-w-3xl">
            <li className="flex gap-6">
              <div className="font-mono text-xs text-white/40 pt-1 shrink-0 w-8">01</div>
              <div>
                <div className="font-bold text-base mb-1">
                  Click the <span className="font-mono">Order the … Trophy</span> button above
                </div>
                <p className="text-sm text-white/60">
                  Your email client opens with a pre-filled order template.
                </p>
              </div>
            </li>
            <li className="flex gap-6">
              <div className="font-mono text-xs text-white/40 pt-1 shrink-0 w-8">02</div>
              <div>
                <div className="font-bold text-base mb-1">Fill in your engraving details</div>
                <ul className="text-sm text-white/60 space-y-1 list-disc pl-5">
                  <li>Name(s) of the recipient(s) on trophy</li>
                </ul>
              </div>
            </li>
            <li className="flex gap-6">
              <div className="font-mono text-xs text-white/40 pt-1 shrink-0 w-8">03</div>
              <div>
                <div className="font-bold text-base mb-1">Confirm the shipping address</div>
                <p className="text-sm text-white/60">
                  Full postal address, recipient name, and a phone number for the courier.
                </p>
              </div>
            </li>
            <li className="flex gap-6">
              <div className="font-mono text-xs text-white/40 pt-1 shrink-0 w-8">04</div>
              <div>
                <div className="font-bold text-base mb-1">Pay via PayPal invoice</div>
                <p className="text-sm text-white/60">
                  We'll send a $150 PayPal invoice. Production begins once payment is received.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Fine print */}
      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4">
            Important
          </div>
          <ul className="text-xs text-white/60 space-y-2 leading-relaxed max-w-3xl">
            <li>
              <strong className="text-white">International shipping is included</strong> in the
              $150 price. Import duties, VAT, and local customs charges, if applicable, are the
              recipient's responsibility.
            </li>
            <li>
              <strong className="text-white">Production time</strong> is approximately 4–6 weeks
              from the date of payment, plus courier transit time to your destination.
            </li>
            <li>
              <strong className="text-white">Engraving is final.</strong> Please double-check names
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
            className="mt-10 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-white transition-colors"
          >
            ← Back to Winners
          </Link>
        </div>
      </section>
    </div>
  );
}
