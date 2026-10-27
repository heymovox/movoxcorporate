/**
 * TESTIMONIAL DATA — SAMPLE ENTRIES.
 *
 * These quotes are placeholders pending verified client consent.
 * Before publishing: replace each entry with a real client quote,
 * confirmed name, title, and written permission to publish.
 * Never present unverified quotes as real client testimonials.
 */
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  project: string;
  isSample: boolean;
}

export const testimonials: Testimonial[] = [];
