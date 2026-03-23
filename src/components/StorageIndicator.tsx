import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function StorageIndicator() {
  const [usage, setUsage] = useState<number>(0);
  const [quota, setQuota] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const refreshStorage = () => {
    if (typeof navigator !== "undefined" && "storage" in navigator && "estimate" in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          setUsage(estimate.usage);
          if (estimate.quota > 0) setQuota(estimate.quota);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStorage();
    const interval = setInterval(refreshStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-8 items-center justify-center w-[120px]" title="Calculating storage...">
        <Database className="h-3 w-3 text-fg-muted animate-pulse" />
      </div>
    );
  }

  const rawPercentage = (usage / quota) * 100;
  let percentageDisplay = "0%";
  if (rawPercentage > 0 && rawPercentage < 1) {
    percentageDisplay = "<1%";
  } else {
    percentageDisplay = `${Math.min(100, Math.round(rawPercentage))}%`;
  }
  
  const progressValue = Math.min(100, Math.max(0, rawPercentage));

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const usageFormatted = formatBytes(usage);

  return (
    <div 
      className="group flex flex-col justify-center gap-1.5 w-[120px] rounded-md px-2 py-1 transition-colors hover:bg-bg-subtle cursor-default" 
      title={`IndexedDB Storage: ${usageFormatted} used`}
    >
      <div className="flex items-center justify-between text-[11px] font-medium text-fg-muted group-hover:text-fg transition-colors">
        <div className="flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          <span>Storage</span>
        </div>
        <span>{percentageDisplay}</span>
      </div>
      <Progress value={progressValue} className="h-1 bg-bg-inset" />
    </div>
  );
}
