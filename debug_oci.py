#!/usr/bin/env python3
import sys
import json
import os

print("Debug OCI Script")
print("Arguments:", sys.argv)
print("Current directory:", os.getcwd())

if len(sys.argv) < 3:
    print("Usage: python3 debug_oci.py --credentials <file> --operation <op>")
    sys.exit(1)

credentials_file = None
operation = None

for i, arg in enumerate(sys.argv):
    if arg == '--credentials' and i + 1 < len(sys.argv):
        credentials_file = sys.argv[i + 1]
    elif arg == '--operation' and i + 1 < len(sys.argv):
        operation = sys.argv[i + 1]

print(f"Credentials file: {credentials_file}")
print(f"Operation: {operation}")

if credentials_file and os.path.exists(credentials_file):
    print("Credentials file exists")
    with open(credentials_file, 'r') as f:
        content = f.read()
        print(f"File size: {len(content)} bytes")
        try:
            credentials = json.loads(content)
            print("JSON parsed successfully")
            print("Keys:", list(credentials.keys()))
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Error at position: {e.pos}")
else:
    print("Credentials file not found or not specified")
