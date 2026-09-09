export const JOB_STATUSES = [
  "da_pianificare",
  "programmato",
  "in_corso",
  "completato",
  "annullato",
] as const;

export const JOB_STATUS_LABEL: Record<(typeof JOB_STATUSES)[number], string> = {
  da_pianificare: "Da pianificare",
  programmato: "Programmato",
  in_corso: "In corso",
  completato: "Completato",
  annullato: "Annullato",
};

export function jobStatusLabel(stato: string) {
  return JOB_STATUS_LABEL[stato as (typeof JOB_STATUSES)[number]] ?? stato;
}
