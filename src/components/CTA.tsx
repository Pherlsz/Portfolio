import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export type CtaVariant = 'primary' | 'secondary' | 'tertiary';

type CtaShared = {
  variant: CtaVariant;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
};

type CtaLinkProps = CtaShared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
    href: string;
  };

type CtaButtonProps = CtaShared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    href?: undefined;
  };

// shortcut: primary/secondary/tertiary share one underlined look, split them if a filled control returns
export function ctaClassName(variant: CtaVariant, className = '') {
  return ['cta', `cta-${variant}`, className].filter(Boolean).join(' ');
}

export function CTA(props: CtaLinkProps | CtaButtonProps) {
  if (props.href !== undefined) {
    const { variant, className, children, icon, href, ...anchorRest } = props;
    return (
      <a href={href} className={ctaClassName(variant, className)} {...anchorRest}>
        {icon}
        {children}
      </a>
    );
  }

  const { variant, className, children, icon, ...buttonRest } = props;
  return (
    <button type={buttonRest.type ?? 'button'} className={ctaClassName(variant, className)} {...buttonRest}>
      {icon}
      {children}
    </button>
  );
}
