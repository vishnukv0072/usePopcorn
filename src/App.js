import {useEffect, useRef, useState} from "react";
import "./index.css";
import StarRating from "./star";
import {useMovies} from "./useMovies";
import {useLocalStorageState} from "./useLocalStorageState";

const API = "f4a95b19";
const average = (arr) =>
    arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    //NOT ALLOWED
    // const [watched, setWatched] = useState(JSON.parse(localStorage.getItem("watched")));

    // const [watched, setWatched] = useState(() => {
    //     const stored = localStorage.getItem("watched");
    //     return JSON.parse(stored);
    // });

    const [watched, setWatched] = useLocalStorageState([], "watched");

    function onMovieSelect(id) {
        setSelectedId(selectedId === id ? null : id);
    }

    function handleCloseMovie() {
        setSelectedId(null);
    }

    function handleAddWatch(movie) {
        setSelectedId(null);
        setWatched((w) => [...w, movie]);
        // localStorage.setItem("watched", JSON.stringify([...watched, movie]));
    }

    function handleDeleteWatched(id) {
        setWatched((w) => w.filter((m) => m.imdbID !== id));
    }

    // useEffect(() => {
    //     localStorage.setItem("watched", JSON.stringify(watched));
    // }, [watched]);

    const {movies, isLoading, error} = useMovies(query);

    return (
        <>
            <NavBar>
                <Search query={query} setQuery={setQuery} handleCloseMovie={handleCloseMovie}/>
                <NumResults movies={movies}/>
            </NavBar>
            <Main>
                <Box>
                    {isLoading && <Loading/>}
                    {error && <Error message={error}/>}
                    {!isLoading && !error && (
                        <Movies movies={movies} onSelect={onMovieSelect}/>
                    )}
                </Box>
                <Box>
                    {selectedId ? (
                        <MovieDetails
                            selectedId={selectedId}
                            onCloseMovie={handleCloseMovie}
                            // key={selectedId}
                            onAddWatched={handleAddWatch}
                            watched={watched}
                        />
                    ) : (
                        <>
                            <WatchedSummary watched={watched}/>
                            <WatchedMoviesList
                                watched={watched}
                                onDeleteWatched={handleDeleteWatched}
                            />
                        </>
                    )}
                </Box>
            </Main>
        </>
    );
}

function MovieDetails({selectedId, onCloseMovie, onAddWatched, watched}) {
    const [movie, setMovie] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [userRating, setUserRating] = useState("");
    const isWatched = watched.map((m) => m.imdbID).includes(selectedId);

    const clickCount = useRef(0);
    const watchedUserRating = watched.find(
        (m) => m.imdbID === selectedId
    )?.imdbRating;
    const {
        Title: title,
        Year: year,
        Poster: poster,
        Runtime: runtime,
        imdbRating,
        Plot: plot,
        Released: released,
        Actors: actors,
        Director: director,
        Genre: genre,
    } = movie;

    function handleAdd() {
        const newWatched = {
            imdbID: selectedId,
            title,
            year,
            poster,
            imdbRating: Number(imdbRating),
            userRating: userRating,
            runtime: Number(runtime.split(" ").at(0)),
            countRatingDecisions: clickCount.current
        };
        onAddWatched(newWatched);
    }

    useEffect(() => {
        if (userRating) clickCount.current++;
    }, [userRating]);

    useEffect(function () {
        async function getMovieDetails() {
            setIsLoading(true);
            const res = await fetch(
                `https://www.omdbapi.com/?apikey=${API}&i=${selectedId}`
            );
            if (!res.ok) throw new Error("Something went wrong");
            const data = await res.json();
            setMovie(data);
            setIsLoading(false);
        }

        getMovieDetails();
    }, [selectedId]);

    useEffect(
        function () {
            if (!title) return;
            document.title = `Movie | ${title}`;
            return () => {
                document.title = "usePopcorn";
            }
        },
        [title]
    );

    useEffect(function () {
        function keyPress(e) {
            if (e.code === "Escape") {
                onCloseMovie();
            }
        }

        document.addEventListener("keydown", keyPress);
        return () => {
            document.removeEventListener("keydown", keyPress)
        };
    }, []);

    return isLoading ? (
        <Loading/>
    ) : (
        <>
            <div className="details">
                <header>
                    <button className="btn-back" onClick={onCloseMovie}>
                        &larr;
                    </button>
                    <img src={poster} alt={title}/>
                    <div className="details-overview">
                        <h2>{title}</h2>
                        <p>
                            {released} &bull; {runtime}
                        </p>
                        <p>{genre}</p>
                        <p>
                            <span>⭐IMDB rating</span>
                        </p>
                    </div>
                </header>
                <section>
                    <div className="rating">
                        {!isWatched ? (
                            <>
                                <StarRating
                                    maxRating={10}
                                    size={24}
                                    onSetRating={setUserRating}
                                />
                                {userRating > 0 && (
                                    <button className="btn-add" onClick={() => handleAdd()}>
                                        Add to list
                                    </button>
                                )}
                            </>
                        ) : (
                            <p>You rated this movie {watchedUserRating}⭐</p>
                        )}
                    </div>

                    <p>
                        <em>{plot}</em>
                    </p>
                    <p>Starring {actors}</p>
                    <p>Directed by {director}</p>
                </section>
            </div>
        </>
    );
}

function WatchedSummary({watched}) {
    const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
    const avgUserRating = average(watched.map((movie) => movie.userRating));
    const avgRuntime = average(watched.map((movie) => movie.runtime));

    return (
        <div className="summary">
            <h2>Movies you watched</h2>
            <div>
                <p>
                    <span>#️⃣</span>
                    <span>{watched.length} movies</span>
                </p>
                <p>
                    <span>⭐️</span>
                    <span>{avgImdbRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{avgUserRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{avgRuntime} min</span>
                </p>
            </div>
        </div>
    );
}

function WatchedMoviesList({watched, onDeleteWatched}) {
    return (
        <ul className="list">
            {watched.map((movie) => (
                <WatchedMovie
                    movie={movie}
                    key={movie.imdbID}
                    onDeleteWatched={onDeleteWatched}
                />
            ))}
        </ul>
    );
}

function WatchedMovie({movie, onDeleteWatched}) {
    return (
        <li>
            <img src={movie.poster} alt={`${movie.title} poster`}/>
            <h3>{movie.title}</h3>
            <div>
                <p>
                    <span>⭐️</span>
                    <span>{movie.imdbRating}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{movie.userRating}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{movie.runtime} min</span>
                </p>

                <button
                    className="btn-delete"
                    onClick={() => onDeleteWatched(movie.imdbID)}
                >
                    X
                </button>
            </div>
        </li>
    );
}

function NumResults({movies}) {
    return (
        <p className="num-results">
            Found <strong>{movies.length}</strong> results
        </p>
    );
}

function NavBar({children}) {
    return (
        <nav className="nav-bar">
            <Logo/>
            {children}
        </nav>
    );
}

function Main({children}) {
    return <main className="main">{children}</main>;
}

function Box({children}) {
    return <div className="box">{children}</div>;
}

function Error({message}) {
    return <p className="error">{message}</p>;
}

function Loading() {
    return <p className="loader">Loading...</p>;
}

function Movies({movies, onSelect}) {
    return (
        <ul className="list list-movies">
            {movies?.map((item, index) => (
                <Movie movie={item} key={index} onSelect={onSelect}/>
            ))}
        </ul>
    );
}

function Movie({movie, onSelect}) {
    return (
        <li className="movie" onClick={() => onSelect(movie.imdbID)}>
            <img src={movie.Poster} alt={movie.Title}/>
            <h3>{movie.Title}</h3>
            <div>
                <p>
                    <span>📅</span>
                    <span>{movie.Year}</span>
                </p>
            </div>
        </li>
    );
}

function Search({query, setQuery, handleCloseMovie}) {
    const inputElement = useRef(null);

    useEffect(() => {
        inputElement.current.focus();
    }, []);

    useEffect(() => {
        const enterPress = (e) => {
            if (document.activeElement === inputElement.current) return;
            if (e.code === "Enter") {
                inputElement.current.focus();
                setQuery("");
            }
        }
        document.addEventListener("keydown", enterPress);
        return () => document.removeEventListener("keydown", enterPress);
    }, []);

    return (
        <input
            type="text"
            className="search"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => {
                handleCloseMovie();
                setQuery(e.target.value)
            }}
            ref={inputElement}
        />
    );
}

function Logo() {
    return (
        <div className="logo">
            <span role="img">🍿</span>
            <h1>usePopcorn</h1>
        </div>
    );
}
