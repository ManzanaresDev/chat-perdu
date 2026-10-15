// lib/queries.ts
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getAd = cache((id: string) =>
  prisma.ad.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  })
);
