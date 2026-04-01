import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders booking management title", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /booking management/i, level: 1 }),
  ).toBeInTheDocument();
});
