PORT := 3000

all: build production

development:
	@echo "--- Running application in development mode ---"
	@if [ ! -d "./node_modules" ]; then npm ci; fi
	@if [ ! -f ".env.local" ]; then echo "=== ERROR: Please add a ".env.local" file to the code directory. ==="; exit 1; fi
	@npm run dev

build:
	@echo "--- Building docker image for application ---"
	@docker build -t sefila .

production:
	@echo "--- Running application in production mode ---"
	@if [ ! -f ".env.prod" ]; then echo "=== ERROR: Please add a ".env.prod" file to the code directory. ==="; exit 1; fi
	@docker run -p 3000:${PORT} --env-file ./.env.prod sefila:latest