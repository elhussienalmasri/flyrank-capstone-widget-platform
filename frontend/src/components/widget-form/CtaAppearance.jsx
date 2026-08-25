// CTA-only appearance setting: the accent color used for the
// widget's banner background and its submit button.
export default function CtaAppearance({ displayOptions, onChange }) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Appearance</h3>
      <label className="flex items-center gap-3 text-sm text-gray-700">
        Banner color
        <input
          type="color"
          name="accentColor"
          value={displayOptions.accentColor}
          onChange={onChange}
          className="h-8 w-14 rounded border border-gray-300 cursor-pointer"
        />
      </label>
    </div>
  );
}
