export async function customerQuery({ graphqlEndpoint, accessToken, query, variables, fetchImpl = fetch }) {
  const res = await fetchImpl(graphqlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": accessToken },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error("graphql_request_failed");
  const { data, errors } = await res.json();
  if (errors?.length) throw Object.assign(new Error("graphql_errors"), { errors });
  return data;
}
