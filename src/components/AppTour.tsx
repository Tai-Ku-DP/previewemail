import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function AppTour() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay slightly to ensure standard DOM elements are rendered
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const runTour = () => {
    const d = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: "driver-js-theme",
      doneBtnText: "Got it!",
      nextBtnText: "Next",
      prevBtnText: "Back",
      steps: [
        {
          popover: {
            title: "Welcome to PreviewEmail 👋",
            description:
              "Let's take a quick tour to help you understand how templates and layouts work together to build beautiful emails.",
          },
        },
        {
          element: "#tour-templates-tab",
          popover: {
            title: "Templates",
            description:
              "Templates are the actual content and structure of a specific email, like a 'Welcome Email', 'Password Reset', 'Login Email', 'Overdue Task Reminder', etc.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-layouts-tab",
          popover: {
            title: "Layouts",
            description:
              "Layouts are the reusable outer shells holding your brand's header, footer, and styling. You can attach a Layout to multiple Templates!",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-library-btn",
          popover: {
            title: "Template Library",
            description:
              "Don't want to start from scratch? Browse and clone ready-made email designs from our library.",
            side: "left",
            align: "center",
          },
        },
        {
          element: "#tour-new-btn",
          popover: {
            title: "Create New",
            description:
              "Click here to create a blank Template or Layout whenever you're ready.",
            side: "bottom",
            align: "end",
          },
        },
      ],
    });
    d.drive();
  };

  useEffect(() => {
    if (!isReady) return;
    const hasSeenTour = localStorage.getItem("previewemail_tour_seen");
    if (!hasSeenTour) {
      runTour();
      localStorage.setItem("previewemail_tour_seen", "true");
    }
  }, [isReady]);

  return null;

  // return (
  //   <button
  //     onClick={runTour}
  //     className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-bg px-2.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg mx-1"
  //     aria-label="App Tour"
  //     title="Start Tour"
  //   >
  //     <HelpCircle className="h-4 w-4" />
  //     <span className="hidden sm:inline">Tour</span>
  //   </button>
  // );
}
