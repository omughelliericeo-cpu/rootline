-- AlterTable
ALTER TABLE "route_stop" ALTER COLUMN "address" SET DEFAULT '',
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;
