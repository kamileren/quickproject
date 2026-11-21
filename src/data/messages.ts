/**
 * A tiny invented inbox for the Naive Bayes chapter: thirty-four short
 * messages, fourteen of them spam. Small enough that every count in the
 * chapter can be checked by reading the list.
 */
export interface Message {
  text: string;
  /** 1 for spam, 0 for a normal message. */
  spam: number;
}

const SPAM = [
  'win a free prize now',
  'free money click now',
  'you win cash prize click here',
  'claim your free prize today',
  'free offer click here now',
  'win money now free entry',
  'urgent claim your cash prize',
  'free free free click to win',
  'special offer for you click now',
  'you have won a free holiday claim now',
  'cheap loans free money today',
  'click here to claim your offer',
  'win a free phone today',
  'urgent your account needs money now click here',
];

const NORMAL = [
  'are you free for lunch tomorrow',
  'meeting moved to tomorrow morning',
  'thanks for the report',
  'can you call me after the meeting',
  'lunch at noon today',
  'the project report is ready',
  'see you at home tonight',
  'thanks for lunch today',
  'please review the project plan',
  'call me when you are home',
  'meeting notes are in the report',
  'are you coming to the meeting tomorrow',
  'dinner at home tonight',
  'i will send the report tomorrow',
  'can we move the call to friday',
  'thanks see you tomorrow',
  'here is the plan for the project',
  'your order is ready for collection today',
  'do you have time for a call now',
  'happy birthday see you tonight',
];

export const messages: Message[] = [...SPAM.map((text) => ({ text, spam: 1 })), ...NORMAL.map((text) => ({ text, spam: 0 }))];

/** Splits a message into lower-case words, dropping punctuation. */
export const tokenize = (text: string): string[] => text.toLowerCase().match(/[a-z']+/g) ?? [];

export const messageTokens: string[][] = messages.map((m) => tokenize(m.text));
export const messageLabels: number[] = messages.map((m) => m.spam);
