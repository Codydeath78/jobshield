export type EmailAddressSummary = {
  name: string;
  address: string;
  domain: string | null;
};


export type EmailAuthenticationMethod =
  | "spf"
  | "dkim"
  | "dmarc";


export type EmailAuthenticationResult = {
  authservId: string | null;

  method:
    EmailAuthenticationMethod;

  result: string;
};


export type EmailHtmlLink = {
  url: string;

  targetDomain:
    string | null;

  displayText: string;

  displayedDomain:
    string | null;
};


export type EmailAttachmentSummary = {
  filename:
    string | null;

  mimeType: string;

  disposition:
    string | null;

  sizeBytes: number;
};


export type EmailFileExtraction = {
  analysisText: string;

  subject: string;

  from:
    EmailAddressSummary[];

  replyTo:
    EmailAddressSummary[];

  returnPath:
    string | null;

  returnPathDomain:
    string | null;

  deliveredTo:
    string | null;

  messageId:
    string | null;

  messageIdDomain:
    string | null;

  date:
    string | null;

  authenticationResults:
    EmailAuthenticationResult[];

  dkimSignaturePresent:
    boolean;

  receivedCount:
    number;

  fromHeaderCount:
    number;

  replyToHeaderCount:
    number;

  htmlLinks:
    EmailHtmlLink[];

  attachments:
    EmailAttachmentSummary[];

  truncated:
    boolean;

  warnings:
    string[];
};