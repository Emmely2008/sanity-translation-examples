export default function preview(req, res) {
  const corsOrigin = `http://localhost:3333`;

  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Fetch the preview-page's HTML and return in an object
  if (req?.query?.fetch === "true") {
    return res.status(200).json({});
  }

  if (!req?.query?.secret) {
    return res.status(401).json({ message: `No secret token ${req.method}` });
  }

  // Check the secret and next parameters
  // This secret should only be known to this API route and the CMS

  if (req.query.secret !== process.env.SANITY_PREVIEW_SECRET) {
    return res.status(401).json({
      message: `Invalid secret token`,
    });
  }

  if (!req.query.slug) {
    return res.status(401).json({ message: "No slug" });
  }

  // Enable Preview Mode by setting the cookies
  res.setPreviewData({});

  // Redirect to the path from the fetched post
  // We don't redirect to req.query.slug as that might lead to open redirect vulnerabilities
  res.writeHead(307, { Location: `/${req?.query?.slug}` ?? `/` });

  return res.end();
}
