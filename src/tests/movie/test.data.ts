import {
  MovieInterface,
  GroupedMoviesInterface,
} from 'src/interfaces/movie.interface';

const sampleMovies: { rows: MovieInterface[] } = {
  rows: [
    {
      movie_id: 1,
      title: 'sample 1',
      release_date: '2024-09-22',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
    {
      movie_id: 2,
      title: 'sample 2',
      release_date: '2024-09-24',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
    {
      movie_id: 3,
      title: 'sample 3',
      release_date: '2024-09-22',
      rating: 5,
      type: 'Comedy',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
    {
      movie_id: 4,
      title: 'sample 4',
      release_date: '2024-09-24',
      rating: 5,
      type: 'Comedy',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
  ],
};
const sampleMoviesGrouped: GroupedMoviesInterface = {
  Action: [
    {
      movie_id: 1,
      title: 'sample 1',
      release_date: '2024-09-22',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
    {
      movie_id: 2,
      title: 'sample 2',
      release_date: '2024-09-24',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
  ],
  Comedy: [
    {
      movie_id: 3,
      title: 'sample 3',
      release_date: '2024-09-22',
      rating: 5,
      type: 'Comedy',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
    {
      movie_id: 4,
      title: 'sample 4',
      release_date: '2024-09-24',
      rating: 5,
      type: 'Comedy',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
  ],
};
const sampleCategoryMovies: { rows: MovieInterface[] } = {
  rows: [
    {
      movie_id: 1,
      title: 'sample 1',
      release_date: '2024-09-22',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
    {
      movie_id: 2,
      title: 'sample 2',
      release_date: '2024-09-24',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
  ],
};

type MovieWithEmail = MovieInterface & { email: string };

const sampleSeenMovies: { rows: MovieWithEmail[] } = {
  rows: [
    {
      movie_id: 1,
      email: 'test@test.com',
      title: 'sample 1',
      release_date: '2024-09-22',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
    {
      movie_id: 2,
      email: 'test@test.com',
      title: 'sample 2',
      release_date: '2024-09-24',
      rating: 5,
      type: 'Action',
      author: '',
      poster: '',
      backdrop_poster: '',
      overview: '',
    },
  ],
};

const sampleUser = {
  email: 'test@test.com',
  username: 'testuser',
  password: 'testpassword',
  country: 'TestCountry',
  city: 'TestCity',
  street: 'TestStreet',
  creation_date: new Date(),
};

export {
  sampleMovies,
  sampleCategoryMovies,
  sampleMoviesGrouped,
  sampleSeenMovies,
  sampleUser,
};
