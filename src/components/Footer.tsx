import { Link } from "react-router-dom";
import { Award, Instagram, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-black bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2">
              <Award className="h-8 w-8" />
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold tracking-tighter uppercase">AI Architecture</span>
                <span className="text-[10px] font-medium tracking-widest uppercase text-gray-500">Awards 2026</span>
              </div>
            </Link>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-gray-500">
              The premier global design award celebrating the future of AI-driven architecture, landscape, urban, and interior design. Join the second edition of the most innovative competition in the field.
            </p>
            <div className="mt-8 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-black"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-black"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-black"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-black"><Mail className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-black">Platform</h3>
            <ul className="mt-6 space-y-4">
              <li><Link to="/categories" className="text-sm text-gray-500 hover:text-black">Categories</Link></li>
              <li><Link to="/submit" className="text-sm text-gray-500 hover:text-black">Submit Project</Link></li>
              <li><Link to="/admin" className="text-sm text-gray-500 hover:text-black">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-black">Support</h3>
            <ul className="mt-6 space-y-4">
              <li><a href="#" className="text-sm text-gray-500 hover:text-black">FAQ</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black">Terms & Conditions</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-100 pt-8 text-center md:text-left">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
            © 2026 AI Architecture Awards. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
