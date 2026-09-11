"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import type { WidgetType } from "@/lib/generated/prisma/enums";

export type WidgetLayoutInput = { tipoWidget: WidgetType; x: number; y: number; w: number; h: number };

export async function saveDashboardLayout(items: WidgetLayoutInput[]) {
  const user = await requireUser();

  await prisma.$transaction(
    items.map((item) =>
      prisma.dashboardWidgetLayout.upsert({
        where: { userId_tipoWidget: { userId: user.id, tipoWidget: item.tipoWidget } },
        create: { userId: user.id, tipoWidget: item.tipoWidget, x: item.x, y: item.y, w: item.w, h: item.h },
        update: { x: item.x, y: item.y, w: item.w, h: item.h },
      })
    )
  );
}
