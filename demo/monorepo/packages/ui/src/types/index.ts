// UI组件库类型定义

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export type InputType = 'text' | 'email' | 'password' | 'number';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
    light: string;
    dark: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}