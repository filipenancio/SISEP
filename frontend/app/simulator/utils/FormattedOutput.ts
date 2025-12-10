export function formatResults(result: any): string {
  if (!result || !result.buses) {
    return "Nenhum resultado disponível";
  }

  let formattedOutput = "";

  // Mapear código do algoritmo para nome completo
  const algorithmNames: { [key: string]: string } = {
    'nr': 'Newton-Raphson',
    'fdxb': 'Fast Decoupled XB',
    'fdbx': 'Fast Decoupled BX',
    'bfsw': 'Backward/Forward Sweep',
    'gs': 'Gauss-Seidel',
    'dc': 'DC Power Flow'
  };
  
  const iterations = result.iterations || 0;
  const executionTime = result.execution_time_s || 0.0;
  const algorithm = result.algorithm || 'nr';
  const algorithmName = algorithmNames[algorithm] || algorithm;
  const perfInfo = `(Algoritmo: ${algorithmName}, ${iterations} iterações, ${executionTime.toFixed(4)}s)`;

  formattedOutput +=`${perfInfo}\n`;
  
  // Cabeçalho do sistema
  formattedOutput += "=========================================================================================\n";
  formattedOutput += "|                         SISEP - Resultado do Fluxo de Potência                        |\n";
  formattedOutput += "=========================================================================================\n\n";

  // Sistema Summary
  const totalBuses = result.buses.length;
  const totalGenerators = result.generators?.length || 0;
  const totalLoads = result.loads?.length || 0;
  const totalLines = result.lines?.length || 0;

  // Cálculos de resumo corrigidos conforme resultado esperado
  let totalGeneration = 0;
  let totalGenerationQ = 0;    
  let totalLosses = 0;
  let totalLossesQ = 0;

  if (result.generators) {
    totalGeneration = result.generators.reduce((sum: number, gen: any) => sum + gen.p_mw, 0);
    totalGenerationQ = result.generators.reduce((sum: number, gen: any) => sum + gen.q_mvar, 0);
  }
  if (result.ext_grid) {
    totalGeneration += result.ext_grid.p_mw;
    totalGenerationQ += result.ext_grid.q_mvar;
  }

  if (result.lines) {
    totalLosses = result.lines.reduce((sum: number, line: any) => sum + Math.abs(line.pl_mw || 0), 0);
    totalLossesQ = result.lines.reduce((sum: number, line: any) => sum + Math.abs(line.ql_mvar || 0), 0);
  }

  // Tabela de resumo do sistema
  const genCapacityQRange = `${result.genCapacityQmin.toFixed(2)} to ${result.genCapacityQmax.toFixed(2)}`.padStart(24);
  
  formattedOutput += `  Resumo do sistema \n`;
  formattedOutput += "-----------------------------------------------------------------------------------------\n";
  formattedOutput += "  Quantos?                    Quanto?            P (MW)            Q (MVAr)\n";
  formattedOutput += "  -----------  ---    -----------------------  ---------- ------------------------\n";
  formattedOutput += `  Barras       ${totalBuses.toString().padStart(3)}    Capacidade de Geração    ${(result.genCapacityP).toFixed(2).padStart(10)} ${genCapacityQRange}\n`;
  formattedOutput += `   Geradores   ${(totalGenerators + (result.ext_grid ? 1 : 0)).toString().padStart(3)}    Potência Gerada          ${totalGeneration.toFixed(2).padStart(10)} ${(totalGenerationQ).toFixed(2).padStart(24)}\n`;
  formattedOutput += `   Cargas      ${totalLoads.toString().padStart(3)}    Carga Total do Sistema   ${(result.loadSystemP).toFixed(2).padStart(10)} ${(result.loadSystemQ).toFixed(2).padStart(24)}\n`;
  formattedOutput += `  Linhas       ${totalLines.toString().padStart(3)}    Total de Perdas          ${totalLosses.toFixed(2).padStart(10)} ${(totalLossesQ).toFixed(2).padStart(24)}\n`;

  // Voltage Magnitude e Angle extremos
  let minVm = 999, maxVm = 0, minVa = 999, maxVa = -999;
  let minVmBus = 0, maxVmBus = 0, minVaBus = 0, maxVaBus = 0;

  result.buses.forEach((bus: any, index: number) => {
    if (bus.vm_pu < minVm) { minVm = bus.vm_pu; minVmBus = index + 1; }
    if (bus.vm_pu > maxVm) { maxVm = bus.vm_pu; maxVmBus = index + 1; }
    if (bus.va_degree < minVa) { minVa = bus.va_degree; minVaBus = index + 1; }
    if (bus.va_degree > maxVa) { maxVa = bus.va_degree; maxVaBus = index + 1; }
  });

  // Encontrar linha com maior perda ativa e reativa
  let maxPLoss = 0, maxQLoss = 0;
  let maxPLossLine = "N/A", maxQLossLine = "N/A";
  
  if (result.lines && result.lines.length > 0) {
    result.lines.forEach((line: any, index: number) => {
      const pLoss = Math.abs(line.pl_mw || 0);
      const qLoss = Math.abs(line.ql_mvar || 0);
      let lineBus = `${(line.from_bus + 1)}-${(line.to_bus + 1)}`;
      const lineName = `linha ${lineBus.toString().padStart(7)}`;
      
      if (pLoss > maxPLoss) {
        maxPLoss = pLoss;
        maxPLossLine = lineName;
      }
      
      if (qLoss > maxQLoss) {
        maxQLoss = qLoss;
        maxQLossLine = lineName;
      }
    });
  }

  formattedOutput += "\n\n";
  formattedOutput += "                                Mínimo                         Máximo\n";
  formattedOutput += "                     ----------------------------   ----------------------------\n";
  formattedOutput += `  Tensão (pu)           ${minVm.toFixed(3).padStart(8)} p.u. @ barra ${minVmBus.toString().padStart(3)}      ${maxVm.toFixed(3).padStart(8)} p.u. @ barra ${maxVmBus.toString().padStart(3)}\n`;
  formattedOutput += `  Tensão Ângulo         ${minVa.toFixed(3).padStart(8)} deg  @ barra ${minVaBus.toString().padStart(3)}      ${maxVa.toFixed(3).padStart(8)} deg  @ barra ${maxVaBus.toString().padStart(3)}\n`;
  formattedOutput += `  Perdas Ativas                    -             ${maxPLoss.toFixed(3).padStart(10)} MW   @ ${maxPLossLine}\n`;
  formattedOutput += `  Perdas Reativa                   -             ${maxQLoss.toFixed(3).padStart(10)} MVAr @ ${maxQLossLine}\n\n`;

  // Dados das barras
  formattedOutput += "=========================================================================================\n";
  formattedOutput += "|                                   Dados das Barras                                    |\n";
  formattedOutput += "=========================================================================================\n";
  formattedOutput += "   Barra             Tensão                  Geração                    Carga           \n";
  formattedOutput += "     #         Vm (pu)    Va (deg)       P (MW)    Q (MVAr)        P (MW)    Q (MVAr)    \n";
  formattedOutput += "    ---       --------    --------      --------   --------       --------   --------    \n";

  result.buses.forEach((bus: any, index: number) => {
    const busNum = (index + 1).toString().padStart(3);
    const vm = bus.vm_pu.toFixed(3).padStart(8);
    const va = bus.va_degree.toFixed(3).padStart(8);
    
    // Buscar geração para esta barra
    let genP = 0, genQ = 0;
    if (result.generators) {
      const gen = result.generators.find((g: any) => g.bus_id === index);
      if (gen) {
        genP = gen.p_mw;
        genQ = gen.q_mvar;
      }
    }
    if (result.ext_grid && result.ext_grid.bus_id === index) {
      genP += result.ext_grid.p_mw;
      genQ += result.ext_grid.q_mvar;
    }

    // Buscar carga para esta barra
    let loadP = 0, loadQ = 0;
    if (result.loads) {
      const load = result.loads.find((l: any) => l.bus_id === index);
      if (load) {
        loadP = load.p_mw;
        loadQ = load.q_mvar;
      }
    }

    const genPStr = genP !== 0 ? genP.toFixed(2).padStart(8) : "       -";
    const genQStr = genQ !== 0 ? genQ.toFixed(2).padStart(8) : "       -";
    const loadPStr = loadP !== 0 ? loadP.toFixed(2).padStart(8) : "       -";
    const loadQStr = loadQ !== 0 ? loadQ.toFixed(2).padStart(8) : "       -";

    formattedOutput += `    ${busNum}       ${vm}    ${va}      ${genPStr}   ${genQStr}       ${loadPStr}   ${loadQStr}\n`;
  });

  formattedOutput += "                                        --------   --------       --------   --------\n";
  formattedOutput += `                            Total:      ${totalGeneration.toFixed(2).padStart(8)}   ${(result.generators?.reduce((sum: number, gen: any) => sum + gen.q_mvar, 0) || 0).toFixed(2).padStart(8)}       ${result.loadSystemP.toFixed(2).padStart(8)}   ${result.loadSystemQ.toFixed(2).padStart(8)}\n\n`;

  // Dados das linhas
  formattedOutput += "=========================================================================================\n";
  formattedOutput += "|                                     Dados das Linha                                   |\n";
  formattedOutput += "=========================================================================================\n";
  formattedOutput += "  Linha     Barra       Potência Enviada      Potência Recebida     Potência Perdida\n";
  formattedOutput += "    #      De  Para     P (MW)   Q (MVAr)     P (MW)   Q (MVAr)     P (MW)   Q (MVAr)\n";
  formattedOutput += "   ---    ---   ---    --------  --------    --------  --------    --------  --------\n";

  result.lines.forEach((line: any, index: number) => {
    const branchNum = (index + 1).toString().padStart(3);
    const fromBus = (line.from_bus + 1).toString().padStart(3);
    const toBus = (line.to_bus + 1).toString().padStart(3);
    
    const pFrom = line.p_from_mw.toFixed(2).padStart(8);
    const qFrom = line.q_from_mvar.toFixed(2).padStart(8);
    const pTo = line.p_to_mw.toFixed(2).padStart(8);
    const qTo = line.q_to_mvar.toFixed(2).padStart(8);
    const pLoss = line.pl_mw.toFixed(2).padStart(8);
    const qLoss = line.ql_mvar.toFixed(2).padStart(8);

    formattedOutput += `   ${branchNum}    ${fromBus}   ${toBus}    ${pFrom}  ${qFrom}    ${pTo}  ${qTo}    ${pLoss}  ${qLoss}\n`;
  });

  formattedOutput += "                                                                   --------  --------\n";
  formattedOutput += `                                               Total de Perdas:    ${totalLosses.toFixed(2).padStart(8)}  ${totalLossesQ.toFixed(2).padStart(8)}\n`;

  return formattedOutput;
}
