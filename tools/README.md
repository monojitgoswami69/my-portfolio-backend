# Chat API Tester

This directory contains a simple terminal-based tester for the backend chat API.

Requirements
- `httpx` is required (already listed in `backend/requirements.txt`).

Usage

Run a single message:

```bash
python tools/test_chat_api.py --message "Hello Nexus"
```

Run multiple repeats (useful for caching tests):

```bash
python tools/test_chat_api.py -m "Hello again" -c 5 -d 0.3
```

Interactive mode:

```bash
python tools/test_chat_api.py --interactive
```

Set session id (to test conversation continuity):

```bash
python tools/test_chat_api.py -m "Hi" -s session123
```

Specify a full host URL (default is `http://localhost:8000/api/v1/chat`):

```bash
python tools/test_chat_api.py -m "Hello" --host http://localhost:8000/api/v1/chat
```

Message file (one message per line):

```bash
python tools/test_chat_api.py -f ./messages.txt
```
