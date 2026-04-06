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
  const translated = autoTranslateText(source, locale);
  if (node.nodeValue !== translated) {
    node.nodeValue = translated;
  }
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
      const translated = autoTranslateText(source, locale);
      if (element.getAttribute(attr) !== translated) {
        element.setAttribute(attr, translated);
      }
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

    let isApplyingTranslations = false;
    let queuedMutations: MutationRecord[] = [];
    let flushHandle: number | null = null;

    const flushMutations = () => {
      if (isApplyingTranslations) return;
      isApplyingTranslations = true;
      try {
        const toProcess = queuedMutations;
        queuedMutations = [];

        toProcess.forEach((mutation) => {
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
      } finally {
        isApplyingTranslations = false;
      }
    };

    const scheduleFlush = () => {
      if (flushHandle !== null) return;
      flushHandle = window.setTimeout(() => {
        flushHandle = null;
        flushMutations();
      }, 50);
    };

    const observer = new MutationObserver((mutations) => {
      if (isApplyingTranslations) return;

      queuedMutations.push(...mutations);
      scheduleFlush();
    });

    // Evita trabajo extra cuando estamos en idioma base.
    if (locale !== "en") {
      translateSubtree(body, locale);
      return () => {
        if (flushHandle !== null) {
          window.clearTimeout(flushHandle);
        }
      };
    }

    observer.observe(body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    translateSubtree(body, locale);

    return () => {
      if (flushHandle !== null) {
        window.clearTimeout(flushHandle);
      }
      observer.disconnect();
    };
  }, [locale]);

  return null;
}
