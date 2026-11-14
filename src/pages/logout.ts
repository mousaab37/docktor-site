import type { APIRoute } from "astro";

// POST only. The middleware has already created the session client for this path.
export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.supabase?.auth.signOut();
  return redirect("/login", 303);
};

// Any other method (GET, PUT, ...) is refused.
export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
