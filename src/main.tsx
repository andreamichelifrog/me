import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { UserProvider } from "./lib/UserContext";
import { ThemeProvider } from "./lib/ThemeContext";

const memoryHistory = createMemoryHistory({
  initialEntries: ["/"],
});

// Create a new router instance
const router = createRouter({
  routeTree,
  basepath: "https://andreamichelifrog.github.io/me",
  history: memoryHistory,
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
  console.log(router);

  root.render(
    <UserProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </UserProvider>
  );
}
