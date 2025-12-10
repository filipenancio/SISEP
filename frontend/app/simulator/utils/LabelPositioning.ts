/**
 * Utilitário para posicionamento inteligente de labels
 * Evita sobreposições com outros elementos do diagrama
 */

interface Position {
  x: number;
  y: number;
}

interface Element {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LabelDimensions {
  width: number;
  height: number;
}

/**
 * Posições relativas para tentar posicionar o label
 * Ordem: Abaixo (padrão), Acima, Esquerda, Direita, Noroeste, Sudoeste, Nordeste, Sudeste
 */
const LABEL_POSITIONS = [
  { dx: 0, dy: 50, name: 'abaixo' },      // Padrão - abaixo
  { dx: 0, dy: -50, name: 'acima' },       // Acima
  { dx: -60, dy: 0, name: 'esquerda' },    // Esquerda
  { dx: 60, dy: 0, name: 'direita' },      // Direita
  { dx: -45, dy: -45, name: 'noroeste' },  // Noroeste (diagonal superior esquerda)
  { dx: -45, dy: 45, name: 'sudoeste' },   // Sudoeste (diagonal inferior esquerda)
  { dx: 45, dy: -45, name: 'nordeste' },   // Nordeste (diagonal superior direita)
  { dx: 45, dy: 45, name: 'sudeste' }      // Sudeste (diagonal inferior direita)
];

/**
 * Verifica se dois retângulos se sobrepõem
 */
function rectanglesOverlap(rect1: Element, rect2: Element): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Calcula as dimensões aproximadas de um label baseado no texto
 */
export function calculateLabelDimensions(text: string, fontSize: number = 14): LabelDimensions {
  // Aproximação: cada caractere tem ~0.6 da largura do fontSize
  const charWidth = fontSize * 0.6;
  const width = text.length * charWidth;
  const height = fontSize + 4; // Altura do texto + pequena margem
  
  return { width, height };
}

/**
 * Cria um retângulo representando a área ocupada por um label
 */
function createLabelRect(x: number, y: number, labelDimensions: LabelDimensions): Element {
  // O label é centralizado horizontalmente (textAnchor="middle")
  return {
    x: x - labelDimensions.width / 2,
    y: y - labelDimensions.height / 2,
    width: labelDimensions.width,
    height: labelDimensions.height
  };
}

/**
 * Cria retângulos para elementos comuns do diagrama
 */
export function createElementRects(
  busPosition: Position,
  hasGenerator: boolean,
  hasLoad: boolean
): Element[] {
  const elements: Element[] = [];
  
  // Barra (círculo de raio 25)
  elements.push({
    x: busPosition.x - 25,
    y: busPosition.y - 25,
    width: 50,
    height: 50
  });
  
  // Indicador de gerador (30x30 na diagonal superior esquerda)
  if (hasGenerator) {
    elements.push({
      x: busPosition.x - 30 - 15,
      y: busPosition.y - 30 - 15,
      width: 30,
      height: 30
    });
  }
  
  // Indicador de carga (30x30 na diagonal superior direita)
  if (hasLoad) {
    elements.push({
      x: busPosition.x + 30 - 15,
      y: busPosition.y - 30 - 15,
      width: 30,
      height: 30
    });
  }
  
  return elements;
}

/**
 * Calcula a distância de um ponto a uma linha
 */
function distanceFromPointToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Verifica se um retângulo está próximo de uma linha
 */
function rectangleNearLine(rect: Element, x1: number, y1: number, x2: number, y2: number, threshold: number = 15): boolean {
  // Verificar os 4 cantos do retângulo
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height }
  ];
  
  for (const corner of corners) {
    if (distanceFromPointToLine(corner.x, corner.y, x1, y1, x2, y2) < threshold) {
      return true;
    }
  }
  
  // Verificar o centro do retângulo também
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  if (distanceFromPointToLine(centerX, centerY, x1, y1, x2, y2) < threshold) {
    return true;
  }
  
  return false;
}

/**
 * Cria retângulo para uma linha de transmissão
 * DEPRECATED: Use rectangleNearLine para verificação mais precisa
 */
export function createLineRect(x1: number, y1: number, x2: number, y2: number): Element {
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const maxX = Math.max(x1, x2);
  const maxY = Math.max(y1, y2);
  
  // Adicionar margem de 10px para área de hover da linha
  return {
    x: minX - 10,
    y: minY - 10,
    width: (maxX - minX) + 20,
    height: (maxY - minY) + 20
  };
}

/**
 * Encontra a melhor posição para um label evitando sobreposições
 * Versão melhorada que verifica distância real de linhas
 * @param busPosition Posição central da barra
 * @param labelText Texto do label
 * @param obstacles Lista de elementos retangulares que devem ser evitados
 * @param lines Lista de linhas que devem ser evitadas
 * @param fontSize Tamanho da fonte do label
 * @returns Posição otimizada para o label
 */
export function findBestLabelPositionWithLines(
  busPosition: Position,
  labelText: string,
  obstacles: Element[],
  lines: Array<{x1: number, y1: number, x2: number, y2: number}>,
  fontSize: number = 14
): { x: number; y: number; position: string } {
  const labelDimensions = calculateLabelDimensions(labelText, fontSize);
  
  // Tentar cada posição em ordem de preferência
  for (const position of LABEL_POSITIONS) {
    const labelX = busPosition.x + position.dx;
    const labelY = busPosition.y + position.dy;
    
    const labelRect = createLabelRect(labelX, labelY, labelDimensions);
    
    // Verificar se há colisão com algum obstáculo retangular
    let hasCollision = false;
    for (const obstacle of obstacles) {
      if (rectanglesOverlap(labelRect, obstacle)) {
        hasCollision = true;
        break;
      }
    }
    
    // Se não colidiu com obstáculos, verificar linhas
    if (!hasCollision) {
      for (const line of lines) {
        if (rectangleNearLine(labelRect, line.x1, line.y1, line.x2, line.y2, 15)) {
          hasCollision = true;
          break;
        }
      }
    }
    
    // Se não há colisão, esta é uma posição válida
    if (!hasCollision) {
      return { x: labelX, y: labelY, position: position.name };
    }
  }
  
  // Se nenhuma posição está livre, retorna a posição padrão (abaixo)
  return { 
    x: busPosition.x, 
    y: busPosition.y + 50, 
    position: 'abaixo-forcado' 
  };
}

/**
 * Encontra a melhor posição para um label evitando sobreposições
 * @param busPosition Posição central da barra
 * @param labelText Texto do label
 * @param obstacles Lista de elementos que devem ser evitados
 * @param fontSize Tamanho da fonte do label
 * @returns Posição otimizada para o label
 */
export function findBestLabelPosition(
  busPosition: Position,
  labelText: string,
  obstacles: Element[],
  fontSize: number = 14
): { x: number; y: number; position: string } {
  const labelDimensions = calculateLabelDimensions(labelText, fontSize);
  
  // Tentar cada posição em ordem de preferência
  for (const position of LABEL_POSITIONS) {
    const labelX = busPosition.x + position.dx;
    const labelY = busPosition.y + position.dy;
    
    const labelRect = createLabelRect(labelX, labelY, labelDimensions);
    
    // Verificar se há colisão com algum obstáculo
    let hasCollision = false;
    for (const obstacle of obstacles) {
      if (rectanglesOverlap(labelRect, obstacle)) {
        hasCollision = true;
        break;
      }
    }
    
    // Se não há colisão, esta é uma posição válida
    if (!hasCollision) {
      return { x: labelX, y: labelY, position: position.name };
    }
  }
  
  // Se nenhuma posição está livre, retorna a posição padrão (abaixo)
  return { 
    x: busPosition.x, 
    y: busPosition.y + 50, 
    position: 'abaixo-forcado' 
  };
}

/**
 * Versão otimizada que considera múltiplas barras e suas linhas
 * @param buses Array de posições das barras com informações
 * @param branches Array de linhas de transmissão
 * @param busId ID da barra atual para calcular posição do label
 * @returns Objeto com posições otimizadas para todos os labels
 */
export function calculateOptimalLabelPositions(
  buses: Array<{ 
    id: number; 
    x: number; 
    y: number; 
    label: string;
    hasGenerator: boolean;
    hasLoad: boolean;
  }>,
  branches: Array<{ from: number; to: number }>,
  busPositions: Record<number, Position>
): Map<number, { x: number; y: number; position: string }> {
  const labelPositions = new Map<number, { x: number; y: number; position: string }>();
  
  for (const bus of buses) {
    const obstacles: Element[] = [];
    const lines: Array<{x1: number, y1: number, x2: number, y2: number}> = [];
    const isBus6 = bus.id === 6;
    
    // Adicionar elementos da própria barra
    const ownElements = createElementRects(
      { x: bus.x, y: bus.y },
      bus.hasGenerator,
      bus.hasLoad
    );
    obstacles.push(...ownElements);

    // Adicionar elementos de barras próximas (dentro de 150px)
    for (const otherBus of buses) {
      if (otherBus.id === bus.id) continue;
      
      const distance = Math.sqrt(
        Math.pow(bus.x - otherBus.x, 2) + 
        Math.pow(bus.y - otherBus.y, 2)
      );
      
      if (distance < 150) {
        const otherElements = createElementRects(
          { x: otherBus.x, y: otherBus.y },
          otherBus.hasGenerator,
          otherBus.hasLoad
        );
        obstacles.push(...otherElements);
        
        // Adicionar área do label da barra próxima (posição padrão)
        const otherLabelDims = calculateLabelDimensions(otherBus.label);
        const otherLabelRect = createLabelRect(otherBus.x, otherBus.y + 50, otherLabelDims);
        obstacles.push(otherLabelRect);
      }
    }
    
    // Armazenar linhas conectadas para verificação mais precisa
    for (const branch of branches) {
      if (branch.from === bus.id || branch.to === bus.id) {
        const otherBusId = branch.from === bus.id ? branch.to : branch.from;
        const otherBusPos = busPositions[otherBusId];
        
        if (otherBusPos) {
          lines.push({
            x1: bus.x,
            y1: bus.y,
            x2: otherBusPos.x,
            y2: otherBusPos.y
          });
        }
      }
    }
    
    // Calcular melhor posição para o label usando verificação mais inteligente
    const position = findBestLabelPositionWithLines(
      { x: bus.x, y: bus.y },
      bus.label,
      obstacles,
      lines
    );
    
    labelPositions.set(bus.id, position);
  }
  
  return labelPositions;
}

/**
 * Posições perpendiculares à linha para tentar posicionar o label
 * Tenta posições em ambos os lados da linha
 */
const LINE_LABEL_OFFSETS = [
  { distance: 15, side: 1, name: 'lado-direito-15' },    // 15px à direita (perpendicular)
  { distance: 15, side: -1, name: 'lado-esquerdo-15' },  // 15px à esquerda (perpendicular)
  { distance: 25, side: 1, name: 'lado-direito-25' },    // 25px à direita
  { distance: 25, side: -1, name: 'lado-esquerdo-25' },  // 25px à esquerda
  { distance: 35, side: 1, name: 'lado-direito-35' },    // 35px à direita
  { distance: 35, side: -1, name: 'lado-esquerdo-35' },  // 35px à esquerda
];

/**
 * Calcula posição otimizada para label de linha de transmissão
 * Evita sobreposição com a própria linha e outros elementos
 */
export function calculateLineLabelPosition(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  obstacles: Element[]
): { x: number; y: number; position: string } {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Calcular vetor perpendicular à linha (normalizado)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Vetor perpendicular (rotação 90 graus)
  const perpX = -dy / length;
  const perpY = dx / length;
  
  const labelDims = calculateLabelDimensions(label);
  
  // Detectar se é uma linha descendente (para baixo ou horizontal descendente)
  // Quando y2 >= y1 e x2 >= x1, aumentar a distância do label
  const isDescendingLine = (y2 >= y1 && x2 >= x1);
  const distanceMultiplier = isDescendingLine ? 1.4 : 1.0; // 40% mais afastado para linhas descendentes
  
  // Tentar diferentes posições perpendiculares à linha
  for (const offset of LINE_LABEL_OFFSETS) {
    const adjustedDistance = offset.distance * distanceMultiplier;
    const testX = midX + perpX * adjustedDistance * offset.side;
    const testY = midY + perpY * adjustedDistance * offset.side;
    
    const labelRect: Element = {
      x: testX - labelDims.width / 2,
      y: testY - labelDims.height / 2,
      width: labelDims.width,
      height: labelDims.height
    };
    
    // Verificar colisão com obstáculos
    let hasCollision = false;
    for (const obstacle of obstacles) {
      if (rectanglesOverlap(labelRect, obstacle)) {
        hasCollision = true;
        break;
      }
    }
    
    if (!hasCollision) {
      return {
        x: testX,
        y: testY,
        position: offset.name
      };
    }
  }
  
  // Se não encontrou posição livre, usar posição padrão (lado direito com distância ajustada)
  const defaultDistance = isDescendingLine ? 21 : 15; // 40% maior para linhas descendentes
  
  return {
    x: midX + perpX * defaultDistance,
    y: midY + perpY * defaultDistance,
    position: 'lado-direito-15-default'
  };
}

/**
 * Calcula posições otimizadas para todos os labels de linhas
 */
export function calculateOptimalLineLabelPositions(
  branches: Array<{ from: number; to: number; label: string }>,
  busPositions: Record<number, Position>,
  buses: Array<{ id: number; x: number; y: number; hasGenerator: boolean; hasLoad: boolean }>
): Map<string, { x: number; y: number; position: string }> {
  const labelPositions = new Map<string, { x: number; y: number; position: string }>();
  
  // Para cada linha
  for (const branch of branches) {
    const pos1 = busPositions[branch.from];
    const pos2 = busPositions[branch.to];
    
    if (!pos1 || !pos2) continue;
    
    // Coletar obstáculos (barras, geradores, cargas e outras linhas)
    const obstacles: Element[] = [];
    
    // Adicionar todas as barras como obstáculos
    for (const bus of buses) {
      const busElements = createElementRects(
        { x: bus.x, y: bus.y },
        bus.hasGenerator,
        bus.hasLoad
      );
      obstacles.push(...busElements);
    }
    
    // Adicionar outras linhas como obstáculos (exceto a atual)
    for (const otherBranch of branches) {
      if (otherBranch.from === branch.from && otherBranch.to === branch.to) continue;
      
      const otherPos1 = busPositions[otherBranch.from];
      const otherPos2 = busPositions[otherBranch.to];
      
      if (otherPos1 && otherPos2) {
        obstacles.push(createLineRect(otherPos1.x, otherPos1.y, otherPos2.x, otherPos2.y));
      }
    }
    
    // Adicionar a própria linha como obstáculo (para evitar label sobre a linha)
    obstacles.push(createLineRect(pos1.x, pos1.y, pos2.x, pos2.y));
    
    // Calcular melhor posição para o label
    const position = calculateLineLabelPosition(
      pos1.x,
      pos1.y,
      pos2.x,
      pos2.y,
      branch.label,
      obstacles
    );
    
    const key = `${branch.from}-${branch.to}`;
    labelPositions.set(key, position);
  }
  
  return labelPositions;
}
