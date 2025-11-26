import {Body, Controller, HttpCode, HttpStatus, Post, Query, UseGuards} from "@nestjs/common";
import {OrderService} from "@api/orders/order.service";
import {JwtAuthGuard} from "@api/auth/jwt.guard";
import {ApiBearerAuth, ApiOkResponse, ApiProperty} from "@nestjs/swagger";
import {CheckoutDto} from "@api/orders/dto/checkout.dto";
import {CurrentUserId} from "@api/auth/user.decorator";
import {CheckoutResponseDto} from "@api/orders/dto/checkout-response.dto";
import {ListOrdersDto} from "@api/orders/dto/list-orders.dto";
import {OrderDetailDto} from "@api/orders/dto/order-detail.dto";

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

    // List orders endpoint
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('list')
    @HttpCode(HttpStatus.OK)
    async list(@CurrentUserId() userId: string, @Body() body: ListOrdersDto){
        const res = await this.orders.listOrders(userId, body);
        console.log('list orders res=', res);
        return res;
    }

    // order details endpoint
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('detail')
    @HttpCode(HttpStatus.OK)
    async detail(@Body() body:OrderDetailDto, @CurrentUserId() userId:string ){
        return await this.orders.getOrderDetail(userId, body.orderId);
    }

}