
'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { usePageLoader } from '@/hooks/use-page-loader';
import React from 'react';

interface TransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const TransitionLink = React.forwardRef<HTMLAnchorElement, TransitionLinkProps>(
    ({ href, children, className, onClick, ...props }, ref) => {
    const router = useRouter();
    const { showLoader } = usePageLoader();
    const pathname = usePathname();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(e);
      }

      const targetPath = href.toString();
      // Don't trigger for hash links on the same page or external links
      if (
        targetPath.startsWith('#') ||
        targetPath.startsWith('http') ||
        targetPath.startsWith('mailto:') ||
        targetPath.startsWith('tel:')
      ) {
        return;
      }

      // Compare just the pathname part, ignore query params and hash
      if (pathname === targetPath.split('?')[0].split('#')[0]) {
        return;
      }
      
      e.preventDefault();
      showLoader();
      router.push(targetPath);
    };

    return (
      <Link href={href} onClick={handleClick} className={className} ref={ref} {...props}>
        {children}
      </Link>
    );
});

TransitionLink.displayName = 'TransitionLink';
