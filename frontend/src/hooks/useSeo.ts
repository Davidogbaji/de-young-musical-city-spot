import { useEffect } from "react";
import { SITE_URL } from "../config";

function setMeta(attr: "name" | "property", key: string, value: string) {
  let m = document.querySelector(`meta[${attr}="${key}"]`);
  if (!m) { m = document.createElement("meta"); m.setAttribute(attr, key); document.head.appendChild(m); }
  m.setAttribute("content", value);
}

// Sets the page title, description, social-sharing tags and canonical address.
export function useSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    setMeta("property", "og:title", title);
    setMeta("property", "og:url", SITE_URL + window.location.pathname);
    if (description) { setMeta("name", "description", description); setMeta("property", "og:description", description); }
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
    link.setAttribute("href", SITE_URL + window.location.pathname);
  }, [title, description]);
}
