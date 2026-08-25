// Popover-only settings: how the popup should open — a manual
// button click (default), after a time delay, or once the visitor
// scrolls past a given depth. Only rendered for type === 'popover'.
import FormField, { inputClass } from '../FormField';

export default function PopoverTriggerSettings({ displayOptions, onChange }) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Popover trigger</h3>

      <FormField label="Show the popover">
        <select
          name="trigger"
          value={displayOptions.trigger}
          onChange={onChange}
          className={inputClass}
        >
          <option value="click">Only when a button is clicked</option>
          <option value="delay">After a time delay</option>
          <option value="scroll">After the visitor scrolls down</option>
        </select>
      </FormField>

      {displayOptions.trigger === 'delay' && (
        <FormField label="Delay (seconds)">
          <input
            type="number"
            min="1"
            name="delaySeconds"
            value={displayOptions.delaySeconds}
            onChange={onChange}
            className={inputClass}
          />
        </FormField>
      )}

      {displayOptions.trigger === 'scroll' && (
        <FormField label="Scroll depth (% of page, 50 = middle)">
          <input
            type="number"
            min="1"
            max="100"
            name="scrollPercent"
            value={displayOptions.scrollPercent}
            onChange={onChange}
            className={inputClass}
          />
        </FormField>
      )}

      <p className="text-xs text-gray-500">
        A manual trigger (a button with <code>data-widget-open</code>, or <code>WidgetPlatform.open()</code>)
        always works too, regardless of this setting.
      </p>
    </div>
  );
}
