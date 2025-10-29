import React from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  error = '',
  label = '',
  className = ''
}) => {
  const baseClasses = 'input';
  const errorClass = error ? 'input-error' : '';
  const disabledClass = disabled ? 'input-disabled' : '';
  
  const classes = [baseClasses, errorClass, disabledClass, className]
    .filter(Boolean)
    .join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={classes}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};