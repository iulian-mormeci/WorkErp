import type { TaskStatus } from "@/lib/generated/prisma/enums";

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  DA_FARE: "Da fare",
  IN_CORSO: "In corso",
  COMPLETATO: "Completato",
};

export const TASK_STATUS_ORDER: TaskStatus[] = ["DA_FARE", "IN_CORSO", "COMPLETATO"];

export function nextTaskStatus(current: TaskStatus): TaskStatus {
  const index = TASK_STATUS_ORDER.indexOf(current);
  return TASK_STATUS_ORDER[(index + 1) % TASK_STATUS_ORDER.length];
}
