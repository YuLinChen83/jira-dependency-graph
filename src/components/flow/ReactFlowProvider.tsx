import React from "react";
import { ReactFlowProvider } from "reactflow";

interface FlowProviderProps {
  children: React.ReactNode;
}

export default function FlowProvider({ children }: FlowProviderProps) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
