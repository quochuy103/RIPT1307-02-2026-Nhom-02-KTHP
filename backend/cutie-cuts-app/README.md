# Cutie Cuts Backend

Backend uses Spring Boot 3, Java 17, and PostgreSQL.

## Requirements

- Java 17
- PostgreSQL 16+ or Docker Desktop

## Environment variables

The backend reads configuration from environment variables. Copy `.env.example` as a reference and set these values in your terminal, IDE run configuration, or deployment environment.

| Variable | Default | Description |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/haircut_db` | PostgreSQL JDBC URL |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Database password |
| `SERVER_PORT` | `8081` | Spring Boot server port |
| `JWT_SECRET` | none | Secret used to sign JWT tokens |

Note: Spring Boot does not load `.env` automatically by itself. The `.env.example` file is a template only.

## Quick start with Docker

1. Start both backend and PostgreSQL:

```bash
docker compose up --build -d
```

2. Open the backend at `http://localhost:8081`.

PostgreSQL in Docker is exposed on `localhost:5433` so it does not conflict with a local PostgreSQL instance already using port `5432`.

3. Stop containers when finished:

```bash
docker compose down
```

If you want to remove the PostgreSQL data volume too:

```bash
docker compose down -v
```

The Docker setup already injects these values for the backend container:

- `DB_URL=jdbc:postgresql://postgres:5432/haircut_db`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=postgres`
- `SERVER_PORT=8081`
- `JWT_SECRET=change-me-to-a-long-random-secret-key-at-least-32-bytes`

For pgAdmin running on your machine, use:

- `Host`: `localhost`
- `Port`: `5433`
- `Database`: `haircut_db`
- `Username`: `postgres`
- `Password`: `postgres`

Update `backend/cutie-cuts-app/docker-compose.yml` before deploying if you want a different password or JWT secret.

## Quick start without Docker

1. Install PostgreSQL locally.
2. Create a database named `haircut_db`.
3. Set the environment variables to match your local PostgreSQL account.
4. Run `mvnw.cmd spring-boot:run` on Windows or `./mvnw spring-boot:run` on macOS/Linux.

## Notes

- `spring.jpa.hibernate.ddl-auto=update` lets Hibernate create or update tables automatically.
- `src/main/resources/schema.sql` runs on startup and applies safe updates for the `users` table.
- If you use a different database name, port, or password, only the environment variables need to change.