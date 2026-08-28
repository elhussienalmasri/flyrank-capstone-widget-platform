// Public marketing page at "/" — the project's actual front door,
// separate from the app's authenticated screens. Unauthenticated
// visitors land here first instead of being bounced straight to
// /register with no context.
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Subscribe',
    description: 'A simple email capture form for newsletters and mailing lists.',
  },
  {
    title: 'Sign up & Log in',
    description: 'Real visitor accounts with password verification, hashed and secure.',
  },
  {
    title: 'Call to action',
    description: 'Fully custom fields — pick exactly what you want to collect.',
  },
  {
    title: 'Popover',
    description: 'Trigger on a click, a delay, or scroll depth — your choice.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Widget Platform</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Log in</Link>
            <Link
              to="/register"
              className="bg-indigo-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-indigo-700 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
          Embeddable widgets for any website
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Create a signup form, a popup, or a lead-capture widget — get a single
          line of code to paste into any site, and watch the submissions roll in.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="bg-indigo-600 text-white text-sm font-medium rounded-md px-6 py-3 hover:bg-indigo-700 transition"
          >
            Create your first widget
          </Link>
          <Link
            to="/login"
            className="border border-gray-300 text-gray-700 text-sm font-medium rounded-md px-6 py-3 hover:bg-gray-50 transition"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">One line of code</h2>
          <p className="mt-2 text-gray-500">Paste this into any website. That's the entire integration.</p>
          <div className="mt-6 bg-gray-900 text-gray-100 text-sm rounded-lg px-4 py-3 inline-block font-mono">
            &lt;script src="https://your-domain.com/widget.js?id=abc123"&gt;&lt;/script&gt;
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-400 text-center">
          Widget Platform
        </div>
      </footer>
    </div>
  );
}
