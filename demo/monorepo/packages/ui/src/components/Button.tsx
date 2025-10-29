import React from 'react';

// 简单的首字母大写函数
const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  className = ''
}) => {
  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const disabledClass = disabled ? 'btn-disabled' : '';
  
  const classes = [baseClasses, variantClass, sizeClass, disabledClass, className]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={handleClick}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {typeof children === 'string' ? capitalize(children) : children}
    </button>
  );
};