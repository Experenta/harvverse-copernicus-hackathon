CREATE TYPE "public"."copernicus_source_mode" AS ENUM('fixture', 'live');--> statement-breakpoint
CREATE TYPE "public"."eudr_status" AS ENUM('verified', 'non_compliant', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."risk_tier" AS ENUM('excellent', 'good', 'moderate', 'high_risk', 'not_viable');--> statement-breakpoint
CREATE TABLE "copernicus_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer NOT NULL,
	"farm_id" integer NOT NULL,
	"source_mode" "copernicus_source_mode" NOT NULL,
	"score_version" varchar(40) NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_tier" "risk_tier" NOT NULL,
	"eudr_status" "eudr_status" NOT NULL,
	"eligible_for_investment" boolean NOT NULL,
	"variables" jsonb NOT NULL,
	"polygon" jsonb,
	"sentinel2" jsonb NOT NULL,
	"sentinel1" jsonb NOT NULL,
	"dem" jsonb NOT NULL,
	"era5" jsonb NOT NULL,
	"eudr" jsonb NOT NULL,
	"yield_predict" jsonb NOT NULL,
	"chain" jsonb NOT NULL,
	"signed_payload" jsonb NOT NULL,
	"score_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "risk_score" integer;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "risk_tier" "risk_tier";--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "eudr_status" "eudr_status";--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "score_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "score_version" varchar(40);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "score_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "copernicus_snapshot_id" integer;--> statement-breakpoint
ALTER TABLE "copernicus_snapshots" ADD CONSTRAINT "copernicus_snapshots_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copernicus_snapshots" ADD CONSTRAINT "copernicus_snapshots_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_copernicus_snapshot_id_copernicus_snapshots_id_fk" FOREIGN KEY ("copernicus_snapshot_id") REFERENCES "public"."copernicus_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "copernicus_snapshots_lot_created_idx" ON "copernicus_snapshots" USING btree ("lot_id","created_at");--> statement-breakpoint
CREATE INDEX "copernicus_snapshots_score_hash_idx" ON "copernicus_snapshots" USING btree ("score_hash");
