export type SampleEmail = {
  id: string;
  title: string;
  blurb: string;
  subject: string;
  body: string;
  tone: "spam" | "ham";
};

export const SAMPLE_EMAILS: SampleEmail[] = [
  {
    id: "phishing",
    title: "Phishing bank email",
    blurb: "Locked account + verify link",
    tone: "spam",
    subject: "Urgent: Your Chase account is locked",
    body: "We detected unusual activity on your Chase account. Verify your account immediately or it will be suspended. Click here to restore access: http://chase-secure-login.xyz/verify Enter your password and SSN. Act now — this is a final notice.",
  },
  {
    id: "recruiter",
    title: "Recruiter email",
    blurb: "A real intro, no fee",
    tone: "ham",
    subject: "Frontend role at Northwind — intro",
    body: "Hi, I came across your portfolio and thought you'd be a fit for a staff frontend role on our design systems team. Would you have 20 minutes Thursday to chat? No take-home until after the intro. Best, Mara Chen, recruiting.",
  },
  {
    id: "newsletter",
    title: "Newsletter",
    blurb: "Opt-in product digest",
    tone: "ham",
    subject: "InboxGuard digest — what shipped in March",
    body: "Here's what we shipped this month: tighter false-positive handling, a new reasons panel, and mobile layout fixes. Read the notes on our blog. You're receiving this because you subscribed. Unsubscribe anytime.",
  },
  {
    id: "prize",
    title: "Prize scam",
    blurb: "Lottery + gift cards",
    tone: "spam",
    subject: "CONGRATULATIONS YOU WON $2,500,000",
    body: "You have been selected as a winner of the international lottery. To claim your prize send a processing fee via gift cards. Act now limited time. Reply with your full name and bank details.",
  },
  {
    id: "notes",
    title: "Meeting notes",
    blurb: "Tuesday sync follow-up",
    tone: "ham",
    subject: "Notes from Tuesday sync",
    body: "Thanks for joining. Action items: Alex will send the Figma link, I'll update the timeline, and we'll reconvene Friday 10am. Let me know if I missed anything.",
  },
];
