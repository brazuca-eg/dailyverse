export type Continent =
  "Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania";

export interface Country {
  code: string;
  name: string;
  aliases: string[];
  demonyms?: string[];
  continent: Continent;
  lat: number;
  lng: number;
}
