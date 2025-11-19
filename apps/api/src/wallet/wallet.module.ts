import {Module} from "@nestjs/common";
import {WalletService} from "@api/wallet/wallet.service";
import {WalletController} from "@api/wallet/wallet.controller";

@Module({
    providers:[WalletService],
    exports: [WalletService],
    controllers:[WalletController],
})

export class WalletModule {}