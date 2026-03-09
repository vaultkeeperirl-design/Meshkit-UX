from huggingface_hub import HfApi, ModelCard
import httpx

async def get_model_config(model_id: str, token: str = None) -> dict:
    """
    Fetches the config.json for a HuggingFace model without downloading the weights.
    Returns basic architecture details for visualization and compatibility checks.
    """
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    url = f"https://huggingface.co/{model_id}/resolve/main/config.json"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            return {"error": f"Failed to fetch config for {model_id}. Status: {response.status_code}. Is it a private/gated model without a valid token?"}

        config = response.json()

        # Extract the key features we need for compatibility checks and visualization
        # Different model types have slightly different naming conventions in config.json
        layers = config.get("num_hidden_layers") or config.get("n_layer") or config.get("num_layers", 0)
        hidden_size = config.get("hidden_size") or config.get("n_embd", 0)
        vocab_size = config.get("vocab_size", 0)
        architectures = config.get("architectures", [])

        return {
            "model_id": model_id,
            "architectures": architectures,
            "num_layers": layers,
            "hidden_size": hidden_size,
            "vocab_size": vocab_size,
            "full_config": config
        }
