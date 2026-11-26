import { createFileRoute } from "@tanstack/react-router";
import { MemberNetworkPage } from "@/components/member-platform/network-groups";
import { MemberWorkspace } from "@/components/member-platform/shared";

export const Route = createFileRoute("/_member/dashboard/network")({
  component: NetworkRoute,
});

function NetworkRoute() {
  return <MemberWorkspace active="/dashboard/network" title="Network" kicker="COMMUNITY" description="Find your people and join a conversation."><MemberNetworkPage /></MemberWorkspace>;
}
