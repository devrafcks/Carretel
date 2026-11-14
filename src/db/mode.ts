/** Modo do banco sem expor a conexão crua. */
export function dbMode(): "neon" | "local" {
  return process.env.DATABASE_URL ? "neon" : "local";
}
