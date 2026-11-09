"""Minimal .env support for the Gesture Engine (no extra dependency).

Importing this module loads "Gesture Engine/.env" into os.environ. Values
already set in the real environment always win. The .env file is git-ignored,
so camera passwords and tokens stay out of source control. See .env.example.
"""

import os

ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINE_ENV_PATH = os.path.join(ENGINE_DIR, '.env')
BACKEND_ENV_PATH = os.path.join(ENGINE_DIR, '..', 'backend', '.env')


def read_env_file(path):
    """Parse KEY=VALUE lines from a .env file into a dict ({} if missing)."""
    values = {}
    try:
        with open(path, encoding='utf-8') as env_file:
            for line in env_file:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                key, sep, value = line.partition('=')
                if not sep:
                    continue
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                    value = value[1:-1]
                values[key.strip()] = value
    except OSError:
        pass
    return values


def load_env_file(path=ENGINE_ENV_PATH):
    for key, value in read_env_file(path).items():
        os.environ.setdefault(key, value)


def ai_engine_token():
    """Shared secret for Laravel's /api/ai/* routes.

    Uses AI_ENGINE_TOKEN from the environment (or Gesture Engine/.env), and
    otherwise falls back to backend/.env for a same-machine setup.
    """
    token = os.getenv('AI_ENGINE_TOKEN', '').strip()
    if token:
        return token
    return read_env_file(BACKEND_ENV_PATH).get('AI_ENGINE_TOKEN', '').strip()


load_env_file()
