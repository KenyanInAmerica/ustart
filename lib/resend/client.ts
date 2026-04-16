// Singleton Resend client. Server-side only — never import this in client components.
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
