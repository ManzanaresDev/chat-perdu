"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-cream-100" aria-hidden />,
});

export default MapView;
