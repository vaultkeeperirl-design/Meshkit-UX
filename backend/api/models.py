from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class HFConfigReq(BaseModel):
    model_id: str
    token: Optional[str] = None

class ModelLayerConfig(BaseModel):
    model: str
    layer_range: Optional[List[int]] = None

class MergeConfigReq(BaseModel):
    merge_method: str
    base_model: Optional[str] = None
    models: List[Dict[str, Any]]
    parameters: Dict[str, Any]
    output_path: str = "./merged_model"

class QuantizeConfigReq(BaseModel):
    model_path: str
    quant_type: str = "q4_k_m"
    output_path: str = "./merged_model_q4_k_m.gguf"
