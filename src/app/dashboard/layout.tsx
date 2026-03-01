import React from 'react';

// This layout has been deprecated to resolve a routing conflict.
// The active layout can be found in src/app/(dashboard)/layout.tsx.
export default function DeprecatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is intentionally minimal to avoid conflicts with the correct layout.
  return <>{children}</>;
}
