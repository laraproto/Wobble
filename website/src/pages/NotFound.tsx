import { Link } from "wouter";

export function NotFound() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-8">The page you are looking for does not exist.</p>

      <Link className="text-blue-500 hover:underline" href="/">
        Go Home
      </Link>
    </div>
  );
}
