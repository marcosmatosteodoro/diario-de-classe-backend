-- CreateEnum
CREATE TYPE "Idioma" AS ENUM ('INGLES', 'ESPANHOL');

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "idioma" "Idioma" NOT NULL DEFAULT 'INGLES';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "idiomas" "Idioma"[];
