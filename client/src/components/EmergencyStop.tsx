import { StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmergencyStopProps {
  isRunning: boolean;
  onStop: () => void;
}

export function EmergencyStop({ isRunning, onStop }: EmergencyStopProps) {
  if (!isRunning) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg animate-pulse"
          data-testid="button-emergency-stop"
        >
          <StopCircle className="h-4 w-4 mr-1.5" />
          Emergency Stop
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stop All Running Processes?</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately terminate all running tasks and processes in the
            current session. Any unsaved work may be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-stop">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onStop}
            data-testid="button-confirm-stop"
          >
            Stop Everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
