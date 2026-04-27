dev:
	docker-compose up --build

migrate-up:
	npm run migrate

seed:
	docker-compose exec api npx tsx src/db/seed.ts
