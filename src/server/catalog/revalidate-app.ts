async function postRevalidation() {
  const appUrl = process.env.APP_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!appUrl || !secret) {
    throw new Error("APP_URL or REVALIDATE_SECRET is not set");
  }

  const response = await fetch(new URL("/api/revalidate", appUrl), {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    throw new Error(`${appUrl} answered with status ${response.status}`);
  }
  return appUrl;
}

export async function revalidateApp() {
  try {
    const appUrl = await postRevalidation();
    console.log(`Revalidated the cached pages of ${appUrl}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `The data WAS written to the database, but the app's cached pages were NOT refreshed (${reason}). Fix the cause and revalidate the app, or its pages keep the old data until the next build.`,
    );
    process.exitCode = 1;
  }
}
