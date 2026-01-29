"use client";;
import { Button } from "@/components/ui/button"; // Botón de ShadCN
import { useEffect, useState } from "react";
import { MoonIcon } from "./ui/moon"; // Icono de luna
import { SunMediumIcon } from "./ui/sun-medium";

export default function ToggleThemeButton() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Al cargar, verifica el tema almacenado en localStorage o usa el tema del sistema
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    const initialTheme = storedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  // Cambiar tema y actualizar localStorage
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {theme === "light" ? (
        <MoonIcon size={16} />
      ) : (
        <SunMediumIcon size={16} />
      )}
      <span className="sr-only">Tema</span>
    </Button>
  );
}
