-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "nickname" VARCHAR(100),
    "avatar" VARCHAR(255),
    "phone" VARCHAR(20) NOT NULL,
    "phone_md5" VARCHAR(32) NOT NULL,
    "invite_code" VARCHAR(20),
    "vip_level" SMALLINT NOT NULL DEFAULT 0,
    "kyc_status" SMALLINT NOT NULL DEFAULT 0,
    "delivery_address_id" TEXT,
    "self_exclusion_expire_at" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_login_logs" (
    "log_id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "login_time" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_type" SMALLINT NOT NULL,
    "login_method" VARCHAR(50),
    "login_ip" VARCHAR(50),
    "login_device" VARCHAR(100),
    "user_agent" TEXT,
    "device_id" VARCHAR(100),
    "country_code" VARCHAR(10),
    "city" VARCHAR(100),
    "login_status" SMALLINT NOT NULL DEFAULT 1,
    "fail_reason" VARCHAR(200),
    "token_issued" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "user_login_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "oauth_id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "provider_email" VARCHAR(255),
    "provider_nickname" VARCHAR(100),
    "provider_avatar" VARCHAR(255),
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMPTZ(3),
    "bind_status" SMALLINT NOT NULL DEFAULT 1,
    "first_bind_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("oauth_id")
);

-- CreateTable
CREATE TABLE "sms_verification_codes" (
    "code_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" VARCHAR(20) NOT NULL,
    "country_code" VARCHAR(10) NOT NULL DEFAULT '63',
    "code_hash" VARCHAR(100) NOT NULL,
    "code_type" SMALLINT NOT NULL,
    "send_status" SMALLINT NOT NULL DEFAULT 1,
    "send_result" TEXT,
    "sms_provider" VARCHAR(50),
    "sms_message_id" VARCHAR(100),
    "verify_status" SMALLINT NOT NULL DEFAULT 0,
    "verify_times" INTEGER NOT NULL DEFAULT 0,
    "max_verify_times" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "request_ip" VARCHAR(100),

    CONSTRAINT "sms_verification_codes_pkey" PRIMARY KEY ("code_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_invite_code_key" ON "users"("invite_code");

-- CreateIndex
CREATE INDEX "idx_user_phone_md5" ON "users"("phone_md5");

-- CreateIndex
CREATE INDEX "idx_user_invite_code" ON "users"("invite_code");

-- CreateIndex
CREATE INDEX "idx_user_kyc_status" ON "users"("kyc_status");

-- CreateIndex
CREATE INDEX "idx_login_log_user" ON "user_login_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_login_log_time" ON "user_login_logs"("login_time");

-- CreateIndex
CREATE INDEX "idx_login_log_type" ON "user_login_logs"("login_type");

-- CreateIndex
CREATE INDEX "idx_login_log_ip" ON "user_login_logs"("login_ip");

-- CreateIndex
CREATE INDEX "idx_oauth_user" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_oauth_provider" ON "oauth_accounts"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "uk_oauth_provider_user" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "idx_sms_phone" ON "sms_verification_codes"("phone");

-- CreateIndex
CREATE INDEX "idx_sms_code_type" ON "sms_verification_codes"("code_type");

-- CreateIndex
CREATE INDEX "idx_sms_verify_status" ON "sms_verification_codes"("verify_status");

-- CreateIndex
CREATE INDEX "idx_sms_expires_at" ON "sms_verification_codes"("expires_at");

-- CreateIndex
CREATE INDEX "idx_sms_created_at" ON "sms_verification_codes"("created_at");

-- AddForeignKey
ALTER TABLE "user_login_logs" ADD CONSTRAINT "user_login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
