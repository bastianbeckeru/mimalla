export async function revalidateApp() {
  const appUrl = process.env.APP_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!appUrl || !secret) {
    console.warn(
      "APP_URL or REVALIDATE_SECRET is not set, so the app's cached pages were not revalidated",
    );
    return;
  }

  const response = await fetch(new URL("/api/revalidate", appUrl), {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    throw new Error(
      `Revalidating ${appUrl} failed with status ${response.status}`,
    );
  }
  console.log(`Revalidated the cached pages of ${appUrl}`);
}
