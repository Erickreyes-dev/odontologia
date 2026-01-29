import Link from "next/link";

export default function NoAcceso() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1 style={{ fontSize: "2rem", color: "#ff0000" }}>Acceso Restringido</h1>
      <p style={{ fontSize: "1.2rem" }}>
        Lo sentimos, no tienes acceso a esta página.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "#fff",
          borderRadius: "5px",
          textDecoration: "none",
        }}
      >
        Regresar al inicio
      </Link>
    </div>
  );
}
