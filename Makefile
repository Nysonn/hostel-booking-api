dev:
	docker-compose up --build

migrate:
	npx prisma migrate deploy

migrate-dev:
	npx prisma migrate dev

generate:
	npx prisma generate

seed:
	docker-compose exec api npx tsx src/db/seed.ts
