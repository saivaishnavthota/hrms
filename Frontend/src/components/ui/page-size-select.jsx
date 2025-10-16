import React from 'react';

/**
 * Page Size Select (Show dropdown)
 * Renders a right-aligned dropdown to choose page size.
 * Defaults to options [10, 20, 30, 40, 50].
 */
export function PageSizeSelect({
  pageSize = 10,
  onChange,
  options = [10, 20, 30, 40, 50],
  className = '',
  label = 'Show'
}) {
  const handleChange = (event) => {
    const newSize = parseInt(event.target.value);
    if (onChange) onChange(newSize);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="pageSizeSelect" className="text-sm text-gray-600">
        {label}:
      </label>
      <select
        id="pageSizeSelect"
        value={pageSize}
        onChange={handleChange}
        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PageSizeSelect;