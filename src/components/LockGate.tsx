import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/store";

const LockGate = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);

  const locked = settings.lockEnabled && settings.passcode.length === 4 && !unlocked;

  useEffect(() => {
    if (code.length === 4) {
      if (code === settings.passcode) {
        setUnlocked(true);
        setWrong(false);
      } else {
        setWrong(true);
        setCode("");
      }
    }
  }, [code, settings.passcode]);

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="mt-6 font-display text-2xl">Enter your code</h1>
      <Input
        autoFocus
        value={code}
        inputMode="numeric"
        maxLength={4}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="mt-8 h-14 w-40 rounded-2xl bg-card text-center text-2xl tracking-[0.5em]"
        aria-label="Passcode"
      />
      {wrong && <p className="mt-4 text-sm text-destructive">Not quite. Try again.</p>}
    </div>
  );
};

export default LockGate;
