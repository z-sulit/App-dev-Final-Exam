import { useEffect, useRef } from 'react';

export default function SakugaInput({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  autocomplete,
}) {
  const ref = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== (value ?? '')) {
      el.value = value ?? '';
    }
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const handleInput = () => {
      onChangeRef.current?.(el.value);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.closest('form')?.requestSubmit();
      }
    };

    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <sakuga-input
      ref={ref}
      id={id}
      name={name}
      type={type}
      label={label}
      placeholder={placeholder}
      autocomplete={autocomplete}
      disabled={disabled ? '' : undefined}
    />
  );
}
