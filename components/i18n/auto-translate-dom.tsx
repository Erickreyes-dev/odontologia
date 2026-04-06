"use client";

import { useEffect } from "react";
import { useI18n } from "./i18n-provider";
import { autoTranslateText } from "@/lib/i18n/auto-translate";

const originalTextNodeMap = new WeakMap<Text, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();
const ATTRS_TO_TRANSLATE = ["placeholder", "title", "aria-label"];

function shouldSkipNode(textNode: Text): boolean {
  const parent = textNode.parentElement;
  if (!parent) return true;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"].includes(parent.tagName)) return true;
  if (parent.closest("[data-no-auto-translate='true']")) return true;
  if (parent.isContentEditable) return true;
  return false;
}

function translateTextNode(node: Text, locale: "es" | "en") {
  if (shouldSkipNode(node)) return;

  if (!originalTextNodeMap.has(node)) {
    originalTextNodeMap.set(node, node.nodeValue ?? "");
  }

  const source = originalTextNodeMap.get(node) ?? "";
  node.nodeValue = autoTranslateText(source, locale);
}

function translateElementAttrs(element: Element, locale: "es" | "en") {
  const htmlElement = element as HTMLElement;
  if (htmlElement.closest("[data-no-auto-translate='true']")) return;

  let attrStore = originalAttrMap.get(element);
  if (!attrStore) {
    attrStore = {};
    ATTRS_TO_TRANSLATE.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (value !== null) {
        attrStore![attr] = value;
      }
    });
    originalAttrMap.set(element, attrStore);
  }

  ATTRS_TO_TRANSLATE.forEach((attr) => {
    const source = attrStore?.[attr];
    if (typeof source === "string") {
      element.setAttribute(attr, autoTranslateText(source, locale));
    }
  });
}

function translateSubtree(root: ParentNode, locale: "es" | "en") {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    translateTextNode(current as Text, locale);
    current = walker.nextNode();
  }

  if (root instanceof Element) {
    translateElementAttrs(root, locale);
  }

  if ("querySelectorAll" in root) {
    (root as ParentNode & { querySelectorAll: (selectors: string) => NodeListOf<Element> })
      .querySelectorAll("*")
      .forEach((element) => translateElementAttrs(element, locale));
  }
}

export function AutoTranslateDOM() {
  const { locale } = useI18n();

  useEffect(() => {
    const body = document.body;
    if (!body) return;

    translateSubtree(body, locale);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData" && mutation.target instanceof Text) {
          translateTextNode(mutation.target, locale);
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof Text) {
            translateTextNode(node, locale);
          }
          if (node instanceof Element) {
            translateSubtree(node, locale);
          }
        });
      });
    });

    observer.observe(body, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ATTRS_TO_TRANSLATE,
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
