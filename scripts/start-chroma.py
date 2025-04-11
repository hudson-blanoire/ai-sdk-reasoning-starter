import os
import sys
import importlib
import uvicorn
from chromadb import Server

if __name__ == "__main__":
    # Start the ChromaDB server
    print("Starting ChromaDB server on http://0.0.0.0:8000")
    server = Server(host="0.0.0.0", port=8000)
    server.run()
