export type Emotion = {
  maori: string;
  english: string;
  hint: string;
};

export const EMOTIONS: Emotion[] = [
  { maori: "Harikoa", english: "Happy", hint: "Show me a big smile and bright eyes!" },
  { maori: "Pōuri", english: "Sad", hint: "Maybe a little pout or some pretend tears?" },
  { maori: "Riri", english: "Angry", hint: "Cross those arms and show me a grumpy scowl!" },
  { maori: "Ohorere", english: "Surprised", hint: "Wide eyes and a big 'O' with your mouth!" },
  { maori: "Mataku", english: "Scared", hint: "Peeking through your fingers or hiding away!" },
  { maori: "Whakamā", english: "Shy", hint: "A little blush and looking down at the ground!" },
];

export type GameState = 'idle' | 'showingWord' | 'acting' | 'analyzing' | 'result';

export interface FeedbackData {
  isMatch: boolean;
  identifiedEmotion: string;
  message: string;
}
