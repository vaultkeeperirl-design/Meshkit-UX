import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from services.hf_client import get_model_config

@pytest.mark.asyncio
async def test_get_model_config_network_error():
    model_id = "test/model"
    with patch("services.hf_client._client.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.RequestError("Mocked Connection Error")

        result = await get_model_config(model_id)

        assert "error" in result
        assert "Network error while fetching config" in result["error"]
        assert "Mocked Connection Error" in result["error"]

@pytest.mark.asyncio
async def test_get_model_config_invalid_json():
    model_id = "test/model"
    with patch("services.hf_client._client.get", new_callable=AsyncMock) as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.side_effect = ValueError("Invalid JSON")
        mock_get.return_value = mock_response

        result = await get_model_config(model_id)

        assert "error" in result
        assert "Invalid JSON response from HuggingFace" in result["error"]
        assert "Invalid JSON" in result["error"]

@pytest.mark.asyncio
async def test_get_model_config_non_200():
    model_id = "test/model"
    with patch("services.hf_client._client.get", new_callable=AsyncMock) as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        result = await get_model_config(model_id)

        assert "error" in result
        assert "Failed to fetch config for" in result["error"]
        assert "Status: 404" in result["error"]
