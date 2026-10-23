import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl font-black text-brand-neon neon-text-glow">404</div>
          <h2 className="text-xl font-bold">Page Not Found</h2>
          <p className="text-xs text-slate-400">
            The spare part or page you are looking for does not exist or has been moved.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block bg-brand-neon hover:bg-brand-neon-hover text-black font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-brand-neon/20 transition-all"
            >
              Return to ShiftLK Spares Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
