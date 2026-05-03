dev:
	docker-compose up --build

migrate:
	docker-compose run --rm --no-deps api npx prisma migrate deploy

migrate-dev:
	npx prisma migrate dev

generate:
	npx prisma generate

seed:
	docker-compose exec api npx tsx src/db/seed.ts
