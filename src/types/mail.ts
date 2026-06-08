export type MailFolder   = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'trash' | 'spam';
export type MailCategory = 'primary' | 'social' | 'promotions' | 'updates';

export interface ThreadMessage {
  id:            string;
  senderName:    string;
  senderAddress: string;
  body:          string;
  date:          string;
  time:          string;
  isMe:          boolean;
}

export interface EmailItem {
  id:             string;
  senderName:     string;
  senderAddress:  string;
  subject:        string;
  snippet:        string;
  body:           string;
  date:           string;
  time:           string;
  starred:        boolean;
  important:      boolean;
  read:           boolean;
  folder:         MailFolder;
  category:       MailCategory;
  snoozedUntil?:  string;
  threadMessages: ThreadMessage[];
}
