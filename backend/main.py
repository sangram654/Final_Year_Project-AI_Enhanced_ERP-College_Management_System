import uvicorn
# pyrefly: ignore [missing-import]
from app.config import settings
# pyrefly: ignore [missing-import]
from app.main import app

if __name__ == "__main__":
    port = int(settings.PORT)
    print(f"Starting Samarth College ERP Python Backend on port {port}...")
    # pyrefly: ignore [missing-import]
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
