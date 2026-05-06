import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function ControlSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  inlineMenu = true,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, []);

  return (
    <div
      className={`control-select ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${inlineMenu ? 'is-inline-menu' : ''}`}
      ref={rootRef}
    >
      {label && <label className="control-select-label">{label}</label>}
      <button
        type="button"
        className="control-select-trigger"
        onClick={() => !disabled && setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="control-select-value">{selected?.label || placeholder}</span>
        <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
      </button>

      {open && (
        <div className="control-select-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`control-select-option ${option.value === value ? 'is-selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.description && <small>{option.description}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
