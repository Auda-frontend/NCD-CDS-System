# Backend - Running Alembic migrations

If you want to run Alembic migrations from the container, the backend image must include the `alembic.ini` and the `alembic/` directory. The Dockerfile now copies these into the image.

Rebuild the backend image after making any requirements changes (for example, adding `alembic`):

```powershell
# Rebuild the backend image and restart the service
docker compose build --no-cache backend
docker compose up -d backend
```

Run Alembic inside the container (preferred when the CLI is installed in the image):

```powershell
docker compose exec backend alembic revision --autogenerate -m "initial tables"
docker compose exec backend alembic upgrade head
```

If the `alembic` entrypoint isn't present in PATH or you want to be explicit, use Python module mode which uses the same interpreter the app uses:

```powershell
docker compose exec backend python -m alembic revision --autogenerate -m "initial tables"
docker compose exec backend python -m alembic upgrade head
```

Alternatively, during development you can run alembic locally in your virtualenv on the host (the project already provides `backend/alembic.ini` and `backend/alembic`).
