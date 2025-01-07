// src/emoji.interface.ts

export interface Emoji {
  name: string;
  unified: string;
  non_qualified: string | null;
  docomo: string | null;
  au: string | null;
  softbank: string | null;
  google: string;
  image: string;
  sheet_x: number;
  sheet_y: number;
  short_name: string;
  short_names: string[];
  text: string | null;
  texts: string[] | null;
  category: string;
  sort_order: number;
  added_in: string;
  obsoleted_by?: string | null; // Optional gemacht, um undefined zu erlauben
}
