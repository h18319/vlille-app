const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: Request) {
    // on forward aussi la query ?min=...
    const url = new URL(request.url);
    const min = url.searchParams.get("min");
    const upstream = `${API_URL}/stations${min ? `?min=${min}` : ""}`;

    const res = await fetch(upstream, { cache: "no-store" });
    if (!res.ok) return new Response("Upstream error", { status: 502 });

    const data = await res.json();
    return Response.json(data);
}