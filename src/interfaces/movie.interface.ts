interface MovieInterface {
  movie_id: number;
  title: string;
  release_date: string;
  type: string;
  author: string;
  poster: string;
  backdrop_poster: string;
  overview: string;
}

interface GroupedMoviesInterface {
  [key: string]: MovieInterface[];
}

export { MovieInterface, GroupedMoviesInterface };
