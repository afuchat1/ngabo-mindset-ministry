import { LifeBuoy } from "lucide-react";

type SupportFabProps = {
  unreadCount: number;
  onClick: () => void;
};

export function SupportFab({ unreadCount, onClick }: SupportFabProps) {
  return (
    <button type="button" className="mp-support-fab" onClick={onClick} aria-label={unreadCount > 0 ? `Open support, ${unreadCount} awaiting response` : "Open support"}>
      <LifeBuoy size={18} aria-hidden="true" />
      <span>Support</span>
      {unreadCount > 0 && <span className="mp-support-fab-count" aria-label={`${unreadCount} pending support messages`}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
  );
}
