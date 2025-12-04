// Queue names
export const Queues = {
  PDF_EXPORT: 'pdf-export',
  CSV_IMPORT: 'csv-import',
  EMAIL_SEND: 'email-send',
  REPORT_GENERATION: 'report-generation',
  IMAGE_RESIZE: 'image-resize',
  NOTIFICATIONS: 'notifications',
} as const;

// Job types
export const JobTypes = {
  // PDF
  PDF_EXPORT_INVOICES: 'pdf.export.invoices',
  PDF_EXPORT_REPORT: 'pdf.export.report',

  // CSV
  CSV_IMPORT_PRODUCTS: 'csv.import.products',
  CSV_IMPORT_USERS: 'csv.import.users',

  // Email
  EMAIL_SEND_WELCOME: 'email.send.welcome',
  EMAIL_SEND_INVOICE: 'email.send.invoice',

  // Report
  REPORT_DAILY: 'report.daily',
  REPORT_MONTHLY: 'report.monthly',

  // Image
  IMAGE_RESIZE_THUMBNAIL: 'image.resize.thumbnail',

  // Notifications
  NOTIFY_PUSH: 'notify.push',
  NOTIFY_WEBSOCKET: 'notify.websocket',
} as const;

export type QueueName = typeof Queues[keyof typeof Queues];
export type JobType = typeof JobTypes[keyof typeof JobTypes];
