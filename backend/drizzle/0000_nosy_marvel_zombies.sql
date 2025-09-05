CREATE TABLE "tbl_businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"business_name" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"address" varchar(255) NOT NULL,
	"logo_url" varchar NOT NULL,
	"operating_hours" varchar NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tbl_businesses_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tbl_merchants" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"password" varchar NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(11),
	"role" varchar(50) DEFAULT 'merchant',
	CONSTRAINT "tbl_merchants_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "tbl_businesses" ADD CONSTRAINT "tbl_businesses_user_id_tbl_merchants_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_merchants"("id") ON DELETE no action ON UPDATE no action;