import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0C4A6E 0%, #0369A1 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
          padding: "48px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.1 }}>MediSoftCore</div>
        <div style={{ fontSize: 42, marginTop: 24, color: "#E0F2FE" }}>
          Plataforma de gestión clínica
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
