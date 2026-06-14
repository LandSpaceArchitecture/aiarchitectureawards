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
  { label: "Early Entry Deadline", date: "July 4, 2026" },
  { label: "Standard Entry Deadline", date: "July 16, 2026" },
  { label: "Late Entry Deadline", date: "July 30, 2026" },
  { label: "Final Submission Deadline", date: "August 4, 2026" },
  { label: "Jury Review Period", date: "August 5 – August 29, 2026" },
  { label: "Winners Announcement", date: "September 3, 2026" },
  { label: "Exhibition in London", date: "October / November 2026" },
];

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
    image: juryRada,
    placeholder: false,
  },
  {
    name: "Joshua Vermillion",
    role: "Professor of Architecture, UNLV · AI & Computational Design",
    bio: "AI & Computational Design researcher. Collaborator with Samsung, Microsoft & Architectural Digest. Behind the first AI/photography hybrid cover for Harper's BAZAAR.",
    instagram: "joshuavermillion",
    image: juryJoshua,
    placeholder: false,
  },
  {
    name: "Shweta Hingane",
    role: "Founder, The Archart Studio",
    bio: "Architect, urban planner, and founder of The Archart Studio, pioneering AI-integrated architectural graphics education.",
    instagram: "the.archart",
    image: juryShweta,
    placeholder: false,
  },
  {
    name: "Call for Jury",
    role: "Position open — apply via info@aiarchitectureawards.com",
    bio: "",
    instagram: "",
    image: "",
    placeholder: true,
  },
  {
    name: "Call for Jury",
    role: "Position open — apply via info@aiarchitectureawards.com",
    bio: "",
    instagram: "",
    image: "",
    placeholder: true,
  },
  {
    name: "Call for Jury",
    role: "Position open — apply via info@aiarchitectureawards.com",
    bio: "",
    instagram: "",
    image: "",
    placeholder: true,
  },
];
