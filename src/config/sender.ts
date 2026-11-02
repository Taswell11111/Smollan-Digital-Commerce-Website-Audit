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
  optOutNotice: `To opt out of future communications, please contact us at ${process.env.SENDER_OPTOUT_EMAIL || 'support@ecompletecommerce.com'}.`
};
