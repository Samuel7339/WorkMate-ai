import os
from dotenv import load_dotenv

load_dotenv()

AGENT_MODEL = os.environ["AGENT_MODEL"]

FALLBACK_MODEL = os.getenv(
    "FALLBACK_MODEL",
    AGENT_MODEL,
)