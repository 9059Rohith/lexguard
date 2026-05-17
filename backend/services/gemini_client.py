"""
Gemini AI client — drop-in replacement for groq_client.
Uses google-generativeai SDK with asyncio.to_thread for async compatibility.
Implements the same interface: complete(), complete_json(), stream_chat().
"""

import json
import asyncio
from typing import AsyncGenerator, List, Optional

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from config import settings


class GeminiClient:
    def __init__(self):
        self._model: Optional[genai.GenerativeModel] = None

    @property
    def model(self) -> genai.GenerativeModel:
        if self._model is None:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
        return self._model

    async def complete(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> str:
        prompt = f"{system_prompt}\n\n{user_message}" if user_message else system_prompt
        config = GenerationConfig(temperature=temperature, max_output_tokens=max_tokens)
        response = await asyncio.to_thread(
            self.model.generate_content,
            prompt,
            generation_config=config,
        )
        try:
            return response.text or ""
        except Exception:
            # Safety-blocked or empty response
            return ""

    async def complete_json(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ):
        content = await self.complete(system_prompt, user_message, temperature, max_tokens)
        content = content.strip()
        # Strip markdown fences
        if content.startswith("```"):
            lines = content.split("\n")
            lines = [ln for ln in lines if not ln.startswith("```")]
            content = "\n".join(lines).strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Try to extract JSON array
            start = content.find("[")
            end = content.rfind("]") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(content[start:end])
                except json.JSONDecodeError:
                    pass
            # Try JSON object
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(content[start:end])
                except json.JSONDecodeError:
                    pass
            return []

    async def stream_chat(
        self,
        system_prompt: str,
        messages: List[dict],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[str, None]:
        """
        Streams a chat response token by token.
        Builds conversation history from messages list, appends system context.
        """
        # Build Gemini-compatible history (all but last user message)
        history = []
        for msg in messages[:-1]:
            role = "user" if msg.get("role") == "user" else "model"
            history.append({"role": role, "parts": [msg.get("content", "")]})

        chat_session = self.model.start_chat(history=history)
        last_msg = messages[-1].get("content", "") if messages else ""

        # Prepend system context to the final user message
        full_user_msg = f"{system_prompt}\n\nUser query: {last_msg}"

        config = GenerationConfig(temperature=temperature, max_output_tokens=max_tokens)

        # Run streaming in a thread; collect chunks into a queue
        queue: asyncio.Queue = asyncio.Queue()

        def _run_stream():
            try:
                for chunk in chat_session.send_message(
                    full_user_msg,
                    generation_config=config,
                    stream=True,
                ):
                    try:
                        text = chunk.text
                        if text:
                            queue.put_nowait(text)
                    except Exception:
                        pass
            except Exception as e:
                queue.put_nowait(f"\n[Error: {e}]")
            finally:
                queue.put_nowait(None)  # sentinel

        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, _run_stream)

        while True:
            token = await queue.get()
            if token is None:
                break
            yield token


# Singleton
gemini_client = GeminiClient()
