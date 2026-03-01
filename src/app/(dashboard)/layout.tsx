import React from 'react';

// This layout has been moved to src/app/dashboard/layout.tsx to resolve a routing conflict.
// The active layout can now be found there.
export default function DeprecatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
