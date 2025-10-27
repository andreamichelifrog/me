import DrawingOverlay from "@/components/drawing_overlay";
import EmojiFloatLayer from "@/components/emoji_float_layer";
import { useTheme } from "@/lib/ThemeContext";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export const Route = createFileRoute("/host")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isDark } = useTheme();
  const [page, setPage] = useState(1);
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in inputs/textareas/contenteditable
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true";

      if (isTyping) return;

      // Optional: if page is scrolled horizontally, avoid interfering
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPage((p) => p + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      }
    };

    window.addEventListener("keydown", handler, { passive: false });

    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  useEffect(() => {
    console.log("newPage: ", page);
  }, [page]);

  return (
    <React.Fragment>
      <DrawingOverlay></DrawingOverlay>
      <EmojiFloatLayer></EmojiFloatLayer>

      <div className="flex h-dynamic justify-center items-center">
        <Document
          className={isDark ? "visible" : "hidden"}
          file="sample-dark.pdf"
        >
          <Page
            height={Math.floor(vh * 0.95)} // small margin so it doesn’t clip
            pageNumber={page}
            renderTextLayer={false} // disables text layer
            renderAnnotationLayer={false} // disables links/annotations
          />
        </Document>

        <Document className={isDark ? "hidden" : "visible"} file="sample.pdf">
          <Page
            height={Math.floor(vh * 0.95)} // small margin so it doesn’t clip
            pageNumber={page}
            renderTextLayer={false} // disables text layer
            renderAnnotationLayer={false} // disables links/annotations
          />
        </Document>
      </div>
    </React.Fragment>
  );
}
