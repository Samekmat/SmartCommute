import React from "react";
import { Leaf } from "lucide-react";

/**
 * Root Application Component for SmartCommute.
 */
export default function App(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex items-center space-x-3 text-emerald-600">
        <Leaf className="h-8 w-8" />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          SmartCommute
        </h1>
      </div>
      <p className="mt-2 text-slate-600">
        AI-Powered Eco Commute Optimizer & Weather Advisor
      </p>
    </div>
  );
}
