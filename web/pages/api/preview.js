// ./pages/api/preview.js

// ... CORS enabled stuff, res.setPreviewData, etc

// Fetch the preview-page's HTML and return in an object
if (req?.query?.fetch === "true") {
  const proto = process.env.NODE_ENV === "development" ? `http://` : `https://`;
  const host = req.headers.host;
  const pathname = req?.query?.slug ?? `/`;
  const absoluteUrl = new URL(`${proto}${host}${pathname}`).toString();

  const previewHtml = await fetch(absoluteUrl, {
    credentials: `include`,
    headers: { Cookie: req.headers.cookie },
  })
    .then((previewRes) => previewRes.text())
    .catch((err) => console.error(err));

  return res.send(previewHtml);
}
