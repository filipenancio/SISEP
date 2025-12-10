from fastapi import APIRouter, HTTPException, UploadFile, File, Path, Query
from typing import List
from app.models.power_system_results import PowerSystemResult
from app.services.matpower_service import MatpowerService

router = APIRouter()
matpower_service = MatpowerService()

@router.get("/matpower/files", response_model=List[str])
async def list_matpower_files():
    """
    Lista todos os modelos do MATPOWER disponíveis no sistema.
    
    Returns:
        List[str]: Lista de nomes dos arquivos .m disponíveis
    """
    try:
        return matpower_service.list_available_files()
    except ValueError as e:
        # Erro de validação ou arquivo não encontrado
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # Outros erros inesperados
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@router.get("/matpower/{filename}", response_model=PowerSystemResult)
async def simulate_matpower_filename(
    filename: str = Path(
        ..., 
        description="Nome do arquivo MATPOWER (ex: case4gs.m, case5.m, case6ww.m, case9.m, case14.m)",
        examples={"default": {"value": "case4gs.m"}}
    ),
    algorithm: str = Query(
        "nr",
        description="Algoritmo de fluxo de potência (nr, fdxb, fdbx, bfsw, gs, dc)",
        examples={"default": {"value": "nr"}}
    )
):
    """
    Simula um sistema a partir de um arquivo MATPOWER pré carregado.
    
    Args:
        filename (str): Nome do arquivo MATPOWER a ser simulado
        algorithm (str): Algoritmo a ser utilizado (padrão: nr - Newton-Raphson)
        
    Returns:
        PowerSystemResult: Resultados da simulação do fluxo de potência
    """
    try:
        return matpower_service.simulate_from_filename(filename, algorithm)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate/matpower/upload", response_model=PowerSystemResult)
async def simulate_matpower_upload(
    file: UploadFile = File(..., description="Arquivo MATPOWER (.m)"),
    algorithm: str = Query(
        "nr",
        description="Algoritmo de fluxo de potência (nr, fdxb, fdbx, bfsw, gs, dc)",
        examples={"default": {"value": "nr"}}
    )
):
    """
    Simula um sistema a partir de um arquivo MATPOWER enviado.
    
    Args:
        file (UploadFile): Arquivo MATPOWER a ser simulado
        algorithm (str): Algoritmo a ser utilizado (padrão: nr - Newton-Raphson)
        
    Returns:
        PowerSystemResult: Resultados da simulação do fluxo de potência
    """
    try:
        content = await file.read()
        return matpower_service.simulate_from_string(content.decode(), algorithm)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
