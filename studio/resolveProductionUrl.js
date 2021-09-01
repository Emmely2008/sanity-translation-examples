export default function resolveProductionUrl(document) {
  return `https://localhost:3000/${document.slug.current}`;
}
