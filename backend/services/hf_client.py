from huggingface_hub import HfApi, ModelCard
import httpx

# Global HTTPX client to reuse connection pools across requests
_client = httpx.AsyncClient()

async def get_model_config(model_id: str, token: str = None) -> dict:
    """
    Fetches the config.json for a HuggingFace model without downloading the weights.

    Retrieves basic architecture details directly from the HuggingFace API for use
    in UI visualization and compatibility checks. Returns an error dictionary if
    the fetch or parsing fails.

    Args:
        model_id (str): The identifier of the HuggingFace model (e.g., 'meta-llama/Meta-Llama-3-8B').
        token (str, optional): A HuggingFace API token to access gated or private models.
            Defaults to None.

    Returns:
        dict: A dictionary containing either the extracted architectural features (like
            'num_layers' and 'hidden_size') or an 'error' key detailing why the request failed.
    """
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    url = f"https://huggingface.co/{model_id}/resolve/main/config.json"

    try:
        response = await _client.get(url, headers=headers)
        if response.status_code != 200:
            return {"error": f"Failed to fetch config for {model_id}. Status: {response.status_code}. Is it a private/gated model without a valid token?"}

        config = response.json()
    except httpx.RequestError as e:
        return {"error": f"Network error while fetching config for {model_id}: {str(e)}"}
    except ValueError as e:
        return {"error": f"Invalid JSON response from HuggingFace for {model_id}: {str(e)}"}

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
