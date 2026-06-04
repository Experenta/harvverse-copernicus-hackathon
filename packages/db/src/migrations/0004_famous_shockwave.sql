CREATE TYPE "public"."attachment_owner_type" AS ENUM('user', 'farm', 'lot');--> statement-breakpoint
CREATE TYPE "public"."attachment_purpose" AS ENUM('dni_image', 'ihcafe_card', 'farm_panorama', 'farm_map', 'lot_photo', 'plant_photo', 'other');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_type" "attachment_owner_type" NOT NULL,
	"owner_id" integer NOT NULL,
	"purpose" "attachment_purpose" DEFAULT 'other' NOT NULL,
	"storage_provider" varchar(20) DEFAULT 'database' NOT NULL,
	"storage_bucket" text,
	"storage_key" text,
	"url" text,
	"mime_type" varchar(50),
	"filename" text,
	"size_bytes" integer,
	"checksum_sha256" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "producer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"legal_full_name" text,
	"dni" text,
	"ihcafe_number" text,
	"whatsapp_phone" text,
	"residence_department" text,
	"residence_municipality" text,
	"coffee_experience_years" integer,
	"current_certifications" text[],
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "producer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "producer_profiles" ADD CONSTRAINT "producer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_owner_idx" ON "attachments" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "attachments_purpose_idx" ON "attachments" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "producer_profiles_user_id_idx" ON "producer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "producer_profiles_dni_idx" ON "producer_profiles" USING btree ("dni");