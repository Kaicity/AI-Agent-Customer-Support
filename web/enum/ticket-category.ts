export enum TicketCategory {
  INQUIRY = "inquiry",
  COMPLAINT = "complaint",
  TECHNICAL = "technical",
  PAYMENT = "payment",
  URGENT = "urgent",
  SPAM = "spam",
  DUPLICATE = "duplicate",
  INSUFFICIENT_INFO = "insufficient_info",
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.INQUIRY]: "Hỏi đáp thông tin",
  [TicketCategory.COMPLAINT]: "Khiếu nại",
  [TicketCategory.TECHNICAL]: "Yêu cầu kỹ thuật",
  [TicketCategory.PAYMENT]: "Yêu cầu thanh toán",
  [TicketCategory.URGENT]: "Yêu cầu khẩn cấp",
  [TicketCategory.SPAM]: "Nội dung spam",
  [TicketCategory.DUPLICATE]: "Yêu cầu trùng lặp",
  [TicketCategory.INSUFFICIENT_INFO]: "Yêu cầu thiếu thông tin",
};
