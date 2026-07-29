import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-black rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-black">Karavali Jobs</span>
            </div>
            <p className="text-[11px] text-neutral-400 max-w-xs">
              Hyper-local job board for Udupi & Mangalore. Find and post jobs in the Karavali region.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy-policy" className="text-[11px] text-neutral-500 hover:text-black transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[11px] text-neutral-500 hover:text-black transition-colors">
              Terms
            </Link>
            <Link href="/about" className="text-[11px] text-neutral-500 hover:text-black transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-[11px] text-neutral-500 hover:text-black transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        <div className="border-t border-neutral-100 mt-6 pt-4">
          <p className="text-[11px] text-neutral-400">
            &copy; {new Date().getFullYear()} Karavali Jobs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
