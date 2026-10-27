/**
 * Site-wide promo content.
 *
 * Kept apart from components so campaign copy can be changed without touching
 * any JSX. Set `text` to null to hide the bar entirely (it collapses and the
 * header shrinks to suit).
 */
export interface Announcement {
  /** Short headline. Keep under ~30 characters so it fits beside the
   *  Client Login button at 360px without truncating. */
  text: string;
  /** Where the bar links to. */
  to: string;
  /** Optional trailing flourish after the text, e.g. "Limited slots". */
  note?: string;
}

export const announcement: Announcement | null = {
  text: 'Free 30-min brand audit',
  to: '/start-a-project',
};