// ./web/pages/[slug].js
import Link from "next/link";
import Head from "next/head";

import React from "react";
import { groq } from "next-sanity";

import { usePreviewSubscription } from "../lib/sanity";
import { getClient } from "../lib/sanity.server";

/**
 * Helper function to return the correct version of the document
 * If we're in "preview mode" and have multiple documents, return the draft
 */
function filterDataToSingleItem(data, preview) {
  if (!Array.isArray(data)) return data;

  return data.length > 1 && preview
    ? data.filter((item) => item._id.startsWith(`drafts.`)).slice(-1)[0]
    : data.slice(-1)[0];
}

/**
 * Makes Next.js aware of all the slugs it can expect at this route
 *
 * See how we've mapped over our found slugs to add a `/` character?
 * Idea: Add these in Sanity and enforce them with validation rules :)
 * https://www.simeongriggs.dev/nextjs-sanity-slug-patterns
 */
export async function getStaticPaths() {
  const allSlugsQuery = groq`*[defined(slug.current)][].slug.current`;
  const pages = await getClient().fetch(allSlugsQuery);

  return {
    paths: pages.map((slug) => `/${slug}`),
    fallback: true,
  };
}

/**
 * Fetch the data from Sanity based on the current slug
 *
 * Important: You _could_ query for just one document, like this:
 * *[slug.current == $slug][0]
 * But that won't return a draft document!
 * And you get a better editing experience
 * fetching draft/preview content server-side
 *
 * Also: Ignore the `preview = false` param!
 * It's set by Next.js "Preview Mode"
 * It does not need to be set or changed here
 */
export async function getStaticProps({ params, preview = true }) {
  const query = groq`*[_type == "article" && slug.current == $slug]`;
  const queryParams = { slug: params.slug };
  const data = await getClient(preview).fetch(query, queryParams);

  // Escape hatch, if our query failed to return data
  if (!data) return { notFound: true };

  // Helper function to reduce all returned documents down to just one
  const page = filterDataToSingleItem(data, preview);

  return {
    props: {
      // Pass down the "preview mode" boolean to the client-side
      preview,
      // Pass down the initial content, and our query
      data: { page, query, queryParams },
    },
  };
}

/**
 * The `usePreviewSubscription` takes care of updating
 * the preview content on the client-side
 */
export default function Page({ data, preview }) {
  const { data: previewData } = usePreviewSubscription(data?.query, {
    params: data?.queryParams ?? {},
    // The hook will return this on first render
    // This is why it's important to fetch *draft* content server-side!
    initialData: data?.page,
    // The passed-down preview context determines whether this function does anything
    enabled: preview,
  });

  // Client-side uses the same query, so we may need to filter it down again
  const page = filterDataToSingleItem(previewData, preview);

  // Notice the optional?.chaining conditionals wrapping every piece of content?
  // This is extremely important as you can't ever rely on a single field
  // of data existing when Editors are creating new documents.
  // It'll be completely blank when they start!
  return (
    <div style={{ maxWidth: `20rem`, padding: `1rem` }} data-content="main">
      <Head>
        <meta
          name="description"
          content="Meta description content goes here."
        />
      </Head>
      {page?.title && <h1>{page.title.en_GB}</h1>}
      {page?.content && <p>{page.content.en_GB}</p>}
      <p>
        When you start a sentence with ‘as a result’, your reader will
        immediately know two things: What happened in the first sentence caused
        something; The second sentence is going to describe the effect. By using
        the phrase ‘as a result’ here, you show that the two separate sentences
        are part of one process. Without having even read the rest of the
        sentence, your reader can already guess what’s coming. In a way,
        transition words are the glue that holds your text together. Without
        them, your text is a collection of sentences. With them, the individual
        parts come together to form one whole. Transition words don’t always
        have to be placed at the beginning of a sentence. Consider the following
        examples.
      </p>
      {preview && <Link href="/api/exit-preview">Preview Mode Activated!</Link>}
    </div>
  );
}
