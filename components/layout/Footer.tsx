import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="space-y-1.5">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Karavali Jobs"
                className="h-16 w-auto object-contain"
              />
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
