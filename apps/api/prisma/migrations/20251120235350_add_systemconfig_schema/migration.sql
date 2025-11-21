-- CreateTable
CREATE TABLE "system_configs" (
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" VARCHAR(255) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("config_key")
);
