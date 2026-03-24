import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";

export function EditorTour() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay slightly to ensure standard DOM elements are rendered
    const timer = setTimeout(() => setIsReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const runTour = () => {
    const d = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: "driver-js-theme", // Reusing the theme custom styles from AppTour
      doneBtnText: "Got it!",
      nextBtnText: "Next",
      prevBtnText: "Back",
      steps: [
        {
          popover: {
            title: "Editor Canvas 🧑‍💻",
            description: "Here in the Code Editor is where the magic happens. We support HTML and Handlebars directly. Start typing to see your code instantly syntax highlighted.",
          },
        },
        {
          element: "#tour-editor-preview-tab",
          popover: {
            title: "Live Preview",
            description: "Tired of guessing? Switch to the Preview tab at any time (or press Cmd/Ctrl + /) to see exactly how your email looks when rendered with Mock Data.",
            side: "bottom",
            align: "start"
          },
        },
        {
          element: "#tour-editor-save",
          popover: {
            title: "Don't forget to Save!",
            description: "Click here to Save your progress (or press Cmd/Ctrl + S). Be sure to save frequently so you don't lose your work!",
            side: "bottom",
            align: "end"
          },
        }
      ],
    });
    d.drive();
  };

  useEffect(() => {
    if (!isReady) return;
    const hasSeenTour = localStorage.getItem("previewemail_editor_tour_seen");
    if (!hasSeenTour) {
      runTour();
      localStorage.setItem("previewemail_editor_tour_seen", "true");
    }
  }, [isReady]);

  return (
    <button
      onClick={runTour}
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-bg px-2.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg mx-2"
      aria-label="Editor Tour"
      title="Start Editor Tour"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Tour</span>
    </button>
  );
}
