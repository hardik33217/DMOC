import { Link } from "react-router-dom";
import { HomeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-9xl font-bold text-brand-100 dark:text-brand-900/30 mb-4">404</div>
          <h1 className="heading-2 mb-4">Page Not Found</h1>
          <p className="body mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="btn-primary">
              <HomeIcon className="h-5 w-5" /> Go Home
            </Link>
            <Link to="/decisions" className="btn-secondary">
              <MagnifyingGlassIcon className="h-5 w-5" /> Browse Decisions
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}