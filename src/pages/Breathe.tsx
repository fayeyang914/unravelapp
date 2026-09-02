import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import BreathingSession from "@/components/BreathingSession";

const Breathe = () => (
  <AppShell>
    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back
    </Link>
    <h1 className="mt-8 text-3xl">A minute of breathing</h1>
    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
      Follow the circle if it helps, or close your eyes and use the counts. Leaving early is fine.
    </p>
    <BreathingSession />
  </AppShell>
);

export default Breathe;
