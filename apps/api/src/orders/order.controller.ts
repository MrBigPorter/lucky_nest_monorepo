import {Body, Controller, HttpCode, HttpStatus, Post, UseGuards} from "@nestjs/common";
import {OrderService} from "@api/orders/order.service";
import {JwtAuthGuard} from "@api/auth/jwt.guard";
import {ApiBearerAuth, ApiOkResponse, ApiProperty} from "@nestjs/swagger";
import {CheckoutDto} from "@api/orders/dto/checkout.dto";
import {CurrentUserId} from "@api/auth/user.decorator";
import {CheckoutResponseDto} from "@api/orders/dto/checkout-response.dto";

@Controller('orders')
export class OrderController {
    // Order-related endpoints would be defined here
    constructor(private orders: OrderService) {
    }


    // Checkout endpoint
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('checkout')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: CheckoutResponseDto })
    async checkout(@Body() dto: CheckoutDto, @CurrentUserId() userId: string) : Promise<CheckoutResponseDto> {
        return await this.orders.checkOut(userId, dto);
    }
}