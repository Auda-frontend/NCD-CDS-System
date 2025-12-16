import asyncio
from database.session import engine
from sqlalchemy import text

async def check():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'visits' AND column_name IN ('chief_complaint', 'complaints', 'symptoms');"))
        columns = result.fetchall()
        print('Visit columns:', [c[0] for c in columns])

asyncio.run(check())