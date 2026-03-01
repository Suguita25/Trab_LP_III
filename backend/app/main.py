from fastapi import FastAPI

app = FastAPI(title="Backend - Projeto Lab Prog III")

@app.get("/health")
def health():
    return {"status": "ok"}