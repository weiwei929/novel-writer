export interface ProjectOutline {
  premise: string;
  acts: {
    title: string;
    chapters: {
      title: string;
      beats: string[];
    }[];
  }[];
}
