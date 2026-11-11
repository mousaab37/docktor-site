import { defineMiddleware, sequence } from "astro:middleware";

// TEMPORARY: no login yet. Task 16 replaces this gate with real auth.
// The dashboard only exists in dev; in production it is a 404.
const dashboardGate = defineMiddleware(async (context, next) => {
  if (!context.url.pathname.startsWith("/dashboard")) return next();

  if (!import.meta.env.DEV) return new Response("Not found", { status: 404 });

  const response = await next();
  // Dashboard pages are private and must never be cached.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});

export const onRequest = sequence(dashboardGate);
