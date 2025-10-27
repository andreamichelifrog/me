import ReactDOM from "react-dom/client";
import { createHashHistory } from "@tanstack/history";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { UserProvider } from "./lib/UserContext";
import { ThemeProvider } from "./lib/ThemeContext";

// Create a new router instance
const router = createRouter({
  routeTree,
  basepath: "/me",
  history: createHashHistory(),
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <UserProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </UserProvider>
  );
}
