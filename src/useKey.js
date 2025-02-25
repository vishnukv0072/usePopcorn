import {useEffect} from "react";

export function useKey(key, onKeyPress) {
  useEffect(function () {
    function keyPress(e) {
      if (e.code.toLowerCase() === key.toLowerCase()) {
        onKeyPress();
      }
    }

    document.addEventListener("keydown", keyPress);
    return () => {
      document.removeEventListener("keydown", keyPress)
    };
  }, []);
}