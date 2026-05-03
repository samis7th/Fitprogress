import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import dashboard, dieta, exercicios, metas, peso, semana, treinos


def get_cors_origins() -> list[str]:
    origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    )
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app = FastAPI(
    title="FitProgress API",
    description="Backend para dashboard de academia com FastAPI e Supabase.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(treinos.router)
app.include_router(exercicios.router)
app.include_router(peso.router)
app.include_router(metas.router)
app.include_router(dieta.router)
app.include_router(dashboard.router)
app.include_router(semana.router)


@app.get("/", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "message": "FitProgress API online",
    }
