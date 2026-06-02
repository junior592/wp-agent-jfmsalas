#!/usr/bin/env node

/**
 * Safe WordPress REST API agent for jfmsalas.com
 *
 * Default mode: DRY RUN. It will NOT modify WordPress unless:
 * - DRY_RUN=false
 * - CONFIRM_CHANGE_SLUG=true
 *
 * Required env:
 * - WP_URL
 * - WP_USER
 * - WP_APP_PASSWORD
 *
 * Goal:
 * - Find page with slug "mi-obra"
 * - Change slug to "obra"
 * - Verify result
 * - Do not touch content, design, galleries, templates or visual structure
 */

const assertEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const WP_URL = assertEnv("WP_URL").replace(/\/+$/, "");
const WP_USER = assertEnv("WP_USER");
const WP_APP_PASSWORD = assertEnv("WP_APP_PASSWORD");

const DRY_RUN = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";
const CONFIRM_CHANGE_SLUG = String(process.env.CONFIRM_CHANGE_SLUG ?? "false").toLowerCase() === "true";

const FROM_SLUG = process.env.FROM_SLUG || "mi-obra";
const TO_SLUG = process.env.TO_SLUG || "obra";

const auth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

async function wpFetch(path, options = {}) {
  const response = await fetch(`${WP_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }

  return data;
}

async function publicCheck(path) {
  const response = await fetch(`${WP_URL}${path}`, { redirect: "manual" });
  return {
    path,
    status: response.status,
    location: response.headers.get("location"),
  };
}

async function findPageBySlug(slug) {
  return wpFetch(`/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&per_page=10`);
}

async function main() {
  console.log("WordPress safe slug agent");
  console.log(`Site: ${WP_URL}`);
  console.log(`Goal: /${FROM_SLUG}/ -> /${TO_SLUG}/`);
  console.log(`DRY_RUN=${DRY_RUN}`);
  console.log(`CONFIRM_CHANGE_SLUG=${CONFIRM_CHANGE_SLUG}`);

  const pages = await findPageBySlug(FROM_SLUG);

  if (!Array.isArray(pages) || pages.length === 0) {
    const already = await findPageBySlug(TO_SLUG);
    if (Array.isArray(already) && already.length > 0) {
      console.log(`Page with slug "${FROM_SLUG}" not found, but "${TO_SLUG}" already exists.`);
      console.log(JSON.stringify(already.map(p => ({ id: p.id, slug: p.slug, link: p.link, title: p.title?.rendered })), null, 2));
      return;
    }
    throw new Error(`No public page found with slug "${FROM_SLUG}".`);
  }

  if (pages.length > 1) {
    throw new Error(`More than one page found with slug "${FROM_SLUG}". Refusing to continue.`);
  }

  const page = pages[0];
  console.log("Found page:");
  console.log(JSON.stringify({
    id: page.id,
    slug: page.slug,
    link: page.link,
    title: page.title?.rendered,
    status: page.status,
    type: page.type,
  }, null, 2));

  const existingTarget = await findPageBySlug(TO_SLUG);
  if (Array.isArray(existingTarget) && existingTarget.length > 0) {
    throw new Error(`Target slug "${TO_SLUG}" already exists. Refusing to overwrite or create conflict.`);
  }

  if (DRY_RUN || !CONFIRM_CHANGE_SLUG) {
    console.log("Safe stop: no changes made.");
    console.log("To execute later, set DRY_RUN=false and CONFIRM_CHANGE_SLUG=true.");
  } else {
    console.log(`Changing slug for page ${page.id}: "${FROM_SLUG}" -> "${TO_SLUG}"`);
    const updated = await wpFetch(`/wp-json/wp/v2/pages/${page.id}`, {
      method: "POST",
      body: JSON.stringify({ slug: TO_SLUG }),
    });

    console.log("Updated page:");
    console.log(JSON.stringify({
      id: updated.id,
      slug: updated.slug,
      link: updated.link,
      title: updated.title?.rendered,
    }, null, 2));
  }

  const afterTarget = await findPageBySlug(TO_SLUG);
  console.log(`Verification query for slug "${TO_SLUG}":`);
  console.log(JSON.stringify(afterTarget.map(p => ({
    id: p.id,
    slug: p.slug,
    link: p.link,
    title: p.title?.rendered,
  })), null, 2));

  console.log("Public URL checks:");
  console.log(JSON.stringify({
    oldUrl: await publicCheck(`/${FROM_SLUG}/`),
    newUrl: await publicCheck(`/${TO_SLUG}/`),
  }, null, 2));

  console.log("This script changes only the page slug. It does not edit design, text, galleries or templates.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
