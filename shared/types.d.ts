
export type Movie = {
  movieId: number;
  genre_ids: number[];
  original_language: string;
  overview: string;
  popularity: number;
  release_date: string;
  title: string
  video: boolean;
  vote_average: number;
  vote_count: number
}

export type Review = {
  movieId: number;
  reviewerName: string;
  reviewDate: string;
  content: string;
}