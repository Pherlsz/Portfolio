import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export type CtaVariant = 'primary' | 'secondary' | 'tertiary';

type CtaClassProps = {
  variant: CtaVariant;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
};

export function ctaClassName(variant: CtaVariant, className = '') {
  return ['cta', `cta-${variant}`, className].filter(Boolean).join(' ');
}

type CtaLinkProps = CtaClassProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type CtaButtonProps = CtaClassProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export function CTA(props: CtaLinkProps | CtaButtonProps) {
  const { variant, className, children, icon, ...rest } = props;
  const classes = ctaClassName(variant, className);

  if ('href' in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <a href={href} className={classes} {...anchorRest}>
        {icon}
        {children}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={buttonRest.type ?? 'button'} className={classes} {...buttonRest}>
      {icon}
      {children}
    </button>
  );
}
