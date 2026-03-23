import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
        <div className="relative w-full h-full glass-panel rounded-2xl flex items-center justify-center border-primary/30">
          <AlertCircle className="w-10 h-10 text-primary" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
        404
      </h1>
      <p className="text-xl text-zinc-400 mb-8 text-center max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      
      <Link 
        href="/" 
        className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
