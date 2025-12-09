from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from fastapi import Depends
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://auda:N1saw2Auda@postgres:5432/clinical_cds"
)

engine = create_async_engine(
    DATABASE_URL,
    future=True,
    echo=True,  # Turn OFF in production
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def get_db():
    """
    Database session dependency for FastAPI routes.
    CRUD functions handle their own commits/rollbacks.
    This dependency ensures the session is properly managed.
    """
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            # Only rollback if there's an unhandled exception
            # and the session is still in a transaction
            # CRUD functions handle their own commits/rollbacks
            try:
                # Check if session is still active and in transaction
                if not session.is_closed and session.in_transaction():
                    await session.rollback()
            except Exception:
                # Session might already be closed or committed, ignore
                pass
            raise
        # Context manager automatically closes the session
