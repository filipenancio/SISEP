import pandapower as pp
from pandapower.converter.matpower import from_mpc
from app.models.power_system_results import PowerSystemResult
import os
from typing import List

class MatpowerService:
    # Constante para controlar prints de debug
    DEBUG_ENABLED = False  # Altere para False para desabilitar prints de debug
    
    def __init__(self):
        # Caminho para o diretório data no backend
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
        
        # Garantir que o diretório existe
        if not os.path.exists(self.data_dir):
            raise ValueError(f"Diretório de dados não encontrado: {self.data_dir}")
    
    def _debug_print(self, message: str):
        """Método auxiliar para prints de debug condicionais"""
        if self.DEBUG_ENABLED:
            print(f"DEBUG: {message}")
    
    def list_available_files(self) -> List[str]:
        """Lista todos os arquivos MATPOWER disponíveis"""
        try:
            # Verificar se o diretório existe
            if not os.path.exists(self.data_dir):
                raise ValueError(f"Diretório de dados não encontrado: {self.data_dir}")
                
            # Listar apenas arquivos .m
            matpower_files = [f for f in os.listdir(self.data_dir) if f.endswith('.m')]
            
            # Verificar se existem arquivos
            if not matpower_files:
                raise ValueError("Nenhum arquivo MATPOWER (.m) encontrado no diretório de dados")
                
            return matpower_files
            
        except Exception as e:
            raise ValueError(f"Erro ao listar arquivos MATPOWER: {str(e)}")

    def _fix_basekv_in_matpower_content(self, content: str) -> str:
        """Corrige baseKV zerado diretamente no conteúdo do arquivo MATPOWER"""
        import re
        
        lines = content.split('\n')
        modified_lines = []
        in_bus_section = False
        
        for line in lines:
            # Detectar início da seção de barras
            if 'mpc.bus' in line and '=' in line:
                in_bus_section = True
                modified_lines.append(line)
                continue
            
            # Detectar fim da seção de barras (linha com ];)
            if in_bus_section and '];' in line:
                in_bus_section = False
                modified_lines.append(line)
                continue
            
            # Se estamos na seção de barras, processar a linha
            if in_bus_section and line.strip() and not line.strip().startswith('%'):
                # Remover tabs e espaços múltiplos, dividir por tabs ou espaços
                parts = re.split(r'[\t\s]+', line.strip())
                
                # Verificar se temos dados de barra (começa com número)
                if parts and parts[0].replace('.', '').replace('-', '').isdigit():
                    # Verificar se temos pelo menos 10 colunas (baseKV é a coluna 10)
                    if len(parts) >= 10:
                        # Remover ponto-e-vírgula se existir
                        if parts[-1].endswith(';'):
                            parts[-1] = parts[-1][:-1]
                            has_semicolon = True
                        else:
                            has_semicolon = False
                        
                        # Coluna 10 é índice 9 (0-based)
                        basekv_value = parts[9]
                        if basekv_value == '0' or basekv_value == '0.0':
                            self._debug_print(f"Corrigindo baseKV=0 na barra {parts[0]} para 230 kV")
                            parts[9] = '230'
                        
                        # Reconstruir a linha com tabs
                        reconstructed = '\t' + '\t'.join(parts)
                        if has_semicolon:
                            reconstructed += ';'
                        modified_lines.append(reconstructed)
                        continue
            
            # Linha não modificada
            modified_lines.append(line)
        
        return '\n'.join(modified_lines)

    def simulate_from_filename(self, filename: str, algorithm: str = 'nr') -> PowerSystemResult:
        """Simula um sistema a partir de um arquivo MATPOWER"""
        import tempfile
        
        temp_file = None
        try:
            if not filename.endswith('.m'):
                raise ValueError(f"Modelo inválido: {filename}. Deve ter extensão .m")

            file_path = os.path.join(self.data_dir, filename)
            if not os.path.exists(file_path):
                raise ValueError(f"Modelo não encontrado: {filename}")

            if not os.path.isfile(file_path):
                raise ValueError(f"O caminho {filename} não é um modelo válido")

            # Ler e corrigir o arquivo
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                
                # Corrigir baseKV no conteúdo
                fixed_content = self._fix_basekv_in_matpower_content(content)
                
                # Salvar em arquivo temporário
                with tempfile.NamedTemporaryFile(mode='w', suffix='.m', delete=False) as tmp:
                    tmp.write(fixed_content)
                    temp_file = tmp.name
                
            except Exception as e:
                raise ValueError(f"Erro ao ler/processar o modelo {filename}: {str(e)}")
            
            # Converter do arquivo temporário corrigido
            net = from_mpc(temp_file)
            return self._run_simulation(net, algorithm)
            
        except Exception as e:
            raise ValueError(f"Erro ao simular a partir do modelo {filename}: {str(e)}")
        finally:
            # Limpar arquivo temporário
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass

    def simulate_from_string(self, matpower_string: str, algorithm: str = 'nr') -> PowerSystemResult:
        """Simula um sistema a partir de uma string MATPOWER"""
        import tempfile
        import warnings
        
        # Suprimir warnings específicos do pandas/pandapower
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=FutureWarning, module="pandas")
            warnings.filterwarnings("ignore", category=FutureWarning, module="pandapower")
            
            # Corrigir baseKV no conteúdo antes de salvar
            fixed_content = self._fix_basekv_in_matpower_content(matpower_string)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.m', delete=False) as tmp:
                tmp.write(fixed_content)
                tmp_path = tmp.name
            
            try:
                self._debug_print(f"Criando rede a partir do arquivo: {tmp_path}")
                net = from_mpc(tmp_path)
                self._debug_print(f"Rede criada com sucesso. Buses: {len(net.bus)}")
                return self._run_simulation(net, algorithm)
            except Exception as e:
                self._debug_print(f"Erro ao criar/simular rede: {str(e)}")
                raise ValueError(f"Erro ao processar o arquivo MATPOWER: {str(e)}")
            finally:
                os.unlink(tmp_path)

    def _run_simulation(self, net: pp.pandapowerNet, algorithm: str = 'nr') -> PowerSystemResult:
        """Executa a simulação e converte os resultados"""
        import warnings
        import time
        
        try:
            # Suprimir warnings específicos do pandas/pandapower
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=FutureWarning, module="pandas")
                warnings.filterwarnings("ignore", category=FutureWarning, module="pandapower")
                
                self._debug_print(f"Iniciando simulação com algoritmo: {algorithm}...")
                start_time = time.time()
                
                # Executar com algoritmo especificado
                pp.runpp(net, algorithm=algorithm, numba=False)
                
                execution_time = time.time() - start_time
                self._debug_print("Simulação concluída com sucesso")
                self._debug_print(f"Tempo de execução: {execution_time:.4f}s")
                
                # Print adicional para debug imediato no console
                self._debug_print("=== DEBUG NET VARIABLE ===")
                self._debug_print(f"Bus count: {len(net.bus)}")
                self._debug_print(f"Line count: {len(net.line) if hasattr(net, 'line') else 0}")
                self._debug_print(f"Gen count: {len(net.gen) if hasattr(net, 'gen') else 0}")
                if hasattr(net, 'res_bus'):
                    self._debug_print(f"Bus results columns: {list(net.res_bus.columns)}")
                    self._debug_print("Bus results sample:")
                    self._debug_print(str(net.res_bus.head()))
                self._debug_print("=========================")
                
        except Exception as e:
            self._debug_print(f"Erro durante simulação: {str(e)}")
            raise ValueError(f"Erro na simulação do sistema: {str(e)}")
        
        # Capturar número de iterações do algoritmo
        iterations = 0
        
        # O pandapower não expõe diretamente as iterações do Newton-Raphson
        # Vamos tentar diferentes abordagens
        
        # 1. Verificar _ppc (estrutura interna do PYPOWER/MATPOWER)
        if hasattr(net, '_ppc') and net._ppc is not None and isinstance(net._ppc, dict):
            self._debug_print(f"_ppc disponível com chaves: {list(net._ppc.keys())}")
            
            # Tentar pegar de 'et' (elapsed time com iterações em algumas versões)
            if 'et' in net._ppc:
                et_value = net._ppc['et']
                self._debug_print(f"_ppc['et']: {et_value} (tipo: {type(et_value)})")
                # et geralmente é o tempo, mas em algumas versões tem iterações
                if isinstance(et_value, (list, tuple)) and len(et_value) > 0:
                    iterations = int(et_value[0]) if isinstance(et_value[0], (int, float)) else 0
            
            # Verificar 'iterations' diretamente
            if 'iterations' in net._ppc:
                iterations = int(net._ppc['iterations'])
                self._debug_print(f"Iterações em _ppc['iterations']: {iterations}")
            
            # Verificar estrutura success
            if 'success' in net._ppc:
                self._debug_print(f"Convergência: {net._ppc['success']}")
        
        # 2. Verificar se há informações de convergência
        if hasattr(net, 'converged'):
            self._debug_print(f"net.converged: {net.converged}")
        
        # 3. Verificar _options
        if hasattr(net, '_options') and net._options is not None:
            self._debug_print(f"_options: {net._options}")
        
        self._debug_print(f"Iterações finais: {iterations}, Tempo: {execution_time:.4f}s")
        
        return self._convert_results(net, iterations, execution_time, algorithm)

    def _convert_results(self, net: pp.pandapowerNet, iterations: int = 0, execution_time: float = 0.0, algorithm: str = 'nr') -> PowerSystemResult:
        """Converte os resultados do pandapower para nosso formato"""
        from app.models.power_system_results import (
            BusResult, LineResult, LoadResult, 
            GeneratorResult, ExtGridResult, PowerSystemResult
        )
        
        self._debug_print("Iniciando conversão de resultados...")
        self._debug_print(f"Colunas disponíveis em res_bus: {list(net.res_bus.columns)}")
        
        # Converter resultados das barras
        buses = []
        for i in range(len(net.bus)):
            try:
                bus_result = BusResult(
                    bus_id=int(i),
                    vm_pu=float(net.res_bus.vm_pu.iloc[i]),
                    va_degree=float(net.res_bus.va_degree.iloc[i]) if 'va_degree' in net.res_bus.columns else 0.0,
                    p_mw=float(net.res_bus.p_mw.iloc[i]) if 'p_mw' in net.res_bus.columns else 0.0,
                    q_mvar=float(net.res_bus.q_mvar.iloc[i]) if 'q_mvar' in net.res_bus.columns else 0.0
                )
                buses.append(bus_result)
            except Exception as e:
                self._debug_print(f"Erro ao converter bus {i}: {str(e)}")
                raise
        
        # Converter resultados das linhas
        lines = []
        if hasattr(net, 'line') and len(net.line) > 0:
            self._debug_print(f"Colunas disponíveis em res_line: {list(net.res_line.columns)}")
            self._debug_print("Iniciando conversão das linhas...")
            for i in range(len(net.line)):
                try:
                    self._debug_print(f"Convertendo os dados da linha são: {net.res_line.iloc[i].to_dict()}")
                    line_result = LineResult(
                        from_bus=int(net.line.from_bus.iloc[i]),
                        to_bus=int(net.line.to_bus.iloc[i]),
                        p_from_mw=float(net.res_line.p_from_mw.iloc[i]) if 'p_from_mw' in net.res_line.columns else 0.0,
                        q_from_mvar=float(net.res_line.q_from_mvar.iloc[i]) if 'q_from_mvar' in net.res_line.columns else 0.0,
                        p_to_mw=float(net.res_line.p_to_mw.iloc[i]) if 'p_to_mw' in net.res_line.columns else 0.0,
                        q_to_mvar=float(net.res_line.q_to_mvar.iloc[i]) if 'q_to_mvar' in net.res_line.columns else 0.0,
                        pl_mw=float(net.res_line.pl_mw.iloc[i]) if 'pl_mw' in net.res_line.columns else 0.0,
                        ql_mvar=float(net.res_line.ql_mvar.iloc[i]) if 'ql_mvar' in net.res_line.columns else 0.0,
                        i_from_ka=float(net.res_line.i_from_ka.iloc[i]) if 'i_from_ka' in net.res_line.columns else 0.0,
                        i_to_ka=float(net.res_line.i_to_ka.iloc[i]) if 'i_to_ka' in net.res_line.columns else 0.0,
                        i_ka=float(net.res_line.i_ka.iloc[i]) if 'i_ka' in net.res_line.columns else 0.0,
                        vm_from_pu=float(net.res_line.vm_from_pu.iloc[i]) if 'vm_from_pu' in net.res_line.columns else 0.0,
                        va_from_degree=float(net.res_line.va_from_degree.iloc[i]) if 'va_from_degree' in net.res_line.columns else 0.0,
                        vm_to_pu=float(net.res_line.vm_to_pu.iloc[i]) if 'vm_to_pu' in net.res_line.columns else 0.0,
                        va_to_degree=float(net.res_line.va_to_degree.iloc[i]) if 'va_to_degree' in net.res_line.columns else 0.0,
                        loading_percent=float(net.res_line.loading_percent.iloc[i]) if 'loading_percent' in net.res_line.columns else 0.0,
                        in_service=bool(net.line.in_service.iloc[i])
                    )
                    lines.append(line_result)
                except Exception as e:
                    self._debug_print(f"Erro ao converter line {i}: {str(e)}")
                    raise
            self._debug_print("Conversão das linhas concluída.")
        
        # Converter resultados dos transformadores como linhas também
        if hasattr(net, 'trafo') and len(net.trafo) > 0:
            self._debug_print(f"Conversão de transformadores como linhas...")
            self._debug_print(f"Número de transformadores: {len(net.trafo)}")
            self._debug_print(f"Colunas disponíveis em res_trafo: {list(net.res_trafo.columns)}")
            
            for i in range(len(net.trafo)):
                try:
                    self._debug_print(f"Convertendo transformador {i}: {net.res_trafo.iloc[i].to_dict()}")
                    trafo_result = LineResult(
                        from_bus=int(net.trafo.hv_bus.iloc[i]),  # High voltage bus
                        to_bus=int(net.trafo.lv_bus.iloc[i]),    # Low voltage bus
                        p_from_mw=float(net.res_trafo.p_hv_mw.iloc[i]) if 'p_hv_mw' in net.res_trafo.columns else 0.0,
                        q_from_mvar=float(net.res_trafo.q_hv_mvar.iloc[i]) if 'q_hv_mvar' in net.res_trafo.columns else 0.0,
                        p_to_mw=float(net.res_trafo.p_lv_mw.iloc[i]) if 'p_lv_mw' in net.res_trafo.columns else 0.0,
                        q_to_mvar=float(net.res_trafo.q_lv_mvar.iloc[i]) if 'q_lv_mvar' in net.res_trafo.columns else 0.0,
                        pl_mw=float(net.res_trafo.pl_mw.iloc[i]) if 'pl_mw' in net.res_trafo.columns else 0.0,
                        ql_mvar=float(net.res_trafo.ql_mvar.iloc[i]) if 'ql_mvar' in net.res_trafo.columns else 0.0,
                        i_from_ka=float(net.res_trafo.i_hv_ka.iloc[i]) if 'i_hv_ka' in net.res_trafo.columns else 0.0,
                        i_to_ka=float(net.res_trafo.i_lv_ka.iloc[i]) if 'i_lv_ka' in net.res_trafo.columns else 0.0,
                        i_ka=max(
                            float(net.res_trafo.i_hv_ka.iloc[i]) if 'i_hv_ka' in net.res_trafo.columns else 0.0,
                            float(net.res_trafo.i_lv_ka.iloc[i]) if 'i_lv_ka' in net.res_trafo.columns else 0.0
                        ),
                        vm_from_pu=float(net.res_trafo.vm_hv_pu.iloc[i]) if 'vm_hv_pu' in net.res_trafo.columns else 0.0,
                        va_from_degree=float(net.res_trafo.va_hv_degree.iloc[i]) if 'va_hv_degree' in net.res_trafo.columns else 0.0,
                        vm_to_pu=float(net.res_trafo.vm_lv_pu.iloc[i]) if 'vm_lv_pu' in net.res_trafo.columns else 0.0,
                        va_to_degree=float(net.res_trafo.va_lv_degree.iloc[i]) if 'va_lv_degree' in net.res_trafo.columns else 0.0,
                        loading_percent=float(net.res_trafo.loading_percent.iloc[i]) if 'loading_percent' in net.res_trafo.columns else 0.0,
                        in_service=bool(net.trafo.in_service.iloc[i])
                    )
                    lines.append(trafo_result)
                    self._debug_print(f"Transformador {i} convertido: {net.trafo.hv_bus.iloc[i]} -> {net.trafo.lv_bus.iloc[i]}")
                except Exception as e:
                    self._debug_print(f"Erro ao converter trafo {i}: {str(e)}")
                    if self.DEBUG_ENABLED:
                        import traceback
                        traceback.print_exc()
                    raise
            self._debug_print("Conversão dos transformadores concluída.")
        
        # Converter resultados das cargas
        loads = []
        if hasattr(net, 'load') and len(net.load) > 0:
            self._debug_print(f"Colunas disponíveis em res_load: {list(net.res_load.columns)}")
            for i in range(len(net.load)):
                try:
                    load_result = LoadResult(
                        bus_id=int(net.load.bus.iloc[i]),
                        p_mw=float(net.res_load.p_mw.iloc[i]) if 'p_mw' in net.res_load.columns else 0.0,
                        q_mvar=float(net.res_load.q_mvar.iloc[i]) if 'q_mvar' in net.res_load.columns else 0.0,
                        scaling=float(net.load.scaling.iloc[i]) if 'scaling' in net.load.columns else 1.0
                    )
                    loads.append(load_result)
                except Exception as e:
                    self._debug_print(f"Erro ao converter load {i}: {str(e)}")
                    raise
        
        # Converter resultados dos geradores
        generators = []
        if hasattr(net, 'gen') and len(net.gen) > 0:
            self._debug_print(f"Colunas disponíveis em res_gen: {list(net.res_gen.columns)}")
            for i in range(len(net.gen)):
                try:
                    gen_result = GeneratorResult(
                        bus_id=int(net.gen.bus.iloc[i]),
                        p_mw=float(net.res_gen.p_mw.iloc[i]) if 'p_mw' in net.res_gen.columns else 0.0,
                        q_mvar=float(net.res_gen.q_mvar.iloc[i]) if 'q_mvar' in net.res_gen.columns else 0.0,
                        vm_pu=float(net.gen.vm_pu.iloc[i]) if 'vm_pu' in net.gen.columns else 1.0,
                        in_service=bool(net.gen.in_service.iloc[i])
                    )
                    generators.append(gen_result)
                except Exception as e:
                    self._debug_print(f"Erro ao converter gen {i}: {str(e)}")
                    raise
        
        # Converter resultado da barra slack
        ext_grid = None
        if hasattr(net, 'ext_grid') and len(net.ext_grid) > 0:
            self._debug_print(f"Colunas disponíveis em res_ext_grid: {list(net.res_ext_grid.columns)}")
            try:
                bus_id = int(net.ext_grid.bus.iloc[0])
                # Obter tensão da barra slack após simulação
                vm_pu = float(net.res_bus.vm_pu.iloc[bus_id]) if bus_id < len(net.res_bus) else 1.0
                
                ext_grid = ExtGridResult(
                    bus_id=bus_id,
                    p_mw=float(net.res_ext_grid.p_mw.iloc[0]) if 'p_mw' in net.res_ext_grid.columns else 0.0,
                    q_mvar=float(net.res_ext_grid.q_mvar.iloc[0]) if 'q_mvar' in net.res_ext_grid.columns else 0.0,
                    vm_pu=vm_pu
                )
            except Exception as e:
                self._debug_print(f"Erro ao converter ext_grid: {str(e)}")
                raise
        
        self._debug_print("Conversão de resultados concluída com sucesso")
        
        # Calcular capacidade total dos geradores (P_max e Q_max)
        gen_capacity_p = 0.0
        gen_capacity_qmin = 0.0
        gen_capacity_qmax = 0.0

        if hasattr(net, 'gen') and len(net.gen) > 0:
            self._debug_print(f"Colunas disponíveis em gen: {list(net.gen.columns)}")

            # Usar métodos do pandas para somar diretamente (mais eficiente)
            if 'max_p_mw' in net.gen.columns:
                gen_capacity_p = float(net.gen.max_p_mw.sum())
                self._debug_print(f"P_max total encontrado: {gen_capacity_p} MW")

            if 'min_q_mvar' in net.gen.columns:
                gen_capacity_qmin = float(net.gen.min_q_mvar.sum())
                self._debug_print(f"Q_min total encontrado: {gen_capacity_qmin} MVAr")

            if 'max_q_mvar' in net.gen.columns:
                gen_capacity_qmax = float(net.gen.max_q_mvar.sum())
                self._debug_print(f"Q_max total encontrado: {gen_capacity_qmax} MVAr")

            self._debug_print(f"Capacidade total dos geradores: P={gen_capacity_p} MW, Qmin={gen_capacity_qmin} MVAr, Qmax={gen_capacity_qmax} MVAr")

        # Incluir ext_grid na capacidade se existir
        if hasattr(net, 'ext_grid') and len(net.ext_grid) > 0:
            self._debug_print(f"Colunas disponíveis em ext_grid: {list(net.ext_grid.columns)}")
            gen_capacity_p += net.ext_grid['max_p_mw'].sum() if 'max_p_mw' in net.ext_grid.columns else 0.0
            gen_capacity_qmin += net.ext_grid['min_q_mvar'].sum() if 'min_q_mvar' in net.ext_grid.columns else 0.0
            gen_capacity_qmax += net.ext_grid['max_q_mvar'].sum() if 'max_q_mvar' in net.ext_grid.columns else 0.0
            self._debug_print(f"Adicionando capacidade da ext_grid: P={net.ext_grid['max_p_mw'].sum()} MW, Q={net.ext_grid['max_q_mvar'].sum()} MVAr")

        # Calcular carga total ativa e reativa do sistema
        load_system_p = 0.0
        load_system_q = 0.0
        if hasattr(net, 'load') and len(net.load) > 0:
            load_system_p = float(net.load.p_mw.sum())
            load_system_q = float(net.load.q_mvar.sum())

        self._debug_print(f"Capacidade total dos geradores: P={gen_capacity_p} MW, Qmin={gen_capacity_qmin} MVAr, Qmax={gen_capacity_qmax} MVAr")
        self._debug_print(f"Carga total do sistema: P={load_system_p} MW, Q={load_system_q} MVAr")
        
        return PowerSystemResult(
            buses=buses,
            lines=lines,
            loads=loads,
            generators=generators,
            ext_grid=ext_grid,
            genCapacityP=gen_capacity_p,
            genCapacityQmin=gen_capacity_qmin,
            genCapacityQmax=gen_capacity_qmax,
            loadSystemP=load_system_p,
            loadSystemQ=load_system_q,
            iterations=iterations,
            execution_time_s=execution_time,
            algorithm=algorithm
        )