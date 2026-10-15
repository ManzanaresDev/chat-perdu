"use client";

import dynamic from "next/dynamic";

const AllAdsMap = dynamic(() => import("@/components/map/AllAdsMap"), {
  ssr: false,
  loading: () => <div className="h-[70dvh] animate-pulse rounded-2xl bg-cream-100" aria-hidden />,
});

export default AllAdsMap;
