import "./globals.css";

export const metadata = {
  title: "Study Companion",
  description: "An AI study planner with secure auth, premium saves, and guided assignment breakdowns.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
