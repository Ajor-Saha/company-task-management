"use client";

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

// Define the ref type for the RichTextEditor component
export type RichTextEditorHandle = {
  getContent: () => string;
};

const RichTextEditor = forwardRef<RichTextEditorHandle>((_, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    // Only create a new Quill instance if one doesn’t already exist
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
        },
        placeholder: "Write something...",
      });
    }

    // Cleanup function to remove Quill DOM elements and reset the ref
    return () => {
      if (editorRef.current && quillRef.current) {
        editorRef.current.innerHTML = ""; // Clear the editor’s DOM content
        quillRef.current = null; // Reset the Quill reference
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount/unmount

  // Expose the getContent function to the parent component
  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (quillRef.current) {
        return quillRef.current.root.innerHTML; // Return the HTML content
      }
      return "";
    },
  }));

  return <div ref={editorRef} style={{ height: "300px" }} />;
});

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;