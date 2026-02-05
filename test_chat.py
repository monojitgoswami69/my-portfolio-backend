#!/usr/bin/env python3
"""
Terminal-based tester for NEXUS Chat API
Supports both regular and streaming endpoints.
"""
import sys
import json
import argparse
from typing import Optional
import requests
from datetime import datetime


# ANSI colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    GRAY = '\033[90m'


def print_header(text: str):
    """Print formatted header."""
    print(f"\n{Colors.BOLD}{Colors.OKCYAN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.OKCYAN}{text:^60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.OKCYAN}{'='*60}{Colors.ENDC}\n")


def print_user(text: str):
    """Print user message."""
    print(f"{Colors.BOLD}{Colors.OKGREEN}➜ You:{Colors.ENDC} {text}")


def print_bot(text: str, end: str = '\n'):
    """Print bot message."""
    print(f"{Colors.BOLD}{Colors.OKBLUE}🤖 Bot:{Colors.ENDC} {text}", end=end)


def print_error(text: str):
    """Print error message."""
    print(f"{Colors.FAIL}✗ Error:{Colors.ENDC} {text}")


def print_success(text: str):
    """Print success message."""
    print(f"{Colors.OKGREEN}✓{Colors.ENDC} {text}")


def print_info(text: str):
    """Print info message."""
    print(f"{Colors.GRAY}{text}{Colors.ENDC}")


def test_regular_endpoint(base_url: str, message: str, session_id: Optional[str] = None):
    """Test the regular (non-streaming) chat endpoint."""
    print_header("Testing Regular Endpoint")
    print_user(message)

    url = f"{base_url}/api/v1/chat"
    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id

    try:
        print_info("Sending request...")
        start_time = datetime.now()

        response = requests.post(url, json=payload, timeout=30)

        elapsed = (datetime.now() - start_time).total_seconds()

        if response.status_code == 200:
            data = response.json()
            print_success(f"Response received in {elapsed:.2f}s")
            print_info(f"Status: {data.get('status')}")
            print_info(f"Cached: {data.get('cached')}")
            print_info(f"Timestamp: {data.get('timestamp')}")
            print()
            print_bot(data.get('response', 'No response'))
        else:
            print_error(f"HTTP {response.status_code}: {response.text}")

    except requests.exceptions.Timeout:
        print_error("Request timed out after 30 seconds")
    except requests.exceptions.ConnectionError:
        print_error(f"Could not connect to {url}")
    except Exception as e:
        print_error(f"Unexpected error: {e}")


def test_streaming_endpoint(base_url: str, message: str, session_id: Optional[str] = None):
    """Test the streaming chat endpoint."""
    print_header("Testing Streaming Endpoint")
    print_user(message)

    url = f"{base_url}/api/v1/chat/stream"
    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id

    try:
        print_info("Starting stream...")
        start_time = datetime.now()

        with requests.post(url, json=payload, stream=True, timeout=30) as response:
            if response.status_code != 200:
                print_error(f"HTTP {response.status_code}: {response.text}")
                return

            print_bot("", end="")
            sys.stdout.flush()

            buffer = ""
            last_printed_length = 0

            for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
                if chunk:
                    buffer += chunk

                    # Process complete lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)

                        if line.startswith('data: '):
                            try:
                                data = json.loads(line[6:])  # Remove 'data: ' prefix

                                if 'chunk' in data:
                                    full_text = data['chunk']
                                    # Print only the new part
                                    new_part = full_text[last_printed_length:]
                                    if new_part:
                                        print(new_part, end="", flush=True)
                                        last_printed_length = len(full_text)

                                if data.get('done'):
                                    print()  # New line after streaming completes
                                    elapsed = (datetime.now() - start_time).total_seconds()
                                    print_success(f"Stream completed in {elapsed:.2f}s")
                                    return

                            except json.JSONDecodeError:
                                pass

            # If we exit the loop without seeing done=True
            print()
            elapsed = (datetime.now() - start_time).total_seconds()
            print_success(f"Stream ended in {elapsed:.2f}s")

    except requests.exceptions.Timeout:
        print_error("Stream timed out after 30 seconds")
    except requests.exceptions.ConnectionError:
        print_error(f"Could not connect to {url}")
    except Exception as e:
        print_error(f"Unexpected error: {e}")


def interactive_mode(base_url: str, use_streaming: bool = True):
    """Interactive chat mode."""
    mode = "Streaming" if use_streaming else "Regular"
    print_header(f"Interactive Mode ({mode})")
    print_info("Type your message and press Enter. Type 'exit' or 'quit' to stop.\n")

    session_id = None  # You can generate a unique session ID if needed

    while True:
        try:
            user_input = input(f"{Colors.BOLD}{Colors.OKGREEN}➜ You:{Colors.ENDC} ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['exit', 'quit', 'q']:
                print_info("Exiting...")
                break

            if use_streaming:
                test_streaming_endpoint(base_url, user_input, session_id)
            else:
                test_regular_endpoint(base_url, user_input, session_id)

            print()  # Add spacing between exchanges

        except KeyboardInterrupt:
            print_info("\nExiting...")
            break
        except EOFError:
            break


def test_health_endpoint(base_url: str):
    """Test the health endpoint."""
    print_header("Testing Health Endpoint")

    url = f"{base_url}/api/v1/chat/health"

    try:
        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()
            print_success("Health check passed")
            print_info(f"Status: {data.get('status')}")
            print_info(f"GenAI Available: {data.get('genai_available')}")
            print_info(f"Cache Stale: {data.get('cache_stale')}")
            print_info(f"Last Refresh: {data.get('last_refresh')}")
        else:
            print_error(f"HTTP {response.status_code}: {response.text}")

    except requests.exceptions.ConnectionError:
        print_error(f"Could not connect to {url}")
    except Exception as e:
        print_error(f"Unexpected error: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Terminal-based tester for NEXUS Chat API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive streaming mode (default)
  python test_chat.py -i

  # Interactive regular mode
  python test_chat.py -i --no-stream

  # Single message test (streaming)
  python test_chat.py -m "What are your skills?"

  # Single message test (regular)
  python test_chat.py -m "What are your skills?" --no-stream

  # Test health endpoint
  python test_chat.py --health

  # Use custom backend URL
  python test_chat.py -i --url https://api.example.com
        """
    )

    parser.add_argument(
        '-u', '--url',
        default='http://localhost:8000',
        help='Base URL of the backend API (default: http://localhost:8000)'
    )
    parser.add_argument(
        '-m', '--message',
        help='Single message to test (non-interactive mode)'
    )
    parser.add_argument(
        '-i', '--interactive',
        action='store_true',
        help='Start interactive chat mode'
    )
    parser.add_argument(
        '--no-stream',
        action='store_true',
        help='Use regular endpoint instead of streaming'
    )
    parser.add_argument(
        '--health',
        action='store_true',
        help='Test the health endpoint'
    )

    args = parser.parse_args()

    # Print banner
    print(f"{Colors.BOLD}{Colors.HEADER}")
    print("  ╔╗╔╔═╗═╗ ╦╦ ╦╔═╗  ╔═╗╦ ╦╔═╗╔╦╗  ╔╦╗╔═╗╔═╗╔╦╗╔═╗╦═╗")
    print("  ║║║║╣ ╔╩╦╝║ ║╚═╗  ║  ╠═╣╠═╣ ║    ║ ║╣ ╚═╗ ║ ║╣ ╠╦╝")
    print("  ╝╚╝╚═╝╩ ╚═╚═╝╚═╝  ╚═╝╩ ╩╩ ╩ ╩    ╩ ╚═╝╚═╝ ╩ ╚═╝╩╚═")
    print(f"{Colors.ENDC}")
    print_info(f"Backend URL: {args.url}\n")

    # Determine what to do
    if args.health:
        test_health_endpoint(args.url)
    elif args.interactive:
        interactive_mode(args.url, use_streaming=not args.no_stream)
    elif args.message:
        if args.no_stream:
            test_regular_endpoint(args.url, args.message)
        else:
            test_streaming_endpoint(args.url, args.message)
    else:
        # Default: interactive streaming mode
        interactive_mode(args.url, use_streaming=True)


if __name__ == "__main__":
    main()
