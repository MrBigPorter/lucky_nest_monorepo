-- CreateTable
CREATE TABLE "user_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "real_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "coin_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "frozen_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_recharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_withdraw" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "transaction_no" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "transaction_type" INTEGER NOT NULL,
    "balance_type" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "related_id" TEXT,
    "related_type" TEXT,
    "description" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_userId_key" ON "user_wallets"("userId");

-- CreateIndex
CREATE INDEX "idx_user_id" ON "user_wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_transaction_no_key" ON "wallet_transactions"("transaction_no");

-- CreateIndex
CREATE INDEX "idx_user_id_txn" ON "wallet_transactions"("user_id");

-- CreateIndex
CREATE INDEX "idx_transaction_no" ON "wallet_transactions"("transaction_no");

-- CreateIndex
CREATE INDEX "idx_type" ON "wallet_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "idx_balance_type" ON "wallet_transactions"("balance_type");

-- CreateIndex
CREATE INDEX "idx_created_at" ON "wallet_transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_user_type" ON "wallet_transactions"("user_id", "transaction_type");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "user_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
