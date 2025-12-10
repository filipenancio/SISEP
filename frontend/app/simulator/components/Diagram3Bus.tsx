import React from 'react';
import { Bus } from './EditModalBus';
import { Branch } from './EditModalBranch';
import { BusPosition, DiagramBaseProps, createDiagramUtils, useOptimalLineLabelPositions, useOptimalLabelPositions, renderDiagramContent } from './DiagramBase';

export const busPositions3: Record<number, BusPosition> = {
  1: { x: 250, y: 250 },
  2: { x: 550, y: 250 },
  3: { x: 400, y: 400 }
};

// Para uso interno no componente
const busPositions = busPositions3;

export interface Diagram3BusProps extends DiagramBaseProps {}

export const Diagram3Bus: React.FC<Diagram3BusProps> = ({
  buses,
  generators,
  branches,
  lineResults,
  isResultView = false,
  onBusClick,
  onGeneratorClick,
  onBranchClick,
  onLoadClick,
  onBusHover,
  onGeneratorHover,
  onBranchHover,
  onLoadHover,
  hasDragged,
}) => {
  const { getGenerator, hasLoad, getLineResult } = createDiagramUtils(generators, buses, lineResults);

  // Calcular posições otimizadas dos labels
  const optimalLabelPositions = useOptimalLabelPositions(buses, branches, generators, busPositions);
  const optimalLineLabelPositions = useOptimalLineLabelPositions(buses, branches, generators, busPositions);

  return renderDiagramContent(
    buses,
    branches,
    generators,
    lineResults,
    busPositions,
    optimalLabelPositions,
    optimalLineLabelPositions,
    isResultView || false,
    getGenerator,
    getLineResult,
    hasLoad,
    onBusClick,
    onGeneratorClick,
    onBranchClick,
    onLoadClick,
    onBusHover,
    onGeneratorHover,
    onBranchHover,
    onLoadHover,
    hasDragged
  );
};
