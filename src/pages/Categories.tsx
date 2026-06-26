import { Link } from "react-router-dom";
import { CATEGORIES, PRICING, getEntryTier } from "@/src/constants";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePageMeta } from "@/src/hooks/usePageMeta";

export default function Categories() {
  const { user } = useAuth();
  const submitPath = user ? "/submit" : "/login?redirect=/submit";

  usePageMeta({
    title: "Award Categories — Architecture, Landscape, Urban, Interior, Visualization",
    description: "Eight categories for AI-driven design: Architecture, Landscape, Urban, Interior, Visualization, Diagram, Animation, Real Estate. Student & Professional pricing tiers.",
    canonicalPath: "/categories",
  });

  // Show both student and professional rates side by side
  const tier = getEntryTier();
  const tierKey = tier === "final" ? "late" : tier;

  const getStudentPrice = (catId: string) =>
    catId === 'animation' ? PRICING.student.animation : PRICING.student[tierKey];
  const getProfessionalPrice = (catId: string) =>
    catId === 'animation' ? PRICING.professional.animation : PRICING.professional[tierKey];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 sm:px-6 lg:px-8">
      <div className="mb-12 md:mb-24 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Competition</span>
        <h1 className="mt-4 md:mt-6 text-4xl sm:text-6xl md:text-8xl font-bold uppercase tracking-tighter">Award Categories</h1>
        <p className="mx-auto mt-6 md:mt-8 max-w-2xl text-base md:text-lg text-gray-500">
          Explore the diverse categories of the AI Architecture Awards 2026. Each category celebrates a unique aspect of how artificial intelligence is transforming the built environment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 md:gap-16 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="group flex flex-col border-b border-black pb-12">
            <div className="aspect-[4/3] overflow-hidden bg-gray-100 grayscale transition-all duration-500 group-hover:grayscale-0">
              <img
                src={category.image}
                alt={category.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-8 flex flex-grow flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-tight">{category.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">
                  {category.description}
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  ${getStudentPrice(category.id)} Student / ${getProfessionalPrice(category.id)} Pro
                </span>
                <Link
                  to={`${submitPath}${submitPath.includes('?') ? '&' : '?'}category=${category.id}`}
                  className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-black hover:underline"
                >
                  <span>Submit to this category</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-32 border-t border-black pt-24 text-center">
        <h2 className="text-3xl font-bold uppercase tracking-tighter">Multiple Entries</h2>
        <p className="mx-auto mt-6 max-w-xl text-gray-500">
          You can submit a project to multiple categories. Each additional category entry is discounted at +$10 per category.
        </p>
        <Link
          to={submitPath}
          className="mt-10 inline-block bg-black px-10 py-5 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-gray-800"
        >
          Start Your Submission
        </Link>
      </div>
    </div>
  );
}
