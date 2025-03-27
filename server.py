from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import time
import uvicorn

app = FastAPI()

# Configure CORS for allowing frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend origin instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def event_producer(queue: asyncio.Queue):
    """Populates queue with demo events for each client"""
    for counter in range(5):
        data = json.dumps({"count": counter, "time": time.time()})
        await queue.put(data)
        await asyncio.sleep(0.5)
    data = json.dumps({"type": "completion", "message": "Stream complete", "count": -1, "time": time.time()});
    await queue.put(data);

@app.get("/api/sse")
async def sse_endpoint():
    """SSE endpoint with queue-based event handling"""
    client_queue = asyncio.Queue()
    
    # Start event production for this client
    asyncio.create_task(event_producer(client_queue))

    async def event_generator():
        """Yields events from queue until termination signal"""
        while True:
            data = await client_queue.get()
            if data is None:  # End-of-stream marker
                break
            yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/")
def root():
    return {"message": "Queue-based SSE server operational"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
