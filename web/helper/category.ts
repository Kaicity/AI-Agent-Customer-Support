import {
  TICKET_CATEGORY_LABELS,
  type TicketCategory,
} from "@/enum/ticket-category";

export function getCategoryLabel(category?: string | null) {
  if (!category) return "—";

  return TICKET_CATEGORY_LABELS[category as TicketCategory] ?? category;
}
