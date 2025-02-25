import {useEffect, useState} from "react";

const API = "f4a95b19";
export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchData() {
        setIsLoading(true);
        setError("");
        try {
          const response = await fetch(
            `https://www.omdbapi.com/?apikey=${API}&s=${query}`, {signal: controller.signal}
          );
          if (!response.ok) {
            throw new Error("Something went wrong");
          }
          const data = await response.json();

          if (data.Response === "False") {
            throw new Error("Movie not found");
          }
          setMovies(data.Search);
        } catch (e) {
          const error = e instanceof Error ? e.message : "Something went wrong";
          setError(error);
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }

      fetchData();
      return () => {
        controller.abort()
      };
    },
    [query]
  );

  return {movies, isLoading, error}
}