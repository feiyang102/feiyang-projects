import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  className?: string;
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  footer,
  className = '',
  shadow = true
}) => {
  const baseClasses = 'card';
  const shadowClass = shadow ? 'card-shadow' : '';
  
  const classes = [baseClasses, shadowClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};