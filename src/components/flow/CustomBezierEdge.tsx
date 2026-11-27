import React from "react";
import { EdgeProps, getBezierPath } from "reactflow";

// 自定義貝塞爾曲線邊線組件，避免橫跨卡片
export default function CustomBezierEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
  } = props;

  // 計算控制點以創建更自然的弧形，避免橫跨卡片
  const calculateControlPoints = () => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 根據關係類型和位置關係調整弧形程度 - 優先支援直線
    const relation = data?.relation;

    // 檢查是否可以使用直線連接
    const isVerticalConnection = Math.abs(dx) < 50 && dy > 0; // 幾乎垂直向下
    const isHorizontalConnection = Math.abs(dy) < 50 && dx > 0; // 幾乎水平向右

    let curvature;
    if (isVerticalConnection) {
      curvature = Math.min(distance * 0.05, 20);
    } else if (isHorizontalConnection && relation?.relationType === "blocks") {
      curvature = Math.min(distance * 0.1, 30);
    } else {
      const baseArc = Math.min(distance * 0.3, 150);
      if (relation?.relationType === "relates") {
        curvature = baseArc * 1.1;
      } else {
        curvature = baseArc * 0.8;
      }
    }

    let controlPoint1X = sourceX;
    let controlPoint1Y = sourceY;
    let controlPoint2X = targetX;
    let controlPoint2Y = targetY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        controlPoint1X = sourceX + curvature;
        controlPoint2X = targetX - curvature;

        if (Math.abs(dy) > 50) {
          const arcOffset = dy > 0 ? curvature * 1.2 : -curvature * 1.2;
          controlPoint1Y = sourceY + arcOffset * 0.6;
          controlPoint2Y = targetY - arcOffset * 0.6;
        } else {
          const arcDirection = relation?.relationType === "blocks" ? -1 : 1;
          controlPoint1Y = sourceY + arcDirection * curvature * 0.8;
          controlPoint2Y = targetY + arcDirection * curvature * 0.8;
        }
      } else {
        controlPoint1X = sourceX - curvature;
        controlPoint2X = targetX + curvature;

        if (Math.abs(dy) > 50) {
          const arcOffset = dy > 0 ? curvature * 1.2 : -curvature * 1.2;
          controlPoint1Y = sourceY + arcOffset * 0.6;
          controlPoint2Y = targetY - arcOffset * 0.6;
        } else {
          const arcDirection = relation?.relationType === "blocks" ? 1 : -1;
          controlPoint1Y = sourceY + arcDirection * curvature * 0.8;
          controlPoint2Y = targetY + arcDirection * curvature * 0.8;
        }
      }
    } else {
      if (dy > 0) {
        controlPoint1Y = sourceY + curvature;
        controlPoint2Y = targetY - curvature;

        const horizontalOffset = distance > 300 ? curvature * 1.2 : curvature * 0.8;
        const offsetDirection = Math.sign(dx) || 1;
        controlPoint1X = sourceX + offsetDirection * horizontalOffset;
        controlPoint2X = targetX - offsetDirection * horizontalOffset;
      } else {
        controlPoint1Y = sourceY - curvature;
        controlPoint2Y = targetY + curvature;

        const horizontalOffset = distance > 300 ? curvature * 1.2 : curvature * 0.8;
        const offsetDirection = Math.sign(dx) || 1;
        controlPoint1X = sourceX + offsetDirection * horizontalOffset;
        controlPoint2X = targetX - offsetDirection * horizontalOffset;
      }
    }

    return { controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y };
  };

  const { controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y } = calculateControlPoints();

  // 創建自定義 SVG 路徑
  const customPath = `M ${sourceX},${sourceY} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${targetX},${targetY}`;

  // 根據關係類型設置樣式
  const relation = data?.relation;
  const isBlocks = relation?.relationType === "blocks";
  const isRelates = relation?.relationType === "relates";
  const isCriticalPath = data?.isCriticalPath || (props as any).isCriticalPath;

  const edgeStyle = {
    strokeWidth: isBlocks ? 3 : 2,
    stroke: isBlocks ? "#ef4444" : isRelates ? "#10b981" : "#6b7280",
    strokeDasharray: isRelates ? "8,4" : undefined,
    fill: "none",
    ...style,
  };

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${isCriticalPath ? "animate-critical-edge" : ""}`}
        d={customPath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <path
        d={customPath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
    </>
  );
}
