import { Bus } from '../components/EditModalBus';
import { Generator } from '../components/EditModalGenerator';
import { Branch } from '../components/EditModalBranch';
import { LineResult } from '../components/Diagram3Bus';

export interface MPC {
  version: string;
  baseMVA: number;
  bus: Bus[];
  gen: Generator[];
  branch: Branch[];
}

export interface MPCResult {
  bus: Array<{
    bus_id: number;
    vm_pu: number;
    va_degree: number;
    p_mw: number;
    q_mvar: number;
  }>;
  lines: LineResult[];
  loads: Array<{
    bus_id: number;
    p_mw: number;
    q_mvar: number;
  }>;
  generators: Array<{
    bus_id: number;
    p_mw: number;
    q_mvar: number;
    vm_pu: number;
  }>;
  ext_grid: Array<{
    bus_id: number;
    p_mw: number;
    q_mvar: number;
  }>;
  genCapacityP: number;
  genCapacityQmin: number;
  genCapacityQmax: number;
  loadSystemP: number;
  loadSystemQ: number;
  iterations?: number;
  execution_time_s?: number;
  algorithm?: string;
}

/**
 * Converte um objeto MPC para o formato de arquivo MATPOWER (.m)
 */
export function mpcToMatpower(mpc: MPC): string {
  const lines: string[] = [];
  
  lines.push(`function mpc = case_custom`);
  lines.push(`%% MATPOWER Case File`);
  lines.push(`%% Generated from SISEP Simulator`);
  lines.push(``);
  lines.push(`%% MATPOWER Case Format : Version ${mpc.version}`);
  lines.push(`mpc.version = '${mpc.version}';`);
  lines.push(``);
  lines.push(`%%-----  Power Flow Data  -----%%`);
  lines.push(`%% system MVA base`);
  lines.push(`mpc.baseMVA = ${mpc.baseMVA};`);
  lines.push(``);
  
  // Bus data
  lines.push(`%% bus data`);
  lines.push(`%\tbus_i\ttype\tPd\tQd\tGs\tBs\tarea\tVm\tVa\tbaseKV\tzone\tVmax\tVmin`);
  lines.push(`mpc.bus = [`);
  mpc.bus.forEach((bus, idx) => {
    const values = [
      bus.bus_i,
      bus.type,
      bus.Pd,
      bus.Qd,
      bus.Gs,
      bus.Bs,
      bus.area,
      bus.Vm,
      bus.Va,
      bus.baseKV,
      bus.zone,
      bus.Vmax,
      bus.Vmin
    ];
    const line = values.join('\t');
    lines.push(`\t${line}${idx < mpc.bus.length - 1 ? ';' : ''}`);
  });
  lines.push(`];`);
  lines.push(``);
  
  // Generator data
  lines.push(`%% generator data`);
  lines.push(`%\tbus\tPg\tQg\tQmax\tQmin\tVg\tmBase\tstatus\tPmax\tPmin`);
  lines.push(`mpc.gen = [`);
  mpc.gen.forEach((gen, idx) => {
    const values = [
      gen.bus,
      gen.Pg,
      gen.Qg,
      gen.Qmax,
      gen.Qmin,
      gen.Vg,
      gen.mBase,
      gen.status,
      gen.Pmax,
      gen.Pmin
    ];
    const line = values.join('\t');
    lines.push(`\t${line}${idx < mpc.gen.length - 1 ? ';' : ''}`);
  });
  lines.push(`];`);
  lines.push(``);
  
  // Branch data
  lines.push(`%% branch data`);
  lines.push(`%\tfbus\ttbus\tr\tx\tb\trateA\trateB\trateC\tratio\tangle\tstatus\tangmin\tangmax`);
  lines.push(`mpc.branch = [`);
  mpc.branch.forEach((branch, idx) => {
    const values = [
      branch.fbus,
      branch.tbus,
      branch.r,
      branch.x,
      branch.b,
      branch.rateA,
      branch.rateB,
      branch.rateC,
      branch.ratio,
      branch.angle,
      branch.status,
      branch.angmin,
      branch.angmax
    ];
    const line = values.join('\t');
    lines.push(`\t${line}${idx < mpc.branch.length - 1 ? ';' : ''}`);
  });
  lines.push(`];`);
  
  return lines.join('\n');
}

/**
 * Verifica se há linhas sem capacidade e retorna informações sobre elas
 */
export function checkLinesWithoutCapacity(mpc: MPC): { hasIssue: boolean; count: number; lines: string; message: string } {
  const linesWithoutCapacity = mpc.branch.filter(b => b.rateA === 0 || b.rateA === undefined);
  
  if (linesWithoutCapacity.length > 0) {
    const linesList = linesWithoutCapacity
      .map(b => `L${b.fbus}-${b.tbus}`)
      .join(', ');
    
    const message = `${linesWithoutCapacity.length} linha(s) sem Capacidade A definida: ${linesList}.\n\nO sistema atribuirá baseMVA (${mpc.baseMVA} MVA) como Capacidade A para estas linhas.`;
    
    return {
      hasIssue: true,
      count: linesWithoutCapacity.length,
      lines: linesList,
      message
    };
  }
  
  return { hasIssue: false, count: 0, lines: '', message: '' };
}

/**
 * Aplica baseMVA às linhas sem capacidade
 */
export function applyBaseMVAToLines(mpc: MPC): MPC {
  const updatedMPC = { ...mpc };
  updatedMPC.branch = mpc.branch.map(branch => {
    if (branch.rateA === 0 || branch.rateA === undefined) {
      return { ...branch, rateA: mpc.baseMVA };
    }
    return branch;
  });
  return updatedMPC;
}

/**
 * Faz a simulação chamando o backend
 */
export async function simulateSystem(mpc: MPC, algorithm: string = 'nr'): Promise<MPCResult> {
  const matpowerString = mpcToMatpower(mpc);
  
  // Criar um arquivo blob com o conteúdo MATPOWER
  const blob = new Blob([matpowerString], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'case_custom.m');
  
  const response = await fetch(`http://localhost:8000/sisep/simulate/matpower/upload?algorithm=${algorithm}`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro na resposta do servidor:', errorText);
    
    // Tentar parsear como JSON para verificar se é um erro estruturado
    try {
      const errorJson = JSON.parse(errorText);
      
      // Verificar se é erro de não convergência
      if (errorJson.detail && typeof errorJson.detail === 'string') {
        if (errorJson.detail.toLowerCase().includes('não convergiu') || 
            errorJson.detail.toLowerCase().includes('did not converge') ||
            errorJson.detail.toLowerCase().includes('convergence')) {
          throw new Error('CONVERGENCE_ERROR');
        }
      }
      
      // Outros erros do backend
      throw new Error('BACKEND_ERROR');
    } catch (parseError) {
      // Se não conseguiu parsear, verificar no texto
      if (errorText.toLowerCase().includes('não convergiu') || 
          errorText.toLowerCase().includes('did not converge') ||
          errorText.toLowerCase().includes('convergence')) {
        throw new Error('CONVERGENCE_ERROR');
      }
      
      // Erro genérico do backend
      throw new Error('BACKEND_ERROR');
    }
  }
  
  const rawResult = await response.json();
  
  // Ajustar bus_id somando 1 e renomear campos do backend
  const adjustedResult: MPCResult = {
    bus: rawResult.buses?.map((b: any) => ({
      bus_id: b.bus_id + 1,
      vm_pu: b.vm_pu,
      va_degree: b.va_degree,
      p_mw: b.p_mw,
      q_mvar: b.q_mvar
    })) || [],
    lines: rawResult.lines?.map((l: any) => ({
      from_bus: l.from_bus + 1,
      to_bus: l.to_bus + 1,
      p_from_mw: l.p_from_mw,
      q_from_mvar: l.q_from_mvar,
      p_to_mw: l.p_to_mw,
      q_to_mvar: l.q_to_mvar,
      p_loss_mw: l.pl_mw,
      q_loss_mvar: l.ql_mvar,
      loading_percent: l.loading_percent
    })) || [],
    loads: rawResult.loads?.map((ld: any) => ({
      bus_id: ld.bus_id + 1,
      p_mw: ld.p_mw,
      q_mvar: ld.q_mvar
    })) || [],
    generators: rawResult.generators?.map((g: any) => ({
      bus_id: g.bus_id + 1,
      p_mw: g.p_mw,
      q_mvar: g.q_mvar,
      vm_pu: g.vm_pu
    })) || [],
    ext_grid: rawResult.ext_grid ? [{
      bus_id: rawResult.ext_grid.bus_id + 1,
      p_mw: rawResult.ext_grid.p_mw,
      q_mvar: rawResult.ext_grid.q_mvar
    }] : [],
    genCapacityP: rawResult.genCapacityP || 0,
    genCapacityQmin: rawResult.genCapacityQmin || 0,
    genCapacityQmax: rawResult.genCapacityQmax || 0,
    loadSystemP: rawResult.loadSystemP || 0,
    loadSystemQ: rawResult.loadSystemQ || 0,
    iterations: rawResult.iterations || 0,
    execution_time_s: rawResult.execution_time_s || 0.0,
    algorithm: rawResult.algorithm || 'nr'
  };
  
  return adjustedResult;
}
