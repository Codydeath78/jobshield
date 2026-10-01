export type JobOfferDocumentKind =
  | "pdf"
  | "docx"
  | "txt";


export type JobOfferDocumentExtraction = {
  text: string;

  kind:
    JobOfferDocumentKind;

  mimeType: string;

  sizeBytes: number;

  pageCount:
    number | null;

  parser: string;

  truncated: boolean;

  warnings: string[];
};