export async function loadConfig({ configServer, shop, fetchImpl = fetch }) {
  const url = `${configServer}/headless/config?shop=${encodeURIComponent(shop)}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error("config_unavailable");
  return res.json();
}
