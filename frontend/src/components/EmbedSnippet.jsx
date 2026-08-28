// The product "wow moment": shows the one-line script tag and lets
// the owner copy it in a click, ready to paste into their site.
import { useState } from 'react';

export default function EmbedSnippet({ snippet }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
      <code className="block text-xs text-gray-700 break-all">{snippet}</code>
      <button
        onClick={handleCopy}
        className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
      >
        {copied ? 'Copied!' : 'Copy snippet'}
      </button>
    </div>
  );
}
