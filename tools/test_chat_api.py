#!/usr/bin/env python3
"""
Terminal tester for backend chat API

Usage examples:
  python tools/test_chat_api.py --message "Hello Nexus"
  python tools/test_chat_api.py --interactive
  python tools/test_chat_api.py --host http://localhost:8000 --message-file messages.txt

This script uses `httpx` (already in backend/requirements.txt).
"""
import argparse
import json
import sys
import time
from typing import Optional

import httpx

DEFAULT_URL = "http://localhost:8000/api/v1/chat"


def send_message(client: httpx.Client, url: str, message: str, session_id: Optional[str] = None, timeout: int = 30):
    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id
    try:
        r = client.post(url, json=payload, timeout=timeout)
    except Exception as e:
        print(f"Request failed: {e}")
        return None, None
    if r.status_code != 200:
        try:
            data = r.json()
        except Exception:
            data = r.text
        return r.status_code, data
    try:
        return 200, r.json()
    except Exception:
        return 200, r.text


def interactive_mode(client: httpx.Client, url: str):
    print("Interactive mode. Type your message and press Enter. Type /exit to quit.")
    session_id = None
    while True:
        try:
            msg = input('\nYou: ').strip()
        except (KeyboardInterrupt, EOFError):
            print('\nExiting.')
            break
        if not msg:
            continue
        if msg.lower() in ('/exit', 'exit'):
            break
        if msg.lower().startswith('/session '):
            session_id = msg.split(' ', 1)[1].strip()
            print(f"Session set to: {session_id}")
            continue
        status, data = send_message(client, url, msg, session_id=session_id)
        if status != 200:
            print(f"Error ({status}): {data}")
        else:
            print('\nResponse:')
            print(json.dumps(data, indent=2))


def main():
    parser = argparse.ArgumentParser(description='Terminal chat API tester')
    parser.add_argument('--host', type=str, default=DEFAULT_URL, help='Full chat API URL')
    parser.add_argument('--message', '-m', type=str, help='Message to send')
    parser.add_argument('--message-file', '-f', type=str, help='File with one message per line')
    parser.add_argument('--interactive', '-i', action='store_true', help='Enter interactive mode')
    parser.add_argument('--session', '-s', type=str, help='Optional session_id to send')
    parser.add_argument('--count', '-c', type=int, default=1, help='Repeat message N times (useful for caching tests)')
    parser.add_argument('--delay', '-d', type=float, default=0.5, help='Delay between repeated requests (seconds)')
    args = parser.parse_args()

    url = args.host
    client = httpx.Client()

    if args.interactive:
        interactive_mode(client, url)
        return

    messages = []
    if args.message:
        messages = [args.message]
    elif args.message_file:
        try:
            with open(args.message_file, 'r', encoding='utf-8') as fh:
                messages = [line.strip() for line in fh.readlines() if line.strip()]
        except Exception as e:
            print(f"Failed to read message file: {e}")
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(0)

    for msg in messages:
        for i in range(args.count):
            print(f"\n--- Request {i+1} for message: {msg} ---")
            start = time.perf_counter()
            status, data = send_message(client, url, msg, session_id=args.session)
            elapsed = (time.perf_counter() - start) * 1000
            if status != 200:
                print(f"Error ({status}) [{elapsed:.1f}ms]: {data}")
            else:
                print(f"OK [{elapsed:.1f}ms]")
                # Pretty print response
                try:
                    print(json.dumps(data, indent=2))
                except Exception:
                    print(data)
            time.sleep(args.delay)


if __name__ == '__main__':
    main()
