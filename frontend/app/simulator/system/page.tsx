"use client";
import { useState, useRef, useEffect } from "react";
import styles from "../styles.module.css";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "../components/Footer";
import HeaderChild from "../components/HeaderChild";
import MessageModal from "../components/MessageModal";
import { BaseBusSystemDiagram } from "../components/PowerSystemElements";
import { sistema3Barras } from "../data/case3p";
import { sistema4Barras } from "../data/case4p";
import { sistema5Barras } from "../data/case5p";
import { sistema14Barras } from "../data/case14p";
import { MPC, MPCResult } from "../utils/SimulateUtils";
import { mpcToMatpower } from "../utils/MPCToMatpower";
import { formatInput } from "../utils/FormattedInput";
import { formatResults } from "../utils/FormattedOutput";
import html2canvas from 'html2canvas';

export default function SystemModel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const systemName = searchParams.get('system');
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'simulating' | 'result'>('idle');
  const [simulationResult, setSimulationResult] = useState<MPCResult | null>(null);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ 
    show: false, 
    message: '' 
  });
  const [exportModal, setExportModal] = useState<{ show: boolean; message: string }>({ 
    show: false, 
    message: '' 
  });
  
  // Função para obter o sistema correto baseado no nome
  const getInitialSystem = (): MPC => {
    switch (systemName) {
      case 'case3p.m':
        return sistema3Barras
      case 'case4p.m':
        return sistema4Barras;
      case 'case5p.m':
        return sistema5Barras;
      case 'case14p.m':
        return sistema14Barras;
      default:
        return sistema3Barras;
    }
  };

  const [inputMPC, setInputMPC] = useState<MPC>(getInitialSystem());
  const diagramRef = useRef<HTMLDivElement>(null);

  // Listener para capturar dados da simulação
  useEffect(() => {
    const handleSimulationComplete = (event: any) => {
      if (event.detail) {
        setSimulationResult(event.detail.result);
        setInputMPC(event.detail.input);
      }
    };

    window.addEventListener('simulationComplete', handleSimulationComplete);
    return () => {
      window.removeEventListener('simulationComplete', handleSimulationComplete);
    };
  }, []);

  // Listener para capturar erros da simulação
  useEffect(() => {
    const handleSimulationError = (event: any) => {
      console.error('Evento de erro de simulação capturado:', event.detail);
      
      const error = event.detail?.error;
      let errorMessage = '';
      
      if (error instanceof Error) {
        // Erros do backend
        if (error.message === 'CONVERGENCE_ERROR') {
          errorMessage = 'ERRO: Dados informados não convergiram!';
        } else if (error.message === 'BACKEND_ERROR') {
          errorMessage = 'ERRO: Simulação não concluída, aguarde e tente novamente mais tarde.';
        } else {
          // Erro na preparação dos dados (frontend)
          errorMessage = 'Houve um erro na preparação dos dados de simulação. Por favor, tente novamente mais tarde.';
        }
      } else {
        // Erro desconhecido
        errorMessage = 'Houve um erro na preparação dos dados de simulação. Por favor, tente novamente mais tarde.';
      }
      
      setErrorModal({ show: true, message: errorMessage });
    };

    window.addEventListener('simulationError', handleSimulationError);
    return () => {
      window.removeEventListener('simulationError', handleSimulationError);
    };
  }, []);

  const getSystemTitle = () => {
    switch (systemName) {
      case 'case3p.m':
        return 'Sistema de 3 Barras';
      case 'case4p.m':
        return 'Sistema de 4 Barras';
      case 'case5p.m':
        return 'Sistema de 5 Barras';
      case 'case14p.m':
        return 'Sistema de 14 Barras';
      default:
        return 'Sistema';
    }
  };

  const getPerfInfo = () => {
    if (!simulationResult || simulationStatus !== 'result') return '';
    
    // Mapear código do algoritmo para nome completo
    const algorithmNames: { [key: string]: string } = {
      'nr': 'Newton-Raphson',
      'fdxb': 'Fast Decoupled XB',
      'fdbx': 'Fast Decoupled BX',
      'bfsw': 'Backward/Forward Sweep',
      'gs': 'Gauss-Seidel',
      'dc': 'DC Power Flow'
    };
    
    const iterations = simulationResult.iterations || 0;
    const executionTime = simulationResult.execution_time_s || 0.0;
    const algorithm = simulationResult.algorithm || 'nr';
    const algorithmName = algorithmNames[algorithm] || algorithm;
    
    return ` (Algoritmo: ${algorithmName}, ${iterations} iterações, ${executionTime.toFixed(4)}s)`;
  };

  const generatePDF = async () => {
    if (!simulationResult || !inputMPC) {
      setExportModal({ 
        show: true, 
        message: 'Nenhum resultado de simulação disponível para exportar.' 
      });
      return;
    }

    try {
      // Importar jsPDF dinamicamente
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule;
      
      if (!jsPDF) {
        throw new Error('Falha ao carregar biblioteca jsPDF');
      }
      
      // Criar PDF em orientação retrato
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 5;
      const maxLineWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Função para quebrar texto respeitando a largura máxima
      const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
        doc.setFontSize(fontSize);
        
        if (!text || text.trim() === '') {
          return [''];
        }
        
        const lines: string[] = [];
        let currentLine = '';
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const testLine = currentLine + char;
          
          if (doc.getTextWidth(testLine) <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine.length > 0) {
              lines.push(currentLine);
              currentLine = char;
            } else {
              lines.push(char);
              currentLine = '';
            }
          }
        }
        
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
      };

      // Função para verificar se precisa de nova página
      const checkNewPage = (linesToAdd: number = 1) => {
        if (yPosition + (lineHeight * linesToAdd) > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Título do relatório
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Simulação - SISEP", pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Data e hora
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleString('pt-BR');
      doc.text(`Gerado em: ${currentDate}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Sistema: ${getSystemTitle()}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Seção de entrada
      checkNewPage(3);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Entrada (Código MATPOWER):", margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Converter MPC para formato MATPOWER e formatar
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      const matpowerText = mpcToMatpower(inputMPC, systemName?.replace('.m', '') || 'case3p');
      const formattedInputText = formatInput(matpowerText);
      const inputLines = formattedInputText.split('\n');
      
      for (const originalLine of inputLines) {
        const wrappedLines = wrapText(originalLine, maxLineWidth, 8);
        
        for (const wrappedLine of wrappedLines) {
          checkNewPage();
          doc.text(wrappedLine, margin, yPosition);
          yPosition += lineHeight;
        }
      }

      yPosition += lineHeight;

      // Seção de saída
      checkNewPage(3);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resultados da Simulação:", margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Converter resultado para formato compatível com formatResults
      // console.log('[DEBUG] Linhas recebidas do backend:', simulationResult.lines);
      // console.log('[DEBUG] Número de linhas:', simulationResult.lines.length);
      
      const resultForFormatting = {
        buses: simulationResult.bus.map(b => ({
          bus_id: b.bus_id,
          vm_pu: b.vm_pu,
          va_degree: b.va_degree,
          p_mw: b.p_mw,
          q_mvar: b.q_mvar
        })),
        generators: simulationResult.generators,
        loads: simulationResult.loads,
        lines: simulationResult.lines.map(l => {
          // console.log(`[DEBUG] Processando linha: ${l.from_bus}-${l.to_bus}`);
          return {
            from_bus: l.from_bus, // Backend já retorna 0-indexed
            to_bus: l.to_bus,
            p_from_mw: l.p_from_mw,
            q_from_mvar: l.q_from_mvar,
            p_to_mw: l.p_to_mw,
            q_to_mvar: l.q_to_mvar,
            pl_mw: l.p_loss_mw,
            ql_mvar: l.q_loss_mvar
          };
        }),
        ext_grid: simulationResult.ext_grid.length > 0 ? simulationResult.ext_grid[0] : null,
        genCapacityP: simulationResult.genCapacityP,
        genCapacityQmin: simulationResult.genCapacityQmin,
        genCapacityQmax: simulationResult.genCapacityQmax,
        loadSystemP: simulationResult.loadSystemP,
        loadSystemQ: simulationResult.loadSystemQ,
        iterations: simulationResult.iterations,
        execution_time_s: simulationResult.execution_time_s,
        algorithm: simulationResult.algorithm || 'nr'
      };

      // Processar saída com fonte 9
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      const formattedOutput = formatResults(resultForFormatting);
      const outputLines = formattedOutput.split('\n');
      
      for (const originalLine of outputLines) {
        if (originalLine.trim() === '') {
          yPosition += lineHeight * 0.5;
          continue;
        }
      
        checkNewPage();
        doc.text(originalLine, margin, yPosition);
        yPosition += lineHeight;
      }

      // Capturar diagrama (apenas SVG sem controles)
      if (diagramRef.current) {
        checkNewPage(80);
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Diagrama do Sistema:", margin, yPosition);
        yPosition += lineHeight * 2;

        // Adicionar classe temporária para ocultar elementos indesejados
        diagramRef.current.classList.add('pdf-export-mode');

        // Capturar o diagrama
        const canvas = await html2canvas(diagramRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.pdf-export-mode');
            if (clonedElement) {
              // Ocultar elementos não desejados no clone
              const elementsToHide = clonedElement.querySelectorAll(
                '.zoom-controls, .legend-box, .base-values-box, .result-totals-box, button'
              );
              elementsToHide.forEach(el => {
                (el as HTMLElement).style.display = 'none';
              });
            }
          }
        });
        
        // Remover classe temporária
        diagramRef.current.classList.remove('pdf-export-mode');
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Adicionar nova página se necessário
        if (yPosition + imgHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      }

      // Salvar o PDF
      const fileName = `relatorio-${systemName?.replace('.m', '') || 'sistema'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setExportModal({ 
        show: true, 
        message: `Erro ao gerar o relatório PDF: ${errorMessage}\n\nVerifique o console para mais detalhes.` 
      });
    }
  };

  return (
    <div className={`${styles.container} ${styles.systemPage}`}>
      <Image
        src="/transmission-lines.jpg"
        alt="Transmission Lines Background"
        fill
        priority
        className={styles.backgroundImage}
      />
      <div className={styles.overlay} />

      <HeaderChild title="Modelo Interativo - SISEP" logoSize={80} />

      <main className={styles.mainContent}>
        <div className={styles.contentContainer}>
          <h2 className={styles.systemTitle}>
            {getSystemTitle()}
            {simulationStatus === 'result' && (
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal', 
                color: '#666',
                marginLeft: '10px'
              }}>
                {getPerfInfo()}
              </span>
            )}
          </h2>
          <div className={styles.systemDiagram} ref={diagramRef}>
            {(systemName === 'case3p.m' || systemName === 'case4p.m' || systemName === 'case5p.m' || systemName === 'case14p.m') ? (
              <BaseBusSystemDiagram
                externalControls={true}
                onSimulationStatusChange={setSimulationStatus}
                initialSystem={getInitialSystem()}
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#666',
                fontSize: '18px'
              }}>
                Diagrama do sistema será exibido aqui
              </div>
            )}
          </div>
        </div>
      </main>

      <div className={styles.actions}>
        <button
          className={styles.backButton}
          onClick={() => {
            if (simulationStatus === 'result') {
              // Se estiver visualizando resultado, volta para modo de edição
              const event = new CustomEvent('backToEdit');
              window.dispatchEvent(event);
              setSimulationStatus('idle');
            } else {
              // Se estiver em modo de edição, volta para o menu
              router.push('/simulator');
            }
          }}
        >
          VOLTAR
        </button>
        {simulationStatus === 'result' ? (
          <button
            className={styles.exportButton}
            onClick={generatePDF}
          >
            EXPORTAR
          </button>
        ) : (
          <button
            className={styles.simulateButton}
            onClick={() => {
              // console.log('Botão SIMULAR clicado, disparando evento');
              const event = new CustomEvent('triggerSimulation');
              window.dispatchEvent(event);
              // console.log('Evento triggerSimulation disparado');
            }}
            disabled={simulationStatus === 'simulating'}
          >
            {simulationStatus === 'simulating' ? 'SIMULANDO...' : 'SIMULAR'}
          </button>
        )}
      </div>

      <Footer />
      
      {/* Modal de erro */}
      <MessageModal
        show={errorModal.show}
        title="Erro na Simulação"
        message={errorModal.message}
        buttons={[
          {
            label: 'OK',
            onClick: () => setErrorModal({ show: false, message: '' }),
            variant: 'primary'
          }
        ]}
        onClose={() => setErrorModal({ show: false, message: '' })}
      />
      
      {/* Modal de exportação */}
      <MessageModal
        show={exportModal.show}
        title="Exportação de Relatório"
        message={exportModal.message}
        buttons={[
          {
            label: 'OK',
            onClick: () => setExportModal({ show: false, message: '' }),
            variant: 'primary'
          }
        ]}
        onClose={() => setExportModal({ show: false, message: '' })}
      />
    </div>
  );
}