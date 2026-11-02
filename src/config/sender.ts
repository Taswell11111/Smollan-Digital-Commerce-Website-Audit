export interface SenderConfig {
  name: string;
  company: string;
  contactReason: string;
  optOutNotice: string;
}

export const senderConfig: SenderConfig = {
  name: 'Smollan Digital Commerce Growth Team',
  company: 'Smollan',
  contactReason: 'You are receiving this outreach following an automated public storefront technical and CRO inspection of your digital storefront.',
  optOutNotice: 'Reply STOP or ask us to remove you and we will not contact you again.'
};
