import cat01 from "@/src/assets/categories/01-architecture.png";
import cat02 from "@/src/assets/categories/02-landscape.png";
import cat03 from "@/src/assets/categories/03-urban.png";
import cat04 from "@/src/assets/categories/04-interior.png";
import cat05 from "@/src/assets/categories/05-visualization.png";
import cat06 from "@/src/assets/categories/06-diagram.png";
import cat07 from "@/src/assets/categories/07-animation.png";
import cat08 from "@/src/assets/categories/08-realestate.jpg";

import juryRada from "@/src/assets/jury/rada.jpg";
import juryJoshua from "@/src/assets/jury/joshua.jpg";
import juryShweta from "@/src/assets/jury/shweta.jpg";
import juryAfshin from "@/src/assets/jury/afshin.jpg";
import juryMatt from "@/src/assets/jury/matt.jpg";
import juryDaeho from "@/src/assets/jury/daeho.jpg";

export const CATEGORIES = [
  {
    id: "architecture",
    title: "AI Architecture Design",
    description: "Innovative architectural concepts and structures designed using AI tools.",
    image: cat01,
    price: 25,
  },
  {
    id: "landscape",
    title: "AI Landscape Architecture",
    description: "AI-driven landscape design, parks, and sustainable outdoor environments.",
    image: cat02,
    price: 25,
  },
  {
    id: "urban",
    title: "AI Urban Design & Masterplanning",
    description: "Future city planning and urban interventions powered by AI algorithms.",
    image: cat03,
    price: 25,
  },
  {
    id: "interior",
    title: "AI Interior & Spatial Design",
    description: "AI-generated interior spaces, furniture, and spatial experiences.",
    image: cat04,
    price: 25,
  },
  {
    id: "visualization",
    title: "AI Visualization & Rendering",
    description: "Hyper-realistic architectural visualizations and artistic renderings created with AI.",
    image: cat05,
    price: 25,
  },
  {
    id: "diagram",
    title: "AI Diagram & Mapping",
    description: "Complex architectural diagrams and data mapping generated through AI analysis.",
    image: cat06,
    price: 25,
  },
  {
    id: "animation",
    title: "AI Animation & Video",
    description: "Dynamic architectural walkthroughs and conceptual animations using AI video tools.",
    image: cat07,
    price: 35,
  },
  {
    id: "realestate",
    title: "AI Real Estate & Land Development",
    description: "AI-powered property valuation, land use optimization, and real estate development strategies.",
    image: cat08,
    price: 25,
  },
];

export const KEY_DATES = [
  { label: "Early Entry Deadline", date: "July 14, 2026" },
  { label: "Standard Entry Deadline", date: "July 26, 2026" },
  { label: "Late Entry Deadline", date: "August 9, 2026" },
  { label: "Final Submission Deadline", date: "August 14, 2026" },
  { label: "Jury Review Period", date: "August 15 – September 8, 2026" },
  { label: "Winners Announcement", date: "September 13, 2026" },
];

// Centralized pricing logic — single source of truth for all pages.
export type EntrantType = "student" | "professional";

export const PRICING_DEADLINES = {
  early: "2026-07-14",
  standard: "2026-07-26",
  late: "2026-08-09",
};

export const PRICING = {
  student: {
    early: 20,
    standard: 30,
    late: 40,
    animation: 35,        // flat fee for AI Animation & Video
    additionalCategory: 10,
  },
  professional: {
    early: 50,
    standard: 80,
    late: 110,
    animation: 90,        // flat fee for AI Animation & Video
    additionalCategory: 20,
  },
};

/** Get the current tier (early/standard/late/final) based on a date. */
export function getEntryTier(date: Date = new Date()): "early" | "standard" | "late" | "final" {
  const early = new Date(PRICING_DEADLINES.early);
  const standard = new Date(PRICING_DEADLINES.standard);
  const late = new Date(PRICING_DEADLINES.late);
  if (date <= early) return "early";
  if (date <= standard) return "standard";
  if (date <= late) return "late";
  return "final";
}

/** Human-readable label for the tier (used in emails, receipts). */
export function getEntryTierLabel(tier: ReturnType<typeof getEntryTier>): string {
  return {
    early: "Early Entry",
    standard: "Standard Entry",
    late: "Late Entry",
    final: "Final Entry",
  }[tier];
}

/**
 * Calculate the total fee for a submission.
 * @param categories — list of category IDs
 * @param entrantType — "student" or "professional"
 * @param date — submission date (defaults to now); used for tier pricing
 */
export function calculateFee(
  categories: string[],
  entrantType: EntrantType,
  date: Date = new Date()
): number {
  if (!categories || categories.length === 0) return 0;

  const rates = PRICING[entrantType];
  const tier = getEntryTier(date);
  const baseEntryFee = tier === "final" ? rates.late : rates[tier];

  // Each category's individual price
  const categoryPrices = categories.map(catId =>
    catId === "animation" ? rates.animation : baseEntryFee
  );

  // First category at full tier price (the highest in the list), additional categories at discount
  const firstCategoryPrice = Math.max(...categoryPrices);
  const additionalPrice = (categories.length - 1) * rates.additionalCategory;
  return firstCategoryPrice + additionalPrice;
}

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slonevia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

export const JURY_EMAILS = [
  "pipicorgisketch@gmail.com", // Admin is also a judge
  "landarch.org@gmail.com",
];

export const JURY = [
  {
    name: "Rada Daleva",
    role: "Founder, Daleva Design · AI-Integrated Architecture Practice",
    bio: "Architect behind the world's first fully AI-driven architectural project. Work includes Britishvolt, Aston Martin F1 HQ & EMAAR developments.",
    instagram: "daleva.architecture",
    linkedin: "",
    image: juryRada,
    placeholder: false,
  },
  {
    name: "Joshua Vermillion",
    role: "Professor of Architecture, UNLV · AI & Computational Design",
    bio: "AI & Computational Design researcher. Collaborator with Samsung, Microsoft & Architectural Digest. Behind the first AI/photography hybrid cover for Harper's BAZAAR.",
    instagram: "joshuavermillion",
    linkedin: "",
    image: juryJoshua,
    placeholder: false,
  },
  {
    name: "Shweta Hingane",
    role: "Founder, The Archart Studio",
    bio: "Architect, urban planner, and founder of The Archart Studio, pioneering AI-integrated architectural graphics education.",
    instagram: "the.archart",
    linkedin: "",
    image: juryShweta,
    placeholder: false,
  },
  {
    name: "Afshin Ashari",
    role: "Associate Professor of Landscape Architecture, University of Guelph",
    bio: "Working at the fertile edge where computation, AI, and landscape imagination meet. Background in both computer science and landscape architecture; his work treats computation not as a shortcut to efficiency, but as a medium of inquiry, perception, and invention.",
    instagram: "afshin.ashari",
    linkedin: "afshin-ashari-82749296",
    image: juryAfshin,
    placeholder: false,
  },
  {
    name: "Matt Perotto",
    role: "Principal, Urban Strategies · MLA, University of Toronto",
    bio: "ASLA, OALA, CSLA. Landscape architect, urban designer, and University of Toronto educator advancing automation and AI in design through practice at Urban Strategies and research with UofT and ASLA.",
    instagram: "",
    linkedin: "mattperotto",
    image: juryMatt,
    placeholder: false,
  },
  {
    name: "Daeho Lee",
    role: "Co-founder & Principal, LMTLS Architectural Research Studio",
    bio: "Bridging AI and architectural practice through research, teaching, and design. A graduate of MIT's Master of Architecture program, he has contributed to landmark projects at OMA, Adjaye Associates, and BIG. His work explores computational design and human-AI collaboration in studio environments.",
    instagram: "daeho_lee_0104",
    linkedin: "",
    image: juryDaeho,
    placeholder: false,
  },
];
