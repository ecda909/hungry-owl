import Link from "next/link";

// Force dynamic rendering to avoid Clerk issues during build
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="text-center space-y-6 p-8">
        <div className="text-8xl">🦉</div>
        <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

